# KinéProtocol — Refonte UX Stepper + Outputs Enrichis

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refondre le formulaire de génération (3 étapes cliniques : Anamnèse + Red Flags / Profil patient / Génération avec cascade), enrichir les outputs exercices (tempo, RPE, focus, progression), et mettre à jour le design system (Teal #0D9488, Geist, Amber RPE).

**Architecture:** Les nouveaux champs cliniques (sins, stage, patientProfile) transitent formulaire → API → agents via ProtocolDesignerInput étendu. Les données enrichies d'exercices (tempo/RPE/focus/progression) transitent exclusivement dans rawAgentOutput (Json déjà en DB) — aucune migration ProtocolExercise. 3 colonnes sont ajoutées à `protocols` via SQL manuel. La logique clinique SINS/stage/objectif est extraite dans `src/lib/agents/clinical-context.ts` (testable isolément).

**Tech Stack:** Next.js 14 App Router, TypeScript strict, shadcn/ui (Command + Popover à installer), Tailwind CSS 4 CSS-in-CSS, Vitest + jsdom, Supabase, Prisma

---

## File Map

| Fichier | Action | Rôle |
|---|---|---|
| `src/types/agents.ts` | Modify | Étendre ProtocolDesignerInput, Exercise, PatientWriterOutput |
| `prisma/schema.prisma` | Modify | Ajouter sins, stage, patientProfile sur Protocol |
| `src/components/ui/pill-group.tsx` | Create | Composant boutons radio pill réutilisable |
| `src/components/ui/combobox.tsx` | Create | Combobox avec recherche (wraps shadcn Command) |
| `src/lib/agents/clinical-context.ts` | Create | buildClinicalContext() — pure function testable |
| `src/lib/agents/protocol-designer.ts` | Modify | Injecter clinical-context + enrichir schema exercice |
| `src/lib/agents/patient-writer.ts` | Modify | Nouvelles sections painEducation + whenToDo |
| `src/components/protocol/ProtocolForm.tsx` | Modify | Refonte complète 3 étapes |
| `src/app/api/generate-protocol/route.ts` | Modify | Parser nouveaux champs + Zod validation |
| `src/components/protocol/ProtocolViewer.tsx` | Modify | Affichage tempo/RPE/focus/progression + RTS |
| `src/app/globals.css` | Modify | Couleurs Teal + Amber + variables CSS |
| `src/app/layout.tsx` | Modify | Geist Sans + Geist Mono via next/font |
| `src/__tests__/pill-group.test.tsx` | Create | Tests PillGroup |
| `src/__tests__/clinical-context.test.ts` | Create | Tests buildClinicalContext |

---

## Task 1 — SQL Migration (manuel)

**Action :** Exécuter dans Supabase SQL Editor avant de démarrer l'implémentation.

```sql
-- Ajouter les colonnes cliniques sur protocols
ALTER TABLE protocols ADD COLUMN sins JSONB;
ALTER TABLE protocols ADD COLUMN stage TEXT;
ALTER TABLE protocols ADD COLUMN patient_profile JSONB;

-- Traçabilité migrations Prisma
INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
  gen_random_uuid(),
  'manual_protocol_sins_stage_patient_profile_001',
  NOW(),
  '20260411_add_sins_stage_patient_profile',
  NULL, NULL, NOW(), 1
);
```

- [ ] **Exécuter le SQL dans Supabase SQL Editor**
- [ ] **Vérifier** dans Table Editor que les 3 colonnes apparaissent sur `protocols`

---

## Task 2 — Types agents.ts

**Files:**
- Modify: `src/types/agents.ts`

- [ ] **Remplacer le contenu de `src/types/agents.ts`** par :

```typescript
// ===== AGENT 1 — Protocol Designer =====

export interface SinsInput {
  severity: 'low' | 'medium' | 'high'
  irritability: 'low' | 'medium' | 'high'
  nature: 'mechanical' | 'inflammatory' | 'neuropathic'
}

export interface PatientProfileInput {
  age: number
  sex: 'M' | 'F'
  sport: string
  level: 'sedentary' | 'amateur' | 'competitive' | 'elite'
  objective: 'return_activity' | 'return_sport' | 'return_performance'
  sessionsPerWeek: number
  sessionDuration: 30 | 45 | 60
}

export interface ProtocolDesignerInput {
  pathologyName: string
  region: string
  phaseName: string
  phaseDescription: string
  phaseCriteria: string[]
  // Nouveaux champs cliniques (optionnels pour rétrocompatibilité)
  sins?: SinsInput
  stage?: 'acute' | 'subacute' | 'chronic'
  redFlagsCleared?: boolean
  patientProfile?: PatientProfileInput
  // Champs legacy (toujours acceptés)
  patientAge?: number
  patientSport?: string
  patientLevel?: string
  sessionDuration?: number
  sessionsPerWeek?: number
  constraints: string[]
  literatureContext?: string
}

export interface EnrichedExercise {
  name: string
  region: string
  objective: string
  type: string
  level: string
  equipment: string[]
  description: string
  cues: string[]
  commonErrors: string[]
  variants: string[]
  sets: number
  reps: string
  rest: string
  tempo: string        // ex: "3010" (exc/pause/conc/pause)
  rpe: number          // 1-10
  focus: string        // cue externe uniquement
  progression: string  // critère de passage à la phase suivante
  phase: 'load' | 'neuromuscular' | 'functional' | 'return_sport'
  order: number
}

export interface ProtocolDesignerOutput {
  objectives: string[]
  progressionCriteria: string[]
  sessionStructure: {
    warmup: { duration: number; description: string }
    main: { duration: number; description: string }
    cooldown: { duration: number; description: string }
  }
  exercises: EnrichedExercise[]
  clinicalNotes: string
}

// ===== AGENT 2 — Exercise Librarian =====
export interface ExerciseLibrarianInput {
  name: string
  region: string
  objective: string
}

export interface ExerciseLibrarianOutput {
  name: string
  slug: string
  description: string
  cues: string[]
  commonErrors: string[]
  variants: string[]
  tags: string[]
  suggestedVideoSearch: string
}

// ===== AGENT 3 — Patient Writer =====
export interface PatientWriterInput {
  pathologyName: string
  phaseName: string
  objectives: string[]
  progressionCriteria: string[]
  exercises: Array<{
    name: string
    description: string
    sets?: number
    reps?: string
    rest?: string
  }>
  patientAge?: number
  patientSport?: string
  patientProfile?: PatientProfileInput
  language?: string
}

export interface PatientWriterOutput {
  title: string
  introduction: string
  objectives: string[]
  exercises: Array<{
    name: string
    howTo: string
    sets: string
    tip: string
    whenToDo: string  // ex: "Après l'échauffement, jamais après une longue journée debout"
  }>
  progressionMessage: string
  importantWarnings: string[]
  motivationalClose: string
  painEducation: {
    alarmMetaphor: string      // métaphore alarme incendie
    flareUpPlan: string[]      // 3 étapes flare-up
  }
}
```

- [ ] **Commit**

```bash
git add src/types/agents.ts
git commit -m "feat: étendre types agents (sins, patientProfile, exercice enrichi, painEducation)"
```

---

## Task 3 — Prisma schema

**Files:**
- Modify: `prisma/schema.prisma` (modèle Protocol uniquement)

- [ ] **Ajouter les 3 champs dans le modèle Protocol** (après `hasLiteratureContext`) :

```prisma
  sins             Json?
  stage            String?
  patientProfile   Json?              @map("patient_profile")
```

Le bloc Protocol complet devient :

```prisma
model Protocol {
  id               String             @id @default(cuid())
  userId           String?
  pathologyId      String
  pathology        Pathology          @relation(fields: [pathologyId], references: [id])
  phaseId          String
  phase            Phase              @relation(fields: [phaseId], references: [id])
  patientAge       Int?
  patientSport     String?
  patientLevel     String?
  sessionDuration  Int?
  sessionsPerWeek  Int?
  constraints      String[]
  objectives       String[]
  progression      String[]
  sessionStructure Json
  rawAgentOutput   Json
  patientVersion        String?
  hasLiteratureContext  Boolean            @default(false)
  version               Int                @default(1)
  sins             Json?
  stage            String?
  patientProfile   Json?              @map("patient_profile")
  exercises        ProtocolExercise[]
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  @@index([userId])
  @@index([pathologyId])
  @@index([phaseId])
  @@map("protocols")
}
```

- [ ] **Régénérer le client Prisma** (ne pas migrer) :

```bash
npx prisma generate
```

- [ ] **Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: ajouter sins, stage, patientProfile sur modèle Protocol"
```

---

## Task 4 — Composant PillGroup

**Files:**
- Create: `src/components/ui/pill-group.tsx`
- Create: `src/__tests__/pill-group.test.tsx`

- [ ] **Créer `src/components/ui/pill-group.tsx`** :

```tsx
'use client'
import { cn } from '@/lib/utils'

interface PillOption<T extends string> {
  value: T
  label: string
}

interface PillGroupProps<T extends string> {
  options: PillOption<T>[]
  value: T | null
  onChange: (value: T) => void
  size?: 'sm' | 'md'
}

export function PillGroup<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: PillGroupProps<T>) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-full font-medium border transition-all duration-150',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
            value === opt.value
              ? 'bg-[#0D9488] border-[#0D9488] text-white'
              : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 bg-transparent'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Créer `src/__tests__/pill-group.test.tsx`** :

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { PillGroup } from '@/components/ui/pill-group'

