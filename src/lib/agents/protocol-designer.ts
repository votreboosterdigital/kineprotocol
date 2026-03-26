import { jsonrepair } from 'jsonrepair'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic'
import type { ProtocolDesignerInput, ProtocolDesignerOutput } from '@/types/agents'

export async function designProtocol(input: ProtocolDesignerInput): Promise<ProtocolDesignerOutput> {
  const prompt = `Tu es un kinésithérapeute expert en rééducation sportive et orthopédique.
Tu dois générer un protocole de rééducation structuré et evidence-based.

## Contexte patient
- Pathologie : ${input.pathologyName} (région : ${input.region})
- Phase : ${input.phaseName} (${input.phaseDescription})
- Critères d'entrée en phase validés : ${input.phaseCriteria.join(', ')}
- Âge patient : ${input.patientAge ?? 'non renseigné'}
- Sport : ${input.patientSport ?? 'non sportif'}
- Niveau : ${input.patientLevel ?? 'non renseigné'}
- Durée séance disponible : ${input.sessionDuration ?? 45} min
- Fréquence : ${input.sessionsPerWeek ?? 3}x/semaine
- Contraintes spécifiques : ${input.constraints.length > 0 ? input.constraints.join(', ') : 'aucune'}

## Ta mission
Génère un protocole complet en JSON strict avec cette structure exacte :

{
  "objectives": ["objectif 1", "objectif 2", "objectif 3"],
  "progressionCriteria": ["critère 1 pour passer à la phase suivante", "critère 2"],
  "sessionStructure": {
    "warmup": { "duration": 10, "description": "..." },
    "main": { "duration": 25, "description": "..." },
    "cooldown": { "duration": 10, "description": "..." }
  },
  "exercises": [
    {
      "name": "Nom de l'exercice",
      "region": "${input.region}",
      "objective": "objectif précis",
      "type": "STRENGTH|MOBILITY|PLYOMETRIC|MOTOR_CONTROL|STRETCHING|PROPRIOCEPTION|CARDIO",
      "level": "BEGINNER|INTERMEDIATE|ADVANCED",
      "equipment": ["matériel nécessaire"],
      "description": "Description technique précise pour le kiné",
      "cues": ["consigne 1", "consigne 2"],
      "commonErrors": ["erreur fréquente 1"],
      "variants": ["variante plus facile", "variante plus difficile"],
      "sets": 3,
      "reps": "10-15",
      "rest": "60s",
      "order": 1
    }
  ],
  "clinicalNotes": "Notes cliniques importantes pour le thérapeute"
}

Génère entre 5 et 8 exercices adaptés à la phase. Réponds UNIQUEMENT avec le JSON, sans markdown, sans commentaire.`

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''

  // Nettoyer les éventuels blocs markdown ```json ... ```
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

  const parse = (str: string): ProtocolDesignerOutput => {
    const result = JSON.parse(str)
    if (typeof result !== 'object' || result === null || !Array.isArray(result.objectives)) {
      throw new Error('structure invalide')
    }
    return result as ProtocolDesignerOutput
  }

  try {
    return parse(text)
  } catch {
    try {
      return parse(jsonrepair(text))
    } catch {
      console.error('[protocol-designer] réponse brute:', raw.slice(0, 600))
      throw new Error('Agent 1 (protocol-designer) : réponse non parseable')
    }
  }
}
