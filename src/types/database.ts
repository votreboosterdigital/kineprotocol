import type { Protocol, Pathology, Phase, Exercise, ProtocolExercise } from '@prisma/client'

export type ProtocolWithRelations = Protocol & {
  pathology: Pathology
  phase: Phase
  exercises: Array<
    ProtocolExercise & {
      exercise: Exercise
    }
  >
}

export type ExerciseWithProtocols = Exercise & {
  protocolExercises: ProtocolExercise[]
}