const options = [
  { value: 'a' as const, label: 'Option A' },
  { value: 'b' as const, label: 'Option B' },
  { value: 'c' as const, label: 'Option C' },
]

describe('PillGroup', () => {
  it('rend toutes les options', () => {
    render(<PillGroup options={options} value={null} onChange={() => {}} />)
    expect(screen.getByText('Option A')).toBeDefined()
    expect(screen.getByText('Option B')).toBeDefined()
    expect(screen.getByText('Option C')).toBeDefined()
  })

  it('applique la classe active sur la valeur sélectionnée', () => {
    render(<PillGroup options={options} value="b" onChange={() => {}} />)
    const selected = screen.getByText('Option B').closest('button')
    const unselected = screen.getByText('Option A').closest('button')
    expect(selected?.className).toContain('bg-[#0D9488]')
    expect(unselected?.className).not.toContain('bg-[#0D9488]')
  })

  it('appelle onChange avec la bonne valeur au clic', () => {
    const onChange = vi.fn()
    render(<PillGroup options={options} value={null} onChange={onChange} />)
    fireEvent.click(screen.getByText('Option C'))
    expect(onChange).toHaveBeenCalledWith('c')
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('applique la taille sm', () => {
    render(<PillGroup options={options} value={null} onChange={() => {}} size="sm" />)
    const btn = screen.getByText('Option A').closest('button')
    expect(btn?.className).toContain('text-xs')
  })
})
```

- [ ] **Lancer les tests** :

```bash
npm test src/__tests__/pill-group.test.tsx
```

Résultat attendu : 4 tests PASS.

- [ ] **Commit**

```bash
git add src/components/ui/pill-group.tsx src/__tests__/pill-group.test.tsx
git commit -m "feat: composant PillGroup réutilisable avec tests"
```

---

## Task 5 — Composant Combobox

**Files:**
- Create: `src/components/ui/combobox.tsx`

- [ ] **Installer les composants shadcn manquants** :

```bash
cd /c/Users/Admin/kineprot && npx shadcn@latest add command popover --overwrite 2>&1
```

- [ ] **Créer `src/components/ui/combobox.tsx`** :

```tsx
'use client'
import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  searchPlaceholder = 'Rechercher...',
  emptyText = 'Aucun résultat.',
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className={cn(!selected && 'text-zinc-500')}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.label}
                onSelect={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === option.value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Vérifier la compilation** :

```bash
npx tsc --noEmit 2>&1 | grep combobox
```

Résultat attendu : aucune erreur.

- [ ] **Commit**

```bash
git add src/components/ui/combobox.tsx src/components/ui/command.tsx src/components/ui/popover.tsx
git commit -m "feat: composant Combobox + shadcn command/popover"
```

---

## Task 6 — buildClinicalContext (pure function testable)

**Files:**
- Create: `src/lib/agents/clinical-context.ts`
- Create: `src/__tests__/clinical-context.test.ts`

- [ ] **Créer `src/__tests__/clinical-context.test.ts`** (test en premier) :

```typescript
import { buildClinicalContext } from '@/lib/agents/clinical-context'

describe('buildClinicalContext', () => {
  it('retourne une chaîne vide si tous les params sont nulls', () => {
    const result = buildClinicalContext(undefined, undefined, undefined)
    expect(result.trim()).toBe('')
  })

  it('signale la sévérité élevée avec isométrie', () => {
    const result = buildClinicalContext(
      { severity: 'high', irritability: 'low', nature: 'mechanical' },
      undefined,
      undefined
    )
    expect(result).toContain('ÉLEVÉE')
    expect(result).toContain('isométrie prioritaire')
  })

  it('contraint le stage aigu à ≤50% 1RM', () => {
    const result = buildClinicalContext(undefined, 'acute', undefined)
    expect(result).toContain('AIGU')
    expect(result).toContain('50% 1RM')
  })

  it('inclut LSI pour return_performance', () => {
    const result = buildClinicalContext(undefined, undefined, {
      age: 25, sex: 'M', sport: 'football',
      level: 'elite', objective: 'return_performance',
      sessionsPerWeek: 3, sessionDuration: 45,
    })
    expect(result).toContain('LSI >90%')
    expect(result).toContain('Hop tests')
  })

  it('spécifie RPE 5-6 pour niveau sédentaire', () => {
    const result = buildClinicalContext(undefined, undefined, {
      age: 60, sex: 'F', sport: '',
      level: 'sedentary', objective: 'return_activity',
      sessionsPerWeek: 2, sessionDuration: 30,
    })
    expect(result).toContain('RPE 4-5/10')
  })

  it('indique mobilisation neurale pour SINS neuropathique', () => {
    const result = buildClinicalContext(
      { severity: 'low', irritability: 'low', nature: 'neuropathic' },
      undefined,
      undefined
    )
    expect(result).toContain('mobilisation neurale')
  })
})
```

- [ ] **Lancer le test pour vérifier l'échec** :

```bash
npm test src/__tests__/clinical-context.test.ts
```

Résultat attendu : FAIL — "Cannot find module '@/lib/agents/clinical-context'"

- [ ] **Créer `src/lib/agents/clinical-context.ts`** :

```typescript
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
  neuropathic: 'NEUROPATHIQUE → éviter étirements en fin d\'amplitude, mobilisation neurale progressive, slider avant tensioner',
  inflammatory: 'INFLAMMATOIRE → exercices en décharge en phase aiguë, isométrie anti-douleur, éviter chaleur locale',
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
```

- [ ] **Lancer les tests** :

```bash
npm test src/__tests__/clinical-context.test.ts
```

Résultat attendu : 6 tests PASS.

- [ ] **Commit**

```bash
git add src/lib/agents/clinical-context.ts src/__tests__/clinical-context.test.ts
git commit -m "feat: buildClinicalContext — contexte SINS/stage/profil avec tests"
```

---

## Task 7 — Protocol Designer : prompt enrichi + schéma exercice

**Files:**
- Modify: `src/lib/agents/protocol-designer.ts`

- [ ] **Modifier `src/lib/agents/protocol-designer.ts`** — ajouter l'import et injecter le contexte clinique :

Ligne 1-3, ajouter l'import :
```typescript
import { buildClinicalContext } from '@/lib/agents/clinical-context'
```

Dans la fonction `designProtocol`, après la récupération des chunks RAG, ajouter :
```typescript
  // Contexte clinique SINS / stade / profil
  const clinicalContext = buildClinicalContext(input.sins, input.stage, input.patientProfile)
  const clinicalBlock = clinicalContext
    ? `\n## Contexte clinique patient\n${clinicalContext}\n\nApplique STRICTEMENT ces directives dans le choix des exercices, de l'intensité (RPE), du tempo et de la progressivité.\n`
    : ''
```

Mettre à jour le prompt pour inclure `clinicalBlock` et le nouveau schéma exercice :
```typescript
  const prompt = `Tu es un kinésithérapeute expert en rééducation sportive et orthopédique.
Tu dois générer un protocole de rééducation structuré et evidence-based, en appliquant systématiquement les guides cliniques de référence ci-dessous.
${knowledgeContext}${literatureBlock}${clinicalBlock}
## Guide de référence clinique evidence-based
${CLINICAL_REFERENCE}

## Contexte patient
- Pathologie : ${input.pathologyName} (région : ${input.region})
- Phase : ${input.phaseName} (${input.phaseDescription})
- Critères d'entrée en phase validés : ${input.phaseCriteria.join(', ')}
- Âge : ${input.patientProfile?.age ?? input.patientAge ?? 'non renseigné'}
- Sport : ${input.patientProfile?.sport ?? input.patientSport ?? 'non sportif'}
- Niveau : ${input.patientProfile?.level ?? input.patientLevel ?? 'non renseigné'}
- Durée séance : ${input.patientProfile?.sessionDuration ?? input.sessionDuration ?? 45} min
- Fréquence : ${input.patientProfile?.sessionsPerWeek ?? input.sessionsPerWeek ?? 3}x/semaine
- Contraintes : ${input.constraints.length > 0 ? input.constraints.join(', ') : 'aucune'}

## Ta mission
Génère un protocole complet en JSON strict :

{
  "objectives": ["objectif 1", "objectif 2"],
  "progressionCriteria": ["critère pour passer à la phase suivante"],
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
      "cues": ["consigne technique 1"],
      "commonErrors": ["erreur fréquente 1"],
      "variants": ["variante plus facile", "variante plus difficile"],
      "sets": 3,
      "reps": "10-15",
      "rest": "60s",
      "tempo": "3010",
      "rpe": 6,
      "focus": "Cue externe uniquement — ex: Poussez le sol loin de vous",
      "progression": "Critère de passage — ex: RPE <4/10 le lendemain matin",
      "phase": "load|neuromuscular|functional|return_sport",
      "order": 1
    }
  ],
  "clinicalNotes": "Notes importantes pour le thérapeute"
}

Règles :
- tempo : 4 chiffres (excentrique/pause haute/concentrique/pause basse) — ex: "3010"
- rpe : entier 1-10 adapté au stade et au niveau patient
- focus : cue EXTERNE uniquement (pas "contractez le muscle", mais "poussez le sol")
- progression : critère mesurable et cliniquement pertinent
- phase : choisir selon la progression thérapeutique
- Génère 5 à 8 exercices. Réponds UNIQUEMENT avec le JSON.`
```

- [ ] **Vérifier la compilation** :

```bash
npx tsc --noEmit 2>&1 | grep protocol-designer
```

Résultat attendu : aucune erreur.

- [ ] **Commit**

```bash
git add src/lib/agents/protocol-designer.ts
git commit -m "feat: enrichir protocol-designer avec SINS/stage/profil et schéma exercice tempo/RPE/focus"
```

---

## Task 8 — Patient Writer : painEducation + whenToDo

**Files:**
- Modify: `src/lib/agents/patient-writer.ts`

- [ ] **Modifier `src/lib/agents/patient-writer.ts`** — mettre à jour le prompt JSON et les substitutions :

Dans `writePatientVersion`, mettre à jour le bloc `## Patient` :
```typescript
## Patient
- Âge : ${input.patientProfile?.age ?? input.patientAge ?? 'non renseigné'}
- Sport : ${input.patientProfile?.sport ?? input.patientSport ?? 'non sportif'}
- Objectif : ${input.patientProfile?.objective ?? 'retour activité'}
- Langue : ${input.language ?? 'français'}
```

Mettre à jour le schéma JSON attendu :
```typescript
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
Réponds UNIQUEMENT avec le JSON.
```

- [ ] **Vérifier la compilation** :

```bash
npx tsc --noEmit 2>&1 | grep patient-writer
```

- [ ] **Commit**

```bash
git add src/lib/agents/patient-writer.ts
git commit -m "feat: patient-writer — painEducation, whenToDo, substitutions vocabulaire nocebo"
```

---

## Task 9 — API generate-protocol : nouveaux champs + Zod

**Files:**
- Modify: `src/app/api/generate-protocol/route.ts`

- [ ] **Remplacer le contenu de `src/app/api/generate-protocol/route.ts`** :

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { canGenerateProtocol } from '@/lib/billing'
import { designProtocol } from '@/lib/agents/protocol-designer'
import { enrichExercise } from '@/lib/agents/exercise-librarian'
import { writePatientVersion } from '@/lib/agents/patient-writer'
import type { ProtocolDesignerInput } from '@/types/agents'
import type { ExerciseType, ExerciseLevel } from '@prisma/client'

const SinsSchema = z.object({
  severity: z.enum(['low', 'medium', 'high']),
  irritability: z.enum(['low', 'medium', 'high']),
  nature: z.enum(['mechanical', 'inflammatory', 'neuropathic']),
})

const PatientProfileSchema = z.object({
  age: z.number().int().min(0).max(120),
  sex: z.enum(['M', 'F']),
  sport: z.string().max(100),
  level: z.enum(['sedentary', 'amateur', 'competitive', 'elite']),
  objective: z.enum(['return_activity', 'return_sport', 'return_performance']),
  sessionsPerWeek: z.number().int().min(1).max(7),
  sessionDuration: z.union([z.literal(30), z.literal(45), z.literal(60)]),
})

const BodySchema = z.object({
  pathologyId: z.string().min(1),
  phaseId: z.string().min(1),
  sins: SinsSchema.optional(),
  stage: z.enum(['acute', 'subacute', 'chronic']).optional(),
  redFlagsCleared: z.boolean().optional(),
  patientProfile: PatientProfileSchema.optional(),
  // Champs legacy
  patientAge: z.number().int().optional(),
  patientSport: z.string().optional(),
  patientLevel: z.string().optional(),
  sessionDuration: z.number().int().optional(),
  sessionsPerWeek: z.number().int().optional(),
  constraints: z.array(z.string()).default([]),
  literatureContext: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { allowed, reason, current, limit } = await canGenerateProtocol(user.id)
    if (!allowed) {
      return NextResponse.json(
        { error: reason, current, limit, upgradeUrl: '/billing' },
        { status: 403 }
      )
    }

    const parsed = BodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const body = parsed.data

    const [pathology, phase] = await Promise.all([
      prisma.pathology.findUniqueOrThrow({ where: { id: body.pathologyId } }),
      prisma.phase.findUniqueOrThrow({ where: { id: body.phaseId } }),
    ])

    const agentInput: ProtocolDesignerInput = {
      pathologyName: pathology.name,
      region: pathology.region,
      phaseName: phase.name,
      phaseDescription: phase.description ?? '',
      phaseCriteria: phase.criteria,
      sins: body.sins,
      stage: body.stage,
      redFlagsCleared: body.redFlagsCleared,
      patientProfile: body.patientProfile,
      patientAge: body.patientProfile?.age ?? body.patientAge,
      patientSport: body.patientProfile?.sport ?? body.patientSport,
      patientLevel: body.patientProfile?.level ?? body.patientLevel,
      sessionDuration: body.patientProfile?.sessionDuration ?? body.sessionDuration,
      sessionsPerWeek: body.patientProfile?.sessionsPerWeek ?? body.sessionsPerWeek,
      constraints: body.constraints,
      literatureContext: typeof body.literatureContext === 'string'
        ? body.literatureContext
        : undefined,
    }

    const protocolOutput = await designProtocol(agentInput)

    const enrichedExercises = await Promise.all(
      protocolOutput.exercises.map(async (ex) => {
        const enriched = await enrichExercise({
          name: ex.name,
          region: ex.region,
          objective: ex.objective,
        })
        return { ...ex, ...enriched }
      })
    )

    const savedExercises = await Promise.all(
      enrichedExercises.map((ex) =>
        prisma.exercise.upsert({
          where: { slug: ex.slug },
          create: {
            name: ex.name,
            slug: ex.slug,
            region: ex.region,
            objective: ex.objective,
            type: ex.type as ExerciseType,
            level: ex.level as ExerciseLevel,
            equipment: ex.equipment,
            description: ex.description,
            cues: ex.cues,
            commonErrors: ex.commonErrors,
            variants: ex.variants,
            tags: ex.tags,
            aiGenerated: true,
          },
          update: {},
        })
      )
    )

    const patientOutput = await writePatientVersion({
      pathologyName: pathology.name,
      phaseName: phase.name,
      objectives: protocolOutput.objectives,
      progressionCriteria: protocolOutput.progressionCriteria,
      exercises: enrichedExercises.map((ex) => ({
        name: ex.name,
        description: ex.description,
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.rest,
      })),
      patientProfile: body.patientProfile,
      patientAge: body.patientProfile?.age ?? body.patientAge,
      patientSport: body.patientProfile?.sport ?? body.patientSport,
    })

    const protocol = await prisma.protocol.create({
      data: {
        userId: user.id,
        pathologyId: pathology.id,
        phaseId: phase.id,
        patientAge: body.patientProfile?.age ?? body.patientAge,
        patientSport: body.patientProfile?.sport ?? body.patientSport,
        patientLevel: body.patientProfile?.level ?? body.patientLevel,
        sessionDuration: body.patientProfile?.sessionDuration ?? body.sessionDuration,
        sessionsPerWeek: body.patientProfile?.sessionsPerWeek ?? body.sessionsPerWeek,
        constraints: body.constraints,
        objectives: protocolOutput.objectives,
        progression: protocolOutput.progressionCriteria,
        sessionStructure: protocolOutput.sessionStructure,
        rawAgentOutput: protocolOutput as object,
        patientVersion: JSON.stringify(patientOutput),
        hasLiteratureContext: !!agentInput.literatureContext,
        sins: body.sins ?? undefined,
        stage: body.stage ?? undefined,
        patientProfile: body.patientProfile ?? undefined,
        exercises: {
          create: savedExercises.map((ex, idx) => ({
            exerciseId: ex.id,
            order: idx + 1,
            sets: enrichedExercises[idx].sets,
            reps: enrichedExercises[idx].reps,
            rest: enrichedExercises[idx].rest,
          })),
        },
      },
      include: {
        exercises: { include: { exercise: true } },
        pathology: true,
        phase: true,
      },
    })

    return NextResponse.json({ success: true, protocol })
  } catch (error) {
    console.error('[generate-protocol]', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération du protocole' },
      { status: 500 }
    )
  }
}
```

- [ ] **Vérifier la compilation** :

```bash
npx tsc --noEmit 2>&1 | grep generate-protocol
```

Résultat attendu : aucune erreur.

- [ ] **Commit**

```bash
git add src/app/api/generate-protocol/route.ts
git commit -m "feat: API generate-protocol — sins/stage/patientProfile + validation Zod"
```

---

## Task 10 — ProtocolForm : Étape 1 (Anamnèse + Red Flags)

**Files:**
- Modify: `src/components/protocol/ProtocolForm.tsx` (remplacement complet)

Cette tâche remplace entièrement ProtocolForm.tsx. Le composant gère maintenant 3 étapes avec un state enrichi.

- [ ] **Remplacer le contenu de `src/components/protocol/ProtocolForm.tsx`** :

```tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PillGroup } from '@/components/ui/pill-group'
import { Combobox } from '@/components/ui/combobox'
import type { Pathology, Phase } from '@prisma/client'
import { cn } from '@/lib/utils'

interface ProtocolFormProps {
  pathologies: Pathology[]
  phases: Phase[]
}

interface LiteratureData {
  clinicalConsensus: {
    summary: string
    validatedTreatments: Array<{ intervention: string; evidenceLevel: string; description: string }>
  }
  keyReferences: Array<{ title: string; authors: string; year: number; url: string }>
  clinicalPearlsForProtocol: string[]
  error?: string
}

type Stage = 'acute' | 'subacute' | 'chronic'
type SinsSeverity = 'low' | 'medium' | 'high'
type SinsNature = 'mechanical' | 'inflammatory' | 'neuropathic'
type Sex = 'M' | 'F'
type Level = 'sedentary' | 'amateur' | 'competitive' | 'elite'
type Objective = 'return_activity' | 'return_sport' | 'return_performance'

const RED_FLAGS = [
  'Douleur nocturne non mécanique',
  'Perte de poids inexpliquée',
  'Antécédents de cancer',
  'Déficit neurologique objectivable',
  'Traumatisme récent haute énergie',
]

const STAGE_OPTIONS = [
  { value: 'acute' as Stage, label: 'Aigu' },
  { value: 'subacute' as Stage, label: 'Subaigu' },
  { value: 'chronic' as Stage, label: 'Chronique' },
]

const SEVERITY_OPTIONS = [
  { value: 'low' as SinsSeverity, label: 'Faible' },
  { value: 'medium' as SinsSeverity, label: 'Moyenne' },
  { value: 'high' as SinsSeverity, label: 'Élevée' },
]

const NATURE_OPTIONS = [
  { value: 'mechanical' as SinsNature, label: 'Mécanique' },
  { value: 'inflammatory' as SinsNature, label: 'Inflammatoire' },
  { value: 'neuropathic' as SinsNature, label: 'Neuropathique' },
]

const SEX_OPTIONS = [
  { value: 'M' as Sex, label: 'H' },
  { value: 'F' as Sex, label: 'F' },
]

const LEVEL_OPTIONS = [
  { value: 'sedentary' as Level, label: 'Sédentaire' },
  { value: 'amateur' as Level, label: 'Amateur' },
  { value: 'competitive' as Level, label: 'Compétiteur' },
  { value: 'elite' as Level, label: 'Élite' },
]

const OBJECTIVE_OPTIONS = [
  { value: 'return_activity' as Objective, label: 'Retour activité' },
  { value: 'return_sport' as Objective, label: 'Retour sport' },
  { value: 'return_performance' as Objective, label: 'Retour performance' },
]

const DURATION_OPTIONS = [
  { value: 30 as 30 | 45 | 60, label: '30 min' },
  { value: 45 as 30 | 45 | 60, label: '45 min' },
  { value: 60 as 30 | 45 | 60, label: '60 min' },
]

const LOADING_STEPS = [
  'Interrogation base clinique...',
  'Analyse du profil...',
  'Construction du protocole...',
  'Vérification des paramètres...',
]

const STEPS = [
  { label: 'Anamnèse', desc: 'Contexte clinique & sécurité' },
  { label: 'Profil', desc: 'Patient & objectif' },
  { label: 'Génération', desc: 'Paramètres de séance' },
]

export function ProtocolForm({ pathologies, phases }: ProtocolFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingStepIdx, setLoadingStepIdx] = useState(0)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [literatureData, setLiteratureData] = useState<LiteratureData | null>(null)
  const [literatureLoading, setLiteratureLoading] = useState(false)
  const [useLiterature, setUseLiterature] = useState(false)

  // Étape 1
  const [pathologyId, setPathologyId] = useState('')
  const [phaseId, setPhaseId] = useState('')
  const [stage, setStage] = useState<Stage | null>(null)
  const [sinsSeverity, setSinsSeverity] = useState<SinsSeverity | null>(null)
  const [sinsIrritability, setSinsIrritability] = useState<SinsSeverity | null>(null)
  const [sinsNature, setSinsNature] = useState<SinsNature | null>(null)
  const [redFlags, setRedFlags] = useState<boolean[]>(Array(5).fill(false))

  // Étape 2
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<Sex | null>(null)
  const [sport, setSport] = useState('')
  const [level, setLevel] = useState<Level | null>(null)
  const [objective, setObjective] = useState<Objective | null>(null)
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3)

  // Étape 3
  const [sessionDuration, setSessionDuration] = useState<30 | 45 | 60>(45)

  const allRedFlagsCleared = redFlags.every(Boolean)

  const pathologyOptions = pathologies.map((p) => ({ value: p.id, label: p.name }))
  const selectedPathologyName = pathologies.find((p) => p.id === pathologyId)?.name ?? ''

  // Reset literature si pathologie change
  useEffect(() => {
    setLiteratureData(null)
    setUseLiterature(false)
  }, [pathologyId])

  // Animation loading progress
  useEffect(() => {
    if (!loading) {
      setLoadingStepIdx(0)
      setLoadingProgress(0)
      return
    }
    const steps = [
      { delay: 0, step: 0, progress: 5 },
      { delay: 3000, step: 1, progress: 25 },
      { delay: 8000, step: 2, progress: 55 },
      { delay: 18000, step: 3, progress: 80 },
    ]
    const timers = steps.map(({ delay, step: s, progress: p }) =>
      setTimeout(() => {
        setLoadingStepIdx(s)
        setLoadingProgress(p)
      }, delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [loading])

  const handleEnrichLiterature = useCallback(async () => {
    if (!selectedPathologyName) return
    setLiteratureLoading(true)
    try {
      const res = await fetch('/api/literature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathology: selectedPathologyName }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur réseau')
      setLiteratureData(json.data as LiteratureData)
    } catch {
      setLiteratureData(null)
    } finally {
      setLiteratureLoading(false)
    }
  }, [selectedPathologyName])

  // Déclenche le fetch literature quand le toggle passe à ON
  useEffect(() => {
    if (useLiterature && !literatureData && selectedPathologyName) {
      handleEnrichLiterature()
    }
  }, [useLiterature, literatureData, selectedPathologyName, handleEnrichLiterature])

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      const body = {
        pathologyId,
        phaseId,
        sins: sinsSeverity && sinsIrritability && sinsNature
          ? { severity: sinsSeverity, irritability: sinsIrritability, nature: sinsNature }
          : undefined,
        stage: stage ?? undefined,
        redFlagsCleared: allRedFlagsCleared,
        patientProfile: {
          age: age ? parseInt(age) : 35,
          sex: sex ?? 'M',
          sport: sport || '',
          level: level ?? 'amateur',
          objective: objective ?? 'return_activity',
          sessionsPerWeek,
          sessionDuration,
        },
        constraints: [],
        literatureContext: useLiterature && literatureData
          ? JSON.stringify(literatureData)
          : undefined,
      }

      const res = await fetch('/api/generate-protocol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      router.push(`/protocols/${data.protocol.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="max-w-2xl border-zinc-800 bg-zinc-950">
        <CardContent className="py-12 flex flex-col gap-6">
          {/* Barre de progression */}
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0D9488] rounded-full transition-all duration-[3000ms] ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>

          {/* Étapes en cascade */}
          <div className="space-y-2">
            {LOADING_STEPS.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-3 text-sm transition-all duration-500',
                  i < loadingStepIdx
                    ? 'text-zinc-500'
                    : i === loadingStepIdx
                    ? 'text-zinc-100 font-medium'
                    : 'text-zinc-700'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    i < loadingStepIdx
                      ? 'border-[#0D9488] bg-[#0D9488]'
                      : i === loadingStepIdx
                      ? 'border-[#0D9488] border-t-transparent animate-spin'
                      : 'border-zinc-700'
                  )}
                >
                  {i < loadingStepIdx && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                {msg}
              </div>
            ))}
          </div>

          <p className="text-xs text-zinc-600 text-center">Durée estimée : 15–25 secondes</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className="flex flex-col items-center gap-1 group"
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors',
                i < step
                  ? 'bg-[#0D9488] border-[#0D9488] text-white'
                  : i === step
                  ? 'border-[#0D9488] text-[#0D9488] bg-transparent'
                  : 'border-zinc-700 text-zinc-600 bg-transparent'
              )}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={cn(
                'text-xs font-medium hidden sm:block',
                i === step ? 'text-[#0D9488]' : 'text-zinc-600'
              )}>{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mx-2 transition-colors',
                i < step ? 'bg-[#0D9488]' : 'bg-zinc-800'
              )} />
            )}
          </div>
        ))}
      </div>

      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle className="text-zinc-100">{STEPS[step].label}</CardTitle>
          <p className="text-sm text-zinc-500">{STEPS[step].desc}</p>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* ───── ÉTAPE 1 — ANAMNÈSE & SÉCURITÉ ───── */}
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label className="text-zinc-300">Pathologie *</Label>
                <Combobox
                  options={pathologyOptions}
                  value={pathologyId}
                  onChange={setPathologyId}
                  placeholder="Chercher une pathologie..."
                  searchPlaceholder="Tendinopathie, LCA, lombalgie..."
                  emptyText="Aucune pathologie trouvée."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Phase de rééducation *</Label>
                <Select value={phaseId} onValueChange={setPhaseId}>
                  <SelectTrigger className="border-zinc-800">
                    <SelectValue placeholder="Choisir une phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {phases.sort((a, b) => a.order - b.order).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Stade clinique</Label>
                <PillGroup options={STAGE_OPTIONS} value={stage} onChange={setStage} />
              </div>

              {/* SINS */}
              <div className="space-y-3 p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
                <p className="text-sm font-medium text-zinc-300">SINS</p>
                <div className="space-y-2.5">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1.5">Sévérité</p>
                    <PillGroup options={SEVERITY_OPTIONS} value={sinsSeverity} onChange={setSinsSeverity} size="sm" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1.5">Irritabilité</p>
                    <PillGroup options={SEVERITY_OPTIONS} value={sinsIrritability} onChange={setSinsIrritability} size="sm" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1.5">Nature</p>
                    <PillGroup options={NATURE_OPTIONS} value={sinsNature} onChange={setSinsNature} size="sm" />
                  </div>
                </div>
              </div>

              {/* Red Flags */}
              <div className="space-y-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
                <p className="text-sm font-semibold text-amber-400">⚠️ Sécurité — validation obligatoire</p>
                <p className="text-xs text-zinc-500">Cochez "Absent" pour chaque signe avant de continuer</p>
                <div className="space-y-2">
                  {RED_FLAGS.map((flag, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                          redFlags[i]
                            ? 'bg-[#0D9488] border-[#0D9488]'
                            : 'border-zinc-600 group-hover:border-zinc-400'
                        )}
                        onClick={() => setRedFlags((f) => {
                          const next = [...f]
                          next[i] = !next[i]
                          return next
                        })}
                      >
                        {redFlags[i] && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={cn(
                        'text-sm transition-colors',
                        redFlags[i] ? 'text-zinc-400 line-through' : 'text-zinc-300'
                      )}>
                        {flag}
                      </span>
                      <span className={cn(
                        'ml-auto text-xs font-medium flex-shrink-0',
                        redFlags[i] ? 'text-[#0D9488]' : 'text-zinc-600'
                      )}>
                        {redFlags[i] ? 'Absent ✓' : 'À valider'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ───── ÉTAPE 2 — PROFIL PATIENT ───── */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-zinc-300 text-xs">Âge</Label>
                  <Input
                    type="number"
                    placeholder="35"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="border-zinc-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-300 text-xs">Sexe</Label>
                  <PillGroup options={SEX_OPTIONS} value={sex} onChange={setSex} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-xs">Sport pratiqué</Label>
                <Input
                  placeholder="Football, tennis, natation..."
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  className="border-zinc-800"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-xs">Niveau</Label>
                <PillGroup options={LEVEL_OPTIONS} value={level} onChange={setLevel} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-xs">Objectif</Label>
                <PillGroup options={OBJECTIVE_OPTIONS} value={objective} onChange={setObjective} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-xs">
                  Fréquence — {sessionsPerWeek} séance{sessionsPerWeek > 1 ? 's' : ''}/semaine
                </Label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSessionsPerWeek((n) => Math.max(1, n - 1))}
                    className="w-8 h-8 rounded-full border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
                  >
                    −
                  </button>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className={cn(
                          'w-2 h-2 rounded-full transition-colors',
                          n <= sessionsPerWeek ? 'bg-[#0D9488]' : 'bg-zinc-700'
                        )}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSessionsPerWeek((n) => Math.min(5, n + 1))}
                    className="w-8 h-8 rounded-full border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ───── ÉTAPE 3 — GÉNÉRATION ───── */}
          {step === 2 && (
            <>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-xs">Durée de séance</Label>
                <PillGroup
                  options={DURATION_OPTIONS}
                  value={sessionDuration}
                  onChange={setSessionDuration}
                />
              </div>

              {/* Toggle PubMed */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800">
                <div>
                  <p className="text-sm text-zinc-300">📚 Enrichir avec sources PubMed</p>
                  <p className="text-xs text-zinc-600 mt-0.5">Injecte la littérature clinique dans la génération</p>
                </div>
                <button
                  type="button"
                  onClick={() => setUseLiterature((v) => !v)}
                  disabled={!pathologyId}
                  className={cn(
                    'relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0',
                    useLiterature ? 'bg-[#0D9488]' : 'bg-zinc-700',
                    !pathologyId && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                    useLiterature ? 'translate-x-5' : 'translate-x-0.5'
                  )} />
                </button>
              </div>

              {/* Feedback literature */}
              {useLiterature && (
                <div className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs',
                  literatureLoading
                    ? 'border border-zinc-800 text-zinc-500'
                    : literatureData
                    ? 'text-[#2D6A4F]'
                    : 'border border-zinc-800 text-zinc-500'
                )}
                  style={literatureData ? { background: 'rgba(45,106,79,0.08)', border: '1px solid rgba(45,106,79,0.2)' } : {}}
                >
                  {literatureLoading && (
                    <><span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> Chargement des sources...</>
                  )}
                  {!literatureLoading && literatureData && (
                    <>🔬 {literatureData.keyReferences?.length ?? 0} sources cliniques seront injectées</>
                  )}
                </div>
              )}

              {/* Récap */}
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/30 space-y-1 text-xs text-zinc-500">
                <p><span className="text-zinc-400">Pathologie :</span> {pathologies.find(p => p.id === pathologyId)?.name ?? '—'}</p>
                <p><span className="text-zinc-400">Stade :</span> {stage ?? '—'} · <span className="text-zinc-400">Séances :</span> {sessionsPerWeek}×/sem · {sessionDuration} min</p>
              </div>
            </>
          )}

          {/* Erreur */}
          {error && (
            error.toLowerCase().includes('quota') || error.includes('Limite') ? (
              <div className="p-4 rounded-lg space-y-2 border" style={{ background: 'rgba(13,148,136,0.05)', borderColor: 'rgba(13,148,136,0.2)' }}>
                <p className="text-sm font-semibold text-zinc-100">Vous avez utilisé vos 3 protocoles ce mois-ci</p>
                <p className="text-sm text-zinc-400">Votre quota se renouvelle le 1er du mois prochain.</p>
                <a href="/billing" className="inline-block mt-1 text-sm font-medium px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(13,148,136,0.15)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
                  Passer en Pro →
                </a>
              </div>
            ) : (
              <div className="p-3 bg-red-950/50 border border-red-900 rounded-md text-red-400 text-sm">{error}</div>
            )
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="border-zinc-800"
            >
              Précédent
            </Button>

            {step < STEPS.length - 1 ? (
              <div className="relative group">
                <Button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={
                    (step === 0 && (!pathologyId || !phaseId || !allRedFlagsCleared))
                  }
                  className="bg-[#0D9488] hover:bg-[#0D9488]/90 text-white"
                >
                  Étape suivante
                </Button>
                {step === 0 && !allRedFlagsCleared && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Validez l'absence des 5 drapeaux rouges pour continuer
                  </span>
                )}
              </div>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!pathologyId || !phaseId}
                className="bg-[#0D9488] hover:bg-[#0D9488]/90 text-white"
              >
                Générer le protocole
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Vérifier la compilation** :

```bash
npx tsc --noEmit 2>&1 | grep ProtocolForm
```

- [ ] **Commit**

```bash
git add src/components/protocol/ProtocolForm.tsx
git commit -m "feat: refonte ProtocolForm — étapes Anamnèse + Profil + Génération avec Red Flags et SINS"
```

---

## Task 11 — ProtocolViewer : exercices enrichis + section RTS

**Files:**
- Modify: `src/components/protocol/ProtocolViewer.tsx`

- [ ] **Dans ProtocolViewer.tsx**, ajouter l'interface pour l'exercice enrichi et la section RTS :

En haut du fichier (après les imports existants) :
```typescript
import type { EnrichedExercise, PatientWriterOutput } from '@/types/agents'

const PHASE_LABELS: Record<string, { label: string; color: string }> = {
  load: { label: 'Charge', color: 'bg-zinc-700 text-zinc-300' },
  neuromuscular: { label: 'Neuromusculaire', color: 'bg-teal-900/50 text-teal-300 border border-teal-800' },
  functional: { label: 'Fonctionnel', color: 'bg-blue-900/50 text-blue-300 border border-blue-800' },
  return_sport: { label: 'Retour sport', color: 'bg-amber-900/50 text-amber-300 border border-amber-800' },
}
```

Dans le Tab "Protocole kiné", remplacer la section exercices (le `<Card>` avec `Exercices (N)`) :

```tsx
<Card className="border-zinc-800">
  <CardHeader>
    <CardTitle className="text-base text-zinc-100">
      Exercices ({protocol.exercises.length})
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-5">
      {protocol.exercises.map(({ exercise, order, sets, reps, rest }) => {
        // Lire les données enrichies depuis rawAgentOutput
        const raw = protocol.rawAgentOutput as { exercises?: EnrichedExercise[] }
        const enriched = raw.exercises?.find(
          (e) => e.order === order || e.name === exercise.name
        )

        return (
          <div key={exercise.id} className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-zinc-100">{order}. {exercise.name}</p>
                  {enriched?.phase && PHASE_LABELS[enriched.phase] && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PHASE_LABELS[enriched.phase].color}`}>
                      {PHASE_LABELS[enriched.phase].label}
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500 mt-1">{exercise.description}</p>

                {/* Données techniques */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {(sets || enriched?.sets) && (reps || enriched?.reps) && (
                    <span className="font-mono text-sm text-zinc-200">
                      {sets ?? enriched?.sets} × {reps ?? enriched?.reps}
                    </span>
                  )}
                  {rest && (
                    <span className="font-mono text-xs text-zinc-500">repos {rest}</span>
                  )}
                  {enriched?.tempo && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {enriched.tempo}
                    </span>
                  )}
                  {enriched?.rpe !== undefined && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded font-medium"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                      RPE {enriched.rpe}/10
                    </span>
                  )}
                </div>

                {/* Cue externe */}
                {enriched?.focus && (
                  <p className="text-xs text-zinc-500 italic mt-1.5">
                    💬 {enriched.focus}
                  </p>
                )}

                {/* Critère de progression */}
                {enriched?.progression && (
                  <p className="text-xs mt-1" style={{ color: '#0D9488' }}>
                    ✓ {enriched.progression}
                  </p>
                )}
              </div>

              <div className="flex gap-1 flex-wrap ml-2">
                <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                  {EXERCISE_TYPE_FR[exercise.type]}
                </Badge>
                <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                  {EXERCISE_LEVEL_FR[exercise.level]}
                </Badge>
              </div>
            </div>
            <Separator className="bg-zinc-800" />
          </div>
        )
      })}
    </div>
  </CardContent>
