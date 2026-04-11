// src/lib/agents/patient-writer.ts
import { jsonrepair } from 'jsonrepair'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic'
import type { PatientWriterInput, PatientWriterOutput } from '@/types/agents'

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max attempts reached");
}

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
- Âge : ${input.patientProfile?.age ?? input.patientAge ?? 'non renseigné'}
- Sport : ${input.patientProfile?.sport ?? input.patientSport ?? 'non sportif'}
- Objectif : ${input.patientProfile?.objective ?? 'retour activité'}
- Langue : ${input.language ?? 'français'}

## Format attendu (JSON strict)
{
  "title": "Titre positif et motivant",
  "introduction": "Paragraphe bienveillant 3-4 phrases max",
  "objectives": ["Objectif reformulé simplement"],
  "exercises": [
    {
      "name": "Nom simple",
      "howTo": "Explication en 2-3 phrases sans jargon",
      "sets": "3 séries de 10 répétitions",
      "tip": "Conseil pratique",
      "whenToDo": "Quand le faire — ex: Après l'échauffement, jamais après une longue journée debout"
    }
  ],
  "progressionMessage": "Message positif sur la progression",
  "importantWarnings": ["Signe qui nécessite de contacter le kiné"],
  "motivationalClose": "Message de clôture motivant",
  "painEducation": {
    "alarmMetaphor": "Ta douleur est comme une alarme incendie sensible — elle ne signifie pas toujours qu'il y a un incendie. Une douleur modérée pendant l'exercice ne signifie pas que tu te blesses.",
    "flareUpPlan": [
      "Repos relatif : réduis l'activité mais ne t'arrête pas totalement",
      "Glace ou chaleur selon ta préférence — 15 min suffisent",
      "Reprends progressivement dès amélioration — une poussée n'est pas une nouvelle blessure"
    ]
  }
}

RÈGLES ABSOLUES :
- Remplacer "dégénérescence" par "adaptations naturelles"
- Remplacer "rupture partielle" par "tissu en cours de guérison"
- Remplacer "arthrose" par "changements liés à l'âge"
- Jamais de terme nocebo ou catastrophisant
- Appliquer systématiquement les principes PNE du guide ci-dessus
Réponds UNIQUEMENT avec le JSON.`

  const response = await withRetry(() => anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  }))

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
