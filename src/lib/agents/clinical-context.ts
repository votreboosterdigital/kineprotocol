import type { SinsInput, PatientProfileInput } from '@/types/agents'

const SINS_SEVERITY = {
  high: 'ÉLEVÉE → réduire charge de 30%, isométrie prioritaire, éviter DOMS',
  medium: 'MOYENNE → charge progressive tolérée, surveiller récupération J+1',
  low: 'FAIBLE → charge normale selon la phase',
}

const SINS_IRRITABILITY = {
  high: 'ÉLEVÉE → délai 48h minimum entre séances, éviter DOMS, exercices courts',
  medium: 'MOYENNE → surveiller récupération, adapter si douleur >3/10 J+1',
  low: 'FAIBLE → récupération normale, fréquence standard',
}

const SINS_NATURE = {
  neuropathic: "NEUROPATHIQUE → éviter étirements en fin d'amplitude, mobilisation neurale progressive, slider avant tensioner",
  inflammatory: "INFLAMMATOIRE → exercices en décharge en phase aiguë, isométrie anti-douleur, éviter chaleur locale",
  mechanical: 'MÉCANIQUE → charge progressive tolérée, repos relatif suffisant',
}

const STAGE_DIRECTIVES = {
  acute: `AIGU → Isométrie uniquement, pas d'excentrique lourd, charge ≤50% 1RM, POLICE protocol, repos relatif`,
  subacute: `SUBAIGU → Heavy Slow Resistance, excentriques progressifs 60-70% 1RM, introduire charges concentriques`,
  chronic: `CHRONIQUE → Charge maximale tolérée, sport-spécifique, critères RTS, progressivité accélérée`,
}

const LEVEL_DIRECTIVES = {
  elite: `ÉLITE → HSR, tempo excentrique 3-4s, RPE 7-8/10, mouvements sport-spécifiques avancés, plyométrie`,
  competitive: `COMPÉTITEUR → RPE 6-7/10, excentriques progressifs, sport-spécifique partiel`,
  amateur: `AMATEUR → RPE 5-6/10, sets réduits si besoin, instructions claires, focus compliance`,
  sedentary: `SÉDENTAIRE → RPE 4-5/10, démarrer 2 séries, instructions très simples, progression lente`,
}

const OBJECTIVE_DIRECTIVES = {
  return_performance: `RETOUR PERFORMANCE → Inclure critères LSI >90%, Hop tests, RPE 7-8/10, tempo excentrique, charge maximale sport-spécifique`,
  return_sport: `RETOUR SPORT → Continuum Ardern étape 2, mouvements sport-spécifiques, contact progressif, test LSI >85%`,
  return_activity: `RETOUR ACTIVITÉ → Activités de la vie quotidienne, compliance prioritaire, charge fonctionnelle`,
}

/**
 * Construit le bloc de contexte clinique injecté dans le system prompt du protocol-designer.
 * Pure function — testable indépendamment de l'agent.
 */
export function buildClinicalContext(
  sins: SinsInput | null | undefined,
  stage: 'acute' | 'subacute' | 'chronic' | null | undefined,
  patientProfile: PatientProfileInput | null | undefined
): string {
  const blocks: string[] = []

  if (sins) {
    blocks.push(`## Paramètres SINS
- Sévérité : ${SINS_SEVERITY[sins.severity]}
- Irritabilité : ${SINS_IRRITABILITY[sins.irritability]}
- Nature : ${SINS_NATURE[sins.nature]}`)
  }

  if (stage) {
    blocks.push(`## Stade clinique : ${STAGE_DIRECTIVES[stage]}`)
  }

  if (patientProfile) {
    blocks.push(`## Profil patient
- Niveau : ${LEVEL_DIRECTIVES[patientProfile.level]}
- Objectif : ${OBJECTIVE_DIRECTIVES[patientProfile.objective]}
- Séances : ${patientProfile.sessionsPerWeek}x/semaine, ${patientProfile.sessionDuration} min
- Âge : ${patientProfile.age} ans, ${patientProfile.sex === 'M' ? 'Homme' : 'Femme'}
- Sport : ${patientProfile.sport || 'non sportif'}`)
  }

  return blocks.join('\n\n')
}
