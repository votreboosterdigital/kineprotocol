// Traductions françaises des enums Prisma pour l'affichage UI
import type { ExerciseType, ExerciseLevel } from '@prisma/client'

export const EXERCISE_TYPE_FR: Record<ExerciseType, string> = {
  MOBILITY:         'Mobilité',
  STRENGTH:         'Renforcement',
  PLYOMETRIC:       'Pliométrie',
  MOTOR_CONTROL:    'Contrôle moteur',
  STRETCHING:       'Étirement',
  PROPRIOCEPTION:   'Proprioception',
  CARDIO:           'Cardio',
}

export const EXERCISE_LEVEL_FR: Record<ExerciseLevel, string> = {
  BEGINNER:     'Débutant',
  INTERMEDIATE: 'Intermédiaire',
  ADVANCED:     'Avancé',
}