</Card>
```

Après la card Critères de progression, ajouter la section RTS conditionnelle :

```tsx
{/* Section RTS — conditionnelle si patientProfile.objective return_sport ou return_performance */}
{(() => {
  const profile = protocol.patientProfile as { objective?: string } | null
  if (!profile?.objective || !['return_sport', 'return_performance'].includes(profile.objective)) {
    return null
  }
  return (
    <Card className="border-zinc-800" style={{ borderColor: 'rgba(13,148,136,0.3)' }}>
      <CardHeader>
        <CardTitle className="text-base" style={{ color: '#0D9488' }}>
          Jalons de progression
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(['load', 'neuromuscular', 'functional', 'return_sport'] as const).map((ph) => {
            const raw = protocol.rawAgentOutput as { exercises?: EnrichedExercise[] }
            const isActive = raw.exercises?.some((e) => e.phase === ph)
            return (
              <span
                key={ph}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                  isActive
                    ? 'bg-[#0D9488] text-white'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {PHASE_LABELS[ph]?.label ?? ph}
              </span>
            )
          })}
        </div>
        {profile.objective === 'return_performance' && (
          <p className="text-sm text-zinc-400">
            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 mr-2">LSI</span>
            Force symétrie &gt;90% requise avant retour complet
          </p>
        )}
        <p className="text-sm text-zinc-500">
          <span style={{ color: '#0D9488' }}>✓</span>{' '}
          Règle du lendemain : douleur ou raideur disparue le matin suivant la séance
        </p>
      </CardContent>
    </Card>
  )
})()}
```

Dans le Tab "Version patient", ajouter les nouvelles sections (après la card "Vos exercices") :

```tsx
{/* Section Comprendre ta douleur */}
{patientVersion.painEducation && (
  <Card className="border-zinc-800 bg-zinc-900/30">
    <CardHeader>
      <CardTitle className="text-base text-zinc-200">Comprendre ta douleur</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-zinc-400 italic leading-relaxed">
        "{patientVersion.painEducation.alarmMetaphor}"
      </p>
      {patientVersion.painEducation.flareUpPlan?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-400 mb-2">En cas de poussée douloureuse :</p>
          <ol className="space-y-1">
            {patientVersion.painEducation.flareUpPlan.map((step, i) => (
              <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                <span className="text-[#0D9488] font-bold flex-shrink-0">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </CardContent>
  </Card>
)}
```

Et dans la liste des exercices patient, afficher `whenToDo` si présent :
```tsx
{ex.whenToDo && (
  <p className="text-xs text-zinc-500 mt-1.5">
    🕐 {ex.whenToDo}
  </p>
)}
```

- [ ] **Vérifier la compilation** :

```bash
npx tsc --noEmit 2>&1 | grep ProtocolViewer
```

- [ ] **Commit**

```bash
git add src/components/protocol/ProtocolViewer.tsx
git commit -m "feat: ProtocolViewer — tempo/RPE/focus/progression, section RTS, painEducation patient"
```

---

## Task 12 — Design System : Teal + Amber + Geist

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Dans `src/app/layout.tsx`**, remplacer les imports de fonts :

```typescript
import { Syne, DM_Sans, Geist, Geist_Mono } from 'next/font/google'
```

Et ajouter après `dmSans` :
```typescript
const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})
```

Mettre à jour le `<body>` :
```tsx
<body className={`${syne.variable} ${dmSans.variable} ${geist.variable} ${geistMono.variable} font-body`}>
```

- [ ] **Dans `src/app/globals.css`**, mettre à jour `--primary` et ajouter les nouvelles variables dans le bloc `:root` :

Remplacer :
```css
  --primary: oklch(0.72 0.17 162);
  --primary-foreground: oklch(0.09 0.015 250);
```

Par :
```css
  --primary: oklch(0.60 0.13 185);
  --primary-foreground: oklch(0.98 0 0);
  --color-amber: oklch(0.78 0.17 70);
  --color-pubmed: oklch(0.44 0.09 155);
```

Et dans le bloc `@theme inline`, après `--font-mono: var(--font-geist-mono);`, ajouter :
```css
  --color-teal: oklch(0.60 0.13 185);
  --color-amber-perf: oklch(0.78 0.17 70);
```

Faire la même mise à jour dans le bloc `.dark` :
```css
  --primary: oklch(0.60 0.13 185);
  --primary-foreground: oklch(0.98 0 0);
```

- [ ] **Mettre à jour les sidebar-primary** dans les deux blocs `:root` et `.dark` :
```css
  --sidebar-primary: oklch(0.60 0.13 185);
```

- [ ] **Vérifier le build** :

```bash
npm run build 2>&1 | tail -15
```

Résultat attendu : `✓ Compiled successfully`

- [ ] **Commit final**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: design system — Surgical Teal #0D9488, Amber RPE, Geist font"
```

---

## Self-Review vs Spec

| Exigence spec | Tâche couverte |
|---|---|
| Pathologie combobox avec autocomplétion | Task 5 (Combobox) + Task 10 (ProtocolForm) |
| Stage 3 pills Aigu/Subaigu/Chronique | Task 10 |
| SINS 4 contrôles (3 pills chacun) | Task 4 (PillGroup) + Task 10 |
| Red Flags 5 checkboxes, gate obligatoire | Task 10 |
| Tooltip sur bouton désactivé | Task 10 |
| Étape 2 : âge, sexe, sport, niveau, objectif, fréquence +/- | Task 10 |
| Étape 3 : durée 3 pills, toggle PubMed, cascade loading | Task 10 |
| Types ProtocolDesignerInput enrichis | Task 2 |
| buildClinicalContext pure function testée | Task 6 |
| Prompt SINS/stage/objectif/niveau | Task 7 |
| Schema exercice tempo/RPE/focus/progression/phase | Task 7 |
| PatientWriterOutput painEducation + whenToDo | Task 2 + Task 8 |
| Patient writer vocabulaire nocebo + sections | Task 8 |
| ProtocolViewer tempo badge Mono | Task 11 |
| ProtocolViewer RPE badge Amber | Task 11 |
| ProtocolViewer cue externe italique | Task 11 |
| ProtocolViewer progression teal | Task 11 |
| Section RTS conditionnelle + LSI | Task 11 |
| Geist Sans + Geist Mono | Task 12 |
| Teal #0D9488 primary | Task 12 |
| Amber #F59E0B RPE | Task 11 + Task 12 |
| SQL colonnes sins/stage/patient_profile | Task 1 |
| Prisma schema mis à jour | Task 3 |
| Zod validation API | Task 9 |
