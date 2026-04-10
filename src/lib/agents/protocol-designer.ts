import { jsonrepair } from 'jsonrepair'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic'
import type { ProtocolDesignerInput, ProtocolDesignerOutput } from '@/types/agents'

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

// Guide de référence clinique evidence-based (6 régions anatomiques)
const CLINICAL_REFERENCE = `
### 1. RACHIS (Cervical, Thoracique, Lombaire)
#### Phases de prise en charge
- Aiguë (<7j) : réduction douleur, éducation, repos lit contre-indiqué (max 48h sévère), reprise précoce ADL
- Subaiguë (4-12 sem) : exercices actifs supervisés, contrôle moteur (transverse abdomen, multifides)
- Renforcement/RTS : kinetic chain (hanche+thorax), charges axiales, mouvements sport-spécifiques
#### Critères de progression et Paramètres de charge
- Spondylolyse : S0-8 protection/no impact | S9-16 course lente si indolore | S17+ performance
- Charge renforcement : 2-3 séries 8-12 rép à 60-80% 1RM
#### Drapeaux Rouges
- Généraux : âge <20/>55, douleur non mécanique constante, cancer ATCD, perte poids, fièvre, signes neuro étendus
- Urgence : syndrome queue de cheval (anesthésie en selle, dysfonction sphinctérienne)
- Cervical : Canadian C-Spine Rule fractures, screening vasculaire (5D, 3N) avant thérapie manuelle

### 2. ÉPAULE (Bern Consensus 2022)
#### Phases de prise en charge
- Aiguë : réduction douleur/inflammation, mobilité, stabilité dynamique, chaîne semi-fermée
- Intermédiaire : isotonique coiffe + rétracteurs scapula, intégration kinetic chain + core
- RTS : plyométrie précoce, thrower's program (accélération/décélération)
#### Critères RTS (6 domaines)
- Douleur (NRS), Mobilité (GIRD <20°), Force (ratio RE/RI 66-75%), Chaîne cinétique, Psychologie (SIRSI/I-PRRS), Performance spécifique
- Charge : 70-85% 1RM 2-3x/sem pour hypertrophie/force
#### Drapeaux Rouges
- Exclure douleur référée cervicale (test Spurling), néoplasme (douleur nocturne sévère, scapula limitée)

### 3. GENOU
#### Phases de prise en charge
- Aiguë : POLICE, extension complète + activation quadriceps
- Subaiguë : chaîne fermée (squats <60° flexion), équilibre
- Renforcement : Heavy Slow Resistance isotonique
- RTS : OFR (mouvements linéaires → multidirectionnels → skills → sport-spécifique → contact)
#### Critères RTS
- LSI >90% force et hop tests, T-test <11s soccer, confiance psychologique complète
- Tendinopathie : isométrie 70% MVC 45s (antalgique), puis HSR
#### Drapeaux Rouges
- Ottawa Knee Rules (fracture : âge >55, douleur tête fibula/patella, flexion <90°, incapacité marche 4 pas)
- Hémarthrose rapide (<2h) : LCA ou fracture ostéochondrale

### 4. CHEVILLE
#### Phases de prise en charge
- Aiguë : POLICE, mise en charge précoce avec protection (orthèse/tape)
- Subaiguë : dorsiflexion (lunge stretch), proprioception, renforcement inv/éversion
- RTS : course en 8, sauts, changements de direction
#### Critères de progression
- Single-leg heel raise >20 rép (force triceps sural)
#### Drapeaux Rouges
- Ottawa Ankle Rules (malléoles/naviculaire/5ème méta + incapacité mise en charge)
- Syndesmose : douleur AITFL + dorsiflexion/rotation externe forcée

### 5. COUDE
#### Phases de prise en charge
- Aiguë : modification activité, correction technique (tennis/golf), contrôle douleur
- Restauration : force grip + endurance avant-bras, excentriques progressifs
#### Critères de progression
- Extension complète nécessaire (exclure fracture post-trauma)
- Amélioration force grip vs côté sain
#### Drapeaux Rouges
- Incapacité extension complète post-trauma → radiographie
- Exclure atteinte rachis cervical ou tension neurale périphérique

### 6. HANCHE ET PUBALGIE (Doha Consensus 2015)
#### Phases de prise en charge
- Aiguë : minimiser charges provocatrices (adduction forcée), isométrie sous seuil douleur
- Conditionnement : renforcement graduel adducteurs/fléchisseurs hanche/abdominaux (20-30 RM initiaux)
- Sport-spécifique : élastiques en position de tir, drills kicking progressifs, changements direction
#### Critères RTS
- ROM abduction actif = côté sain, Force adducteurs >80% côté sain, Squeeze test indolore
- Charge : vitesse exécution excentrique en phase terminale
#### Drapeaux Rouges
- Fracture fémorale : test percussion patella-pubienne
- Douleur nocturne, clic douloureux (labrum), faiblesse majeure rotateurs

### Règle de charge transversale NSCA/CSCCa
Après inactivité prolongée : réduire volume de 50%(S1) / 30%(S2) / 20%(S3) / 10%(S4) par rapport au volume maximal connu.
`

export async function designProtocol(input: ProtocolDesignerInput): Promise<ProtocolDesignerOutput> {
  // Bloc de littérature clinique vérifiée (optionnel — injecté si fourni)
  const literatureBlock = input.literatureContext
    ? `\n## Sources cliniques vérifiées pour cette pathologie\n${input.literatureContext}\nBaser les recommandations sur ces sources en priorité.\n`
    : ''

  const prompt = `Tu es un kinésithérapeute expert en rééducation sportive et orthopédique.
Tu dois générer un protocole de rééducation structuré et evidence-based, en appliquant systématiquement les guides cliniques de référence ci-dessous.
${literatureBlock}
## Guide de référence clinique evidence-based
${CLINICAL_REFERENCE}

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

  const response = await withRetry(() => anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  }))

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
