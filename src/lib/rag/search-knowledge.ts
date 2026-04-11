/**
 * Helper de recherche sémantique dans la base de connaissances cliniques
 * Embeddings : modèle local @xenova/transformers (384 dims)
 * Appelé par les agents avant chaque génération de protocole
 */

import { createClient } from '@supabase/supabase-js'

const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export interface KnowledgeChunk {
  id: string
  source_file: string
  content: string
  similarity: number
}

// Cache du pipeline pour éviter de recharger le modèle à chaque appel
let _pipeline: ((text: string, options?: object) => Promise<{ data: Float32Array }>) | null = null

async function getEmbeddingPipeline() {
  if (_pipeline) return _pipeline
  const { pipeline } = await import('@xenova/transformers') as any
  _pipeline = await pipeline('feature-extraction', EMBEDDING_MODEL, { quantized: true })
  return _pipeline!
}

async function generateEmbedding(text: string): Promise<number[]> {
  const pipe = await getEmbeddingPipeline()
  const result = await pipe(text, { pooling: 'mean', normalize: true })
  return Array.from(result.data as Float32Array)
}

/**
 * Recherche sémantique dans document_chunks
 * @param query - Question clinique en langage naturel
 * @param matchCount - Nombre de résultats (défaut : 5)
 * @param similarityThreshold - Seuil de similarité cosinus (défaut : 0.7)
 */
export async function searchClinicalKnowledge(
  query: string,
  matchCount: number = 5,
  similarityThreshold: number = 0.7
): Promise<KnowledgeChunk[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('[rag] Variables d\'env manquantes — recherche RAG ignorée')
    return []
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const queryEmbedding = await generateEmbedding(query)

    const { data, error } = await supabase.rpc('search_clinical_knowledge', {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      similarity_threshold: similarityThreshold,
    })

    if (error) {
      console.error('[rag] Erreur recherche pgvector:', error.message)
      return []
    }

    return (data as KnowledgeChunk[]) ?? []
  } catch (err) {
    console.error('[rag] Erreur inattendue:', err instanceof Error ? err.message : String(err))
    return []
  }
}
