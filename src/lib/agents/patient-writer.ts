// src/lib/agents/patient-writer.ts
import { jsonrepair } from 'jsonrepair'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic'
import type { PatientWriterInput, PatientWriterOutput } from '@/types/agents'

// Guide PNE — Communication thérapeutique et neurosciences de la douleur
const PNE_GUIDE = `
### 1. Principes PNE (Pain Neuroscience Education)

Phase Aiguë — L'alarme utile :
- Valider la douleur ET expliquer qu'elle agit comme système d'alarme protecteur des tissus
- Hurt ≠ Harm (douleur ≠ lésion) : ressentir de la douleur pendant le mouvement ≠ nouvelle blessure
- Donner des délais de guérison naturels pour réduire l'anxiété (ex: tissu guérit en 6-12 semaines)

Phase Chronique — L'alarme hypersensible :
- La douleur persistante = indicateur du besoin de protection du cerveau, pas état des tissus
- Bioplasticité : le système nerveux peut réapprendre à être moins protecteur
- Équilibre DIM/SIM : signaux de danger (Danger In Me) vs signaux de sécurité (Safety In Me)

### 2. Vocabulaire : Nocebo → Empowerment

ÉVITER → REMPLACER PAR :
- "Os contre os / Usure" → "Changements liés à l'âge et à la charge"
- "Disque écrasé / hernie massive" → "Adaptations normales / Kisses of time"
- "Votre dos est instable" → "Votre dos est une plateforme stable"
- "Nerf coincé" → "Nerf sensible / irrité"
- "Dégénérescence" → "Signes de vie et d'expérience"
- "Glissements de vertèbre" → "Position désynchronisée"

### 3. Métaphores Thérapeutiques
- Sensibilisation centrale : alarme de maison trop sensible (déclenche au chat/vent = pas de cambrioleur)
- Douleur ≠ dégât tissulaire : douche tiède sur coup de soleil (douleur réelle, capteurs sensibilisés)
- Mouvement progressif : paquebot quittant le port (navire fait pour la mer, pas le port)

### 4. Messages de réassurance par pathologie
- Rachis/lombalgie : "Votre dos est conçu pour la force et le mouvement, pas pour être protégé excessivement"
- Arthrose : "Les radios montrent des 'rides intérieures' ou 'bisous du temps' — votre histoire, pas votre douleur"
- Prothèse genou : "'Mise à jour de la surface articulaire' plutôt que remplacement total"
- Épaule coiffe : "Les tendons sont incroyablement résilients — ils s'adaptent à la charge progressive"

### 5. Drapeaux Jaunes — Réponses aux croyances limitantes
- Catastrophisation ("je vais finir en fauteuil") → expliquer bioplasticité + capacité de récupération
- Kinésiophobie (peur du mouvement) → modèle Twin Peaks : douleur apparaît avant réel danger tissulaire
- Sentiment d'impuissance → transformer patient de receveur passif en participant actif (respiration, auto-traitement)

### 6. Formulations pour l'adhérence
- Lien avec valeurs : "Ces exercices = votre chemin pour jouer à nouveau avec vos petits-enfants"
- Contrat de confiance : "Il y aura des hauts et des bas (thérapie Toblerone) — chaque pas = lotion pour votre SN"
- Cues externes : "Poussez le sol loin de vous" (pas "contractez votre muscle")
- Normalisation des poussées : "Une poussée = votre alarme criait STOP trop tôt — pas cassé quelque chose. Respirez."
`

export async function writePatientVersion(input: PatientWriterInput): Promise<PatientWriterOutput> {
  const prompt = `Tu es un kinésithérapeute qui rédige un document de rééducation pour son patient.
Le document doit être compréhensible, rassurant, motivant — sans jargon médical.
Applique systématiquement les principes PNE et le vocabulaire empowerment ci-dessous.

## Guide PNE et Communication Thérapeutique
${PNE_GUIDE}


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

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
  try {
    return JSON.parse(text) as PatientWriterOutput
  } catch {
    try {
      return JSON.parse(jsonrepair(text)) as PatientWriterOutput
    } catch {
      throw new Error('Agent 3 (patient-writer) : réponse non parseable')
    }
  }
}
