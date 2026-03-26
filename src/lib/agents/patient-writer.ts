// src/lib/agents/patient-writer.ts
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic'
import type { PatientWriterInput, PatientWriterOutput } from '@/types/agents'

export async function writePatientVersion(input: PatientWriterInput): Promise<PatientWriterOutput> {
  const prompt = `Tu es un kinésithérapeute qui rédige un document de rééducation pour son patient.
Le document doit être compréhensible, rassurant, motivant — sans jargon médical.

## Informations du protocole
- Pathologie : ${input.pathologyName}
- Phase actuelle : ${input.phaseName}
- Objectifs de la phase : ${input.objectives.join(', ')}
- Critères pour passer à la phase suivante : ${input.progressionCriteria.join(', ')}
- Exercices prescrits :
${input.exercises.map((e, i) => `  ${i + 1}. ${e.name} — ${e.sets ?? ''}x${e.reps ?? ''} (repos ${e.rest ?? ''}) — ${e.description}`).join('\n')}

## Patient
- Âge : ${input.patientAge ?? 'non renseigné'}
- Sport : ${input.patientSport ?? 'non sportif'}
- Langue : ${input.language ?? 'français'}

## Format attendu (JSON strict)
{
  "title": "Titre accrocheur et positif pour le document",
  "introduction": "Paragraphe d'introduction bienveillant (3-4 phrases max)",
  "objectives": ["Objectif reformulé simplement 1", "Objectif 2"],
  "exercises": [
    {
      "name": "Nom simple de l'exercice",
      "howTo": "Explication simple en 2-3 phrases, sans jargon",
      "sets": "3 séries de 10 répétitions",
      "tip": "Conseil pratique ou point de vigilance"
    }
  ],
  "progressionMessage": "Message positif expliquant quand/comment la progression sera évaluée",
  "importantWarnings": ["Signe d'alarme 1 qui nécessite de contacter le kiné", "Signe 2"],
  "motivationalClose": "Message de clôture motivant et personnalisé"
}

Réponds UNIQUEMENT avec le JSON.`

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Agent 3 (patient-writer) : réponse non parseable')
  return JSON.parse(jsonMatch[0]) as PatientWriterOutput
}
