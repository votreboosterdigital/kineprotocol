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
