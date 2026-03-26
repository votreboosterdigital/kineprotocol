import { jsonrepair } from 'jsonrepair'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic'
import type { ExerciseLibrarianInput, ExerciseLibrarianOutput } from '@/types/agents'

export async function enrichExercise(input: ExerciseLibrarianInput): Promise<ExerciseLibrarianOutput> {
  const prompt = `Tu es un expert en sciences du mouvement et en kinésithérapie.
Standardise et enrichis cet exercice pour une base de données professionnelle.

## Exercice à enrichir
- Nom : ${input.name}
- Région : ${input.region}
- Objectif déclaré : ${input.objective}

## Format de réponse attendu (JSON strict)
{
  "name": "Nom standardisé et précis",
  "slug": "nom-en-kebab-case-unique",
  "description": "Description technique complète (3-4 phrases) pour un kinésithérapeute",
  "cues": ["Consigne de placement 1", "Consigne d'exécution 2", "Point d'attention 3"],
  "commonErrors": ["Erreur biomécanique fréquente 1", "Compensation fréquente 2"],
  "variants": ["Version facilitée", "Version progressée", "Version avec matériel"],
  "tags": ["tag1", "tag2", "tag3"],
  "suggestedVideoSearch": "termes de recherche YouTube optimaux pour trouver une vidéo de référence"
}

Réponds UNIQUEMENT avec le JSON.`

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
  try {
    return JSON.parse(text) as ExerciseLibrarianOutput
  } catch {
    try {
      return JSON.parse(jsonrepair(text)) as ExerciseLibrarianOutput
    } catch {
      throw new Error('Agent 2 (exercise-librarian) : réponse non parseable')
    }
  }
}
