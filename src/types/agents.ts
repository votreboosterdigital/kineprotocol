// ===== AGENT 1 — Protocol Designer =====
export interface ProtocolDesignerInput {
  pathologyName: string
  region: string
  phaseName: string
  phaseDescription: string
  phaseCriteria: string[]
  patientAge?: number
  patientSport?: string
  patientLevel?: string
  sessionDuration?: number
  sessionsPerWeek?: number
  constraints: string[]
  literatureContext?: string
}

export interface ProtocolDesignerOutput {
  objectives: string[]
  progressionCriteria: string[]
  sessionStructure: {
    warmup: { duration: number; description: string }
    main: { duration: number; description: string }
    cooldown: { duration: number; description: string }
  }
  exercises: Array<{
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
    order: number
  }>
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
  }>
  progressionMessage: string
  importantWarnings: string[]
  motivationalClose: string
}
