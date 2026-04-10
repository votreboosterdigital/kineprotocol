import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  pathology: z.string().min(2).max(200),
})

// TTL cache : 30 jours en secondes
const CACHE_TTL_DAYS = 30

// Prompt de génération de revue clinique (aligné sur le skill kine-literature.md)
function buildLiteraturePrompt(pathology: string): string {
  return `Tu es un kinésithérapeute expert en médecine evidence-based.
Génère une revue de littérature clinique structurée pour la pathologie suivante : "${pathology}".

Produis UNIQUEMENT le JSON ci-dessous, sans markdown, sans commentaire :

{
  "pathology": "${pathology}",
  "generatedAt": "${new Date().toISOString()}",
  "clinicalConsensus": {
    "summary": "Résumé du consensus actuel en 2-3 phrases",
    "validatedTreatments": [
      {
        "intervention": "nom de l'intervention",
        "evidenceLevel": "A|B|C",
        "description": "description clinique courte"
      }
    ]
  },
  "openDebates": [
    {
      "topic": "sujet du débat",
      "position1": "argument 1",
      "position2": "argument contre"
    }
  ],
  "contraindications": {
    "absolute": ["contre-indication absolue"],
    "relative": ["contre-indication relative"]
  },
  "keyReferences": [
    {
      "title": "titre de l'étude",
      "authors": "Auteur et al.",
      "year": 2023,
      "journal": "nom du journal",
      "pmid": "PMID ou null",
      "url": "https://pubmed.ncbi.nlm.nih.gov/PMID"
    }
  ],
  "clinicalPearlsForProtocol": [
    "perle clinique pratique directement utilisable dans un protocole de rééducation"
  ]
}

Règles :
- Tous les champs textuels en français
- evidenceLevel : A = meta-analyse/RCT, B = cohorte/cas-contrôle, C = opinion d'expert
- Minimum 3 références, maximum 6 (2018-2026 de préférence)
- Si hors scope musculo-squelettique, retourner { "error": "pathologie hors scope KinéProtocol" }
- Répondre UNIQUEMENT avec le JSON, sans aucun texte autour`
}

export async function POST(req: NextRequest) {
  try {
    // Authentification requise
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // Validation de l'input
    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Paramètre invalide', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { pathology } = parsed.data
    const pathologyKey = pathology.toLowerCase().trim()

    // Vérification du cache Supabase (TTL 30 jours)
    const cached = await prisma.$queryRaw<Array<{
      content: unknown
      updated_at: Date
    }>>`
      SELECT content, updated_at
      FROM literature_cache
      WHERE pathology = ${pathologyKey}
        AND updated_at > NOW() - INTERVAL '${CACHE_TTL_DAYS} days'
      LIMIT 1
    `

    if (cached.length > 0) {
      return NextResponse.json({
        success: true,
        source: 'cache',
        data: cached[0].content,
      })
    }

    // Génération via Claude Haiku (coût minimal)
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: buildLiteraturePrompt(pathology) }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

    let literatureData: unknown
    try {
      literatureData = JSON.parse(text)
    } catch {
      console.error('[literature] réponse non parseable:', raw.slice(0, 400))
      return NextResponse.json(
        { error: 'Génération échouée — réponse invalide' },
        { status: 500 }
      )
    }

    // Mise en cache (upsert) dans Supabase
    await prisma.$executeRaw`
      INSERT INTO literature_cache (pathology, content, updated_at)
      VALUES (${pathologyKey}, ${JSON.stringify(literatureData)}::jsonb, NOW())
      ON CONFLICT (pathology)
      DO UPDATE SET content = ${JSON.stringify(literatureData)}::jsonb, updated_at = NOW()
    `

    return NextResponse.json({
      success: true,
      source: 'generated',
      data: literatureData,
    })
  } catch (error) {
    console.error('[literature]', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération de la revue clinique' },
      { status: 500 }
    )
  }
}
