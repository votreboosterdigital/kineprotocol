# Design Spec — Refonte UX Stepper + Outputs Enrichis
**Date :** 2026-04-11
**Projet :** KinéProtocol
**Priorité d'implémentation :** T2 → T3 → T4 → T1 → T5

---

## Principe directeur

Input minimal → IA propose → kiné valide/ajuste.
Jamais plus lent qu'une feuille + stylo.
Tempo, RPE, HSR, LSI sont dans les **outputs** générés par l'IA, pas dans les inputs du kiné.

---

## T1 — Design System

### Couleurs
| Token | Valeur | Usage |
|---|---|---|
| `--color-primary` | `#0D9488` | Surgical Teal — accent principal, boutons, focus ring |
| `--color-amber` | `#F59E0B` | Performance Amber — badges RPE, alertes |
| `--color-pubmed` | `#2D6A4F` | Vert émeraude — badges sources PubMed uniquement |
| Fond dark | `zinc-950` | Background app |
| Bordures | `zinc-800` | Séparateurs, cards |
| Texte principal | `zinc-100` | Corps de texte |

### Typographie
- **Geist Sans** (`next/font/google`) — texte général, labels, titres
- **Geist Mono** — exclusivement pour données techniques : sets, reps, tempo, RPE, LSI, durées
- Appliquer `font-mono` globalement sur ces éléments via classes Tailwind

### Application
- Mettre à jour `tailwind.config.ts` : ajouter les couleurs custom, étendre fontFamily
- Mettre à jour `app/layout.tsx` : injecter Geist Sans + Geist Mono via `next/font/google`
- Mettre à jour les variables CSS globales dans `globals.css`

---

## T2 — Refonte ProtocolForm.tsx

### Étape 1 — Anamnèse & Sécurité

**Pathologie**
- Combobox avec filtre texte (input + dropdown filtré) sur les pathologies existantes en DB
- Pas de free-text : les phases sont liées à la pathologie

**Stade clinique**
- 3 boutons radio pill inline : `Aigu` / `Subaigu` / `Chronique`
- Valeur : `'acute' | 'subacute' | 'chronic'`

**SINS**
- 4 contrôles rapides :
  - Sévérité : slider 3 positions (Faible / Moyenne / Élevée)
  - Irritabilité : slider 3 positions (Faible / Moyenne / Élevée)
  - Nature : radio pill 3 options (Mécanique / Inflammatoire / Neuropathique)
  - *(Stade tissulaire couvert par le stade clinique ci-dessus)*

**Red Flags — bloc sécurité obligatoire**
- Style visuel : `border-amber-500/40 bg-amber-500/5`
- Titre : `⚠️ Sécurité — validation obligatoire`
- 5 checkboxes à cocher "Absent" :
  1. Douleur nocturne non mécanique
  2. Perte de poids inexpliquée
  3. Antécédents de cancer
  4. Déficit neurologique objectivable
  5. Traumatisme récent haute énergie
- Bouton "Étape suivante" : `disabled` tant que les 5 cases ne sont pas cochées
- Tooltip sur bouton désactivé : "Validez l'absence des 5 drapeaux rouges pour continuer"
- Validation côté client uniquement (pas de gate API)

**Phase de rééducation**
- Reste en bas de l'étape 1 (inchangé, Select)

---

### Étape 2 — Profil Patient

Disposition : grille compacte, tout sur 2 lignes max.

| Champ | Contrôle | Valeurs |
|---|---|---|
| Âge | Input number | entier |
| Sexe | 2 pills H / F | `'M' \| 'F'` |
| Sport | Input texte libre | string |
| Niveau | 4 pills | Sédentaire / Amateur / Compétiteur / Élite |
| Objectif | 3 pills | Retour activité / Retour sport / Retour performance |
| Fréquence | Stepper +/- | 1 à 5 séances/semaine |

---

### Étape 3 — Génération

- Durée de séance : 3 pills — 30 min / 45 min / 60 min
- Toggle `📚 Enrichir avec sources PubMed` (appelle `/api/literature` si ON)
  - Rappel sources si chargées (encadré vert existant réutilisé)
- Bouton `Générer le protocole`
- État de chargement — barre de progression + étapes en cascade :
  1. `Interrogation base clinique...` (RAG — 0-20%)
  2. `Analyse du profil...` (agent 1 — 20-50%)
  3. `Construction du protocole...` (agent 2 — 50-80%)
  4. `Vérification des paramètres...` (agent 3 — 80-100%)
  - Progress bar Teal animée, étape active mise en évidence

---

## T3 — Types et Agent

### ProtocolDesignerInput (additions)

```typescript
sins: {
  severity: 'low' | 'medium' | 'high'
  irritability: 'low' | 'medium' | 'high'
  nature: 'mechanical' | 'inflammatory' | 'neuropathic'
}
stage: 'acute' | 'subacute' | 'chronic'
redFlagsCleared: boolean
patientProfile: {
  age: number
  sex: 'M' | 'F'
  sport: string
  level: 'sedentary' | 'amateur' | 'competitive' | 'elite'
  objective: 'return_activity' | 'return_sport' | 'return_performance'
  sessionsPerWeek: number
  sessionDuration: 30 | 45 | 60
}
```

Les champs `patientAge`, `patientSport`, `patientLevel`, `sessionDuration`, `sessionsPerWeek` restent présents pour rétrocompatibilité mais sont alimentés depuis `patientProfile`.

### Exercise output enrichi

