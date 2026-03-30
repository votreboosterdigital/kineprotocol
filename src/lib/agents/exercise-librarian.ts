import { jsonrepair } from 'jsonrepair'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic'
import type { ExerciseLibrarianInput, ExerciseLibrarianOutput } from '@/types/agents'

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

// Taxonomie de référence — exercices thérapeutiques en kinésithérapie
const EXERCISE_TAXONOMY = `
### I. PRÉPARATION NEUROMUSCULAIRE ET THÉRAPIE MANUELLE
- Concept Maitland : mobilisations rythmiques oscillatoires. Grades I-II (début de course) → douleur/spasme ; Grades III-IV (fin de course) → raideur articulaire. Réévaluation via "astérisques".
- Mulligan (MWM) : glissade articulaire passive indolore maintenue pendant mouvement actif autrefois douloureux.
- Isométrie préparatoire : contractions isométriques avant isotonique → augmente MVC par inhibition corticale de la douleur.

### II. TAXONOMIE DES EXERCICES THÉRAPEUTIQUES

1. Mobilité et Neurodynamique
   - Sliders (Glissements) : grande amplitude, excursion nerveuse sans augmenter pression intraneurale → phases aiguës/irritables
   - Tensionners (Mise en tension) : restaure tolérance mécanique du nerf → phases chroniques stables

2. Contrôle Moteur et Stabilisation
   - Principe : équilibre mouvement/raideur (stiffness). Stabilité réflexive perturbée par "neurotags" douleur
   - Progression Gray Cook : Reset (thérapie manuelle) → Reinforce (protection) → Redevelop (reprogrammation motrice)
   - Positions : couché → quatre pattes → assis → debout
   - Cues externes ("pousse le sol") plutôt qu'internes ("contracte ta cuisse") → meilleur apprentissage moteur, moins de charge cognitive

3. Renforcement (Mécanotransduction)
   - Hypertrophie/Force : 2-3 séries 8-12 rép à 70-85% 1RM
   - Tempo : 3s concentrique / 4s excentrique (plasticité cérébrale)
   - Tendinopathie : Isométrie (45s à 70% MVC) → HSR isotonique lourd/lent → Stockage énergie (plyométrie)

### III. PARAMÈTRES RTS TRANSVERSAUX
- Règle NSCA après inactivité : 50%(S1) / 30%(S2) / 20%(S3) / 10%(S4) de réduction du volume maximal connu
- Quantification stress mécanique : volume +10% max/sem, intensité +3% max/sem du volume total
- Règle d'or : Fréquence > Volume > Intensité
- LSI >90% pour les tests fonctionnels et de force (hop tests, grip, heel raise)
`

export async function enrichExercise(input: ExerciseLibrarianInput): Promise<ExerciseLibrarianOutput> {
  const prompt = `Tu es un expert en sciences du mouvement et en kinésithérapie.
Standardise et enrichis cet exercice pour une base de données professionnelle, en t'appuyant sur la taxonomie de référence ci-dessous.

## Taxonomie de référence
${EXERCISE_TAXONOMY}


## Exercice à enrichir
- Nom : ${input.name}
- Région : ${input.region}
- Objectif déclaré : ${input.objective}

## Format de réponse attendu (JSON strict)
{
  "name": "Nom anglais standardisé — Traduction française (ex: Dead Bug — Le scarabée inversé)",
  "slug": "nom-en-kebab-case-unique",
  "description": "Description technique complète (3-4 phrases) pour un kinésithérapeute",
  "cues": ["Consigne de placement 1", "Consigne d'exécution 2", "Point d'attention 3"],
  "commonErrors": ["Erreur biomécanique fréquente 1", "Compensation fréquente 2"],
  "variants": ["Version facilitée", "Version progressée", "Version avec matériel"],
  "tags": ["tag1", "tag2", "tag3"],
  "suggestedVideoSearch": "termes de recherche YouTube optimaux pour trouver une vidéo de référence"
}

Réponds UNIQUEMENT avec le JSON.`

  const response = await withRetry(() => anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  }))

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
