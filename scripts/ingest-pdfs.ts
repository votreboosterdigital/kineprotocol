/**
 * Script one-shot d'ingestion des PDFs cliniques vers pgvector
 * Embeddings : modèle local @xenova/transformers (Xenova/all-MiniLM-L6-v2, 384 dims)
 * Usage : npm run ingest
 * Prérequis : pgvector activé + table document_chunks créée (SQL Tâche 1, VECTOR(384))
 */

import { createClient } from '@supabase/supabase-js'
import pdfParse from 'pdf-parse'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Variables manquantes : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const BUCKET = 'clinical-sources'
const CHUNK_SIZE = 500      // tokens approximatifs par chunk
const CHUNK_OVERLAP = 50    // tokens de recouvrement
const CHARS_PER_TOKEN = 4
const CHUNK_CHARS = CHUNK_SIZE * CHARS_PER_TOKEN
const OVERLAP_CHARS = CHUNK_OVERLAP * CHARS_PER_TOKEN
const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2'

// Pipeline d'embedding (chargé une seule fois)
let embeddingPipeline: ((texts: string | string[], options?: object) => Promise<{ data: Float32Array[] }>) | null = null

async function getEmbeddingPipeline() {
  if (embeddingPipeline) return embeddingPipeline

  console.log(`Chargement du modèle ${EMBEDDING_MODEL} (première exécution : ~80MB téléchargés)...`)
  // Import dynamique pour compatibilité ts-node
  const { pipeline } = await import('@xenova/transformers') as any
  embeddingPipeline = await pipeline('feature-extraction', EMBEDDING_MODEL, {
    quantized: true,
  })
  console.log('Modèle chargé ✓\n')
  return embeddingPipeline!
}

/**
 * Génère l'embedding d'un texte via le modèle local
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const pipe = await getEmbeddingPipeline()
  const result = await pipe(text, { pooling: 'mean', normalize: true })
  // Convertir Float32Array en number[]
  return Array.from(result.data as unknown as Float32Array)
}

/**
 * Découpe le texte en chunks avec overlap, en respectant les fins de paragraphes
 */
function splitIntoChunks(text: string): string[] {
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const chunks: string[] = []
  let start = 0

  while (start < cleaned.length) {
    let end = start + CHUNK_CHARS

    if (end >= cleaned.length) {
      chunks.push(cleaned.slice(start).trim())
      break
    }

    let splitAt = end

    // Priorité 1 : fin de paragraphe
    const lastParagraph = cleaned.lastIndexOf('\n\n', end)
    if (lastParagraph > start + CHUNK_CHARS / 2) {
      splitAt = lastParagraph
    } else {
      // Priorité 2 : fin de phrase
      const sentenceEnd = Math.max(
        cleaned.lastIndexOf('. ', end),
        cleaned.lastIndexOf('.\n', end),
        cleaned.lastIndexOf('! ', end),
        cleaned.lastIndexOf('? ', end)
      )
      if (sentenceEnd > start + CHUNK_CHARS / 2) {
        splitAt = sentenceEnd + 1
      }
    }

    const chunk = cleaned.slice(start, splitAt).trim()
    if (chunk.length > 0) chunks.push(chunk)

    start = splitAt - OVERLAP_CHARS
    if (start < 0) start = 0
  }

  return chunks.filter(c => c.length > 50)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  const startTime = Date.now()
  console.log('=== Ingestion PDFs cliniques → pgvector ===\n')

  // Lister tous les fichiers du bucket
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET)
    .list('', { limit: 200 })

  if (listError) {
    console.error('Erreur listing bucket:', listError.message)
    process.exit(1)
  }

  const pdfFiles = (files ?? []).filter(f => f.name.endsWith('.pdf'))
  console.log(`${pdfFiles.length} PDFs trouvés dans le bucket "${BUCKET}"\n`)

  let totalChunks = 0
  let skipped = 0
  let errors = 0

  // Pré-charger le modèle avant la boucle
  await getEmbeddingPipeline()

  for (let i = 0; i < pdfFiles.length; i++) {
    const file = pdfFiles[i]
    const fileName = file.name
    const prefix = `[${i + 1}/${pdfFiles.length}] ${fileName}`

    try {
      // Vérifier si déjà indexé
      const { count } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('source_file', fileName)

      if ((count ?? 0) > 0) {
        console.log(`${prefix} — ⏭  déjà indexé (${count} chunks), skip`)
        skipped++
        continue
      }

      // Télécharger le PDF
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(BUCKET)
        .download(fileName)

      if (downloadError || !fileData) {
        console.error(`${prefix} — ERREUR téléchargement: ${downloadError?.message}`)
        errors++
        continue
      }

      // Extraire le texte
      const buffer = Buffer.from(await fileData.arrayBuffer())
      const parsed = await pdfParse(buffer)
      const text = parsed.text

      if (!text || text.trim().length < 100) {
        console.log(`${prefix} — ⚠  texte trop court ou vide, skip`)
        continue
      }

      // Découper en chunks
      const chunks = splitIntoChunks(text)
      console.log(`${prefix} — ${chunks.length} chunks`)

      // Générer les embeddings et insérer
      for (let j = 0; j < chunks.length; j++) {
        const chunk = chunks[j]
        const embedding = await generateEmbedding(chunk)

        const { error: insertError } = await supabase
          .from('document_chunks')
          .insert({
            source_file: fileName,
            chunk_index: j,
            content: chunk,
            embedding,
            metadata: {
              total_chunks: chunks.length,
              char_count: chunk.length,
              page_count: parsed.numpages,
              embedding_model: EMBEDDING_MODEL,
            },
          })

        if (insertError) {
          console.error(`  → Erreur insertion chunk ${j}: ${insertError.message}`)
        }

        // Petit délai pour ne pas saturer Supabase
        await sleep(50)
      }

      totalChunks += chunks.length
      console.log(`  ✓ ${chunks.length} chunks insérés`)

    } catch (err) {
      console.error(`${prefix} — ERREUR: ${err instanceof Error ? err.message : String(err)}`)
      errors++
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('\n=== Résumé ===')
  console.log(`PDFs traités : ${pdfFiles.length - skipped - errors}`)
  console.log(`PDFs skippés (déjà indexés) : ${skipped}`)
  console.log(`PDFs en erreur : ${errors}`)
  console.log(`Total chunks créés : ${totalChunks}`)
  console.log(`Modèle : ${EMBEDDING_MODEL} (local, gratuit)`)
  console.log(`Durée : ${durationSec}s`)
}

main().catch(err => {
  console.error('Erreur fatale:', err)
  process.exit(1)
})