```typescript
interface Exercise {
  name: string
  sets: number
  reps: string        // "8-12" ou "45s"
  tempo: string       // "3010" (exc/pause/conc/pause)
  rpe: number         // 1-10
  focus: string       // cue externe uniquement
  progression: string // critère de passage à la phase suivante
  phase: 'load' | 'neuromuscular' | 'functional' | 'return_sport'
  // champs existants conservés
  type: string
  level: string
  equipment: string[]
  description: string
  cues: string[]
  commonErrors: string[]
  variants: string[]
  rest: string
  order: number
}
```

Ces champs transitent via `rawAgentOutput` (Json, déjà en DB). Pas de modification schema `ProtocolExercise`.

### System prompt enrichissements

- **SINS severity high** → réduire charge de 30%, privilégier isométrie
- **SINS irritability high** → délai 48h entre séances, pas de DOMS
- **SINS nature neuropathic** → éviter étirements en fin d'amplitude, favoriser mobilisation neurale
- **Stage acute** → isométrie uniquement, pas d'excentrique lourd, charge max 50% 1RM
- **Stage subacute** → Heavy Slow Resistance, excentriques progressifs
- **Objective return_performance** → critères LSI >90%, Hop tests, RPE 7-8/10
- **Objective return_sport** → continuum Ardern étape 2, sport-spécifique
- **Level elite** → HSR, tempo excentrique 3-4s, RPE 7-8/10
- **Level sedentary** → RPE 5-6/10, focus compliance, sets réduits

### Migrations SQL requises

```sql
-- Ajouter les nouvelles colonnes JSONB sur protocols
ALTER TABLE protocols ADD COLUMN sins JSONB;
ALTER TABLE protocols ADD COLUMN stage TEXT;
ALTER TABLE protocols ADD COLUMN patient_profile JSONB;

-- Insert _prisma_migrations
INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
  gen_random_uuid(),
  'manual_protocol_sins_stage_patientprofile',
  NOW(),
  '20260411_add_sins_stage_patient_profile',
  NULL, NULL, NOW(), 1
);
```

---

## T4 — Outputs Enrichis (ProtocolViewer)

### Affichage exercice

Chaque exercice affiche dans cet ordre :
1. Nom + numéro d'ordre
2. Phase badge pill (load / neuromuscular / functional / return_sport) — couleur Teal
3. `Sets × Reps` en **Geist Mono** taille normale
4. Tempo : badge pill zinc-800, Geist Mono — ex : `3-0-1-0`
5. RPE : badge pill amber — ex : `RPE 7/10`
6. Description (texte kiné)
7. Focus : 💬 *italique zinc-400* — cue externe
8. Progression : ✓ *couleur teal* — critère de passage

### Section RTS (conditionnelle)

Affichée si `objective === 'return_sport' || objective === 'return_performance'` :
- Titre **Jalons de progression**
- Phase actuelle mise en évidence (pill teal)
- Si return_performance : `"Force symétrie LSI >90% requise"`
- Règle Clinique du Coureur : `"Douleur ou raideur disparue le lendemain matin ✓"`

---

## T5 — Version Patient Enrichie

### Transformation du langage

| Nocebo (à éliminer) | Neutre (à utiliser) |
|---|---|
| dégénérescence | adaptations naturelles |
| rupture partielle | tissu en cours de guérison |
| arthrose | changements liés à l'âge |

Injection dans le system prompt de `patient-writer.ts`.

### Nouvelles sections

**"Comprendre ta douleur"**
> "Ta douleur est comme une alarme incendie sensible — elle ne signifie pas toujours qu'il y a un incendie. Une douleur modérée pendant l'exercice ne signifie pas que tu te blesses."

**"En cas de poussée douloureuse (flare-up)"**
- Repos relatif (pas d'arrêt total)
- Glace ou chaleur selon préférence
- Reprise progressive dès amélioration
- Message : "Une poussée douloureuse n'est pas une nouvelle blessure."

**Timing des exercices** — pour chaque exercice, une ligne :
> "Quand le faire : après l'échauffement, jamais après une longue journée debout"

### PatientWriterOutput (additions)

```typescript
painEducation: {
  alarmMetaphor: string
  flareUpPlan: string[]
}
exercises: Array<{
  // champs existants
  name: string
  howTo: string
  sets: string
  tip: string
  // nouveau
  whenToDo: string
}>
```

---

## Fichiers impactés

| Fichier | Type de changement |
|---|---|
| `tailwind.config.ts` | Couleurs + fontFamily |
| `app/layout.tsx` | Geist via next/font |
| `globals.css` | Variables CSS |
| `components/protocol/ProtocolForm.tsx` | Refonte complète |
| `src/types/agents.ts` | Additions ProtocolDesignerInput + Exercise + PatientWriterOutput |
| `src/lib/agents/protocol-designer.ts` | System prompt enrichi |
| `src/lib/agents/patient-writer.ts` | Transformation langage + nouvelles sections |
| `components/protocol/ProtocolViewer.tsx` | Affichage exercices enrichis + RTS |
| `app/api/generate-protocol/route.ts` | Passer les nouveaux champs à l'agent |
| `prisma/schema.prisma` | sins, stage, patientProfile (SQL manuel) |

---

## Contraintes absolues rappelées

- Jamais `prisma migrate deploy` — SQL manuel via Supabase SQL Editor
- Server Components par défaut — `"use client"` uniquement si hooks/events
- Zod pour validation des nouveaux inputs côté API
- Secrets uniquement via `process.env`
