import { prisma } from '@/lib/prisma'
import { designProtocol } from '@/lib/agents/protocol-designer'
import { enrichExercise } from '@/lib/agents/exercise-librarian'
import { writePatientVersion } from '@/lib/agents/patient-writer'
import type { ExerciseType, ExerciseLevel } from '@prisma/client'

const DEMO_INPUT = {
  pathologyName: 'Entorse latérale de cheville',
  region: 'cheville',
  phaseName: 'Renforcement',
  phaseDescription: 'Renforcement progressif et proprioception',
  phaseCriteria: ["douleur ≤ 2/10 à l'effort", 'mobilité > 80% du côté sain'],
  patientAge: 32,
  patientSport: 'football amateur',
  patientLevel: 'amateur',
  sessionDuration: 45,
  sessionsPerWeek: 3,
  constraints: [] as string[],
}

export async function generateDemoProtocol(userId: string): Promise<string> {
  const pathology = await prisma.pathology.findFirst({
    where: { name: 'Entorse latérale de cheville' },
  })
  const phase = await prisma.phase.findFirst({
    where: { name: 'Renforcement' },
  })

  if (!pathology || !phase) throw new Error('Données seed manquantes pour la démo')

  const protocolOutput = await designProtocol(DEMO_INPUT)

  const enrichedExercises = await Promise.all(
    protocolOutput.exercises.map(async (ex) => {
      const enriched = await enrichExercise({ name: ex.name, region: ex.region, objective: ex.objective })
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
    patientAge: DEMO_INPUT.patientAge,
    patientSport: DEMO_INPUT.patientSport,
  })

  const protocol = await prisma.protocol.create({
    data: {
      userId,
      pathologyId: pathology.id,
      phaseId: phase.id,
      patientAge: DEMO_INPUT.patientAge,
      patientSport: DEMO_INPUT.patientSport,
      patientLevel: DEMO_INPUT.patientLevel,
      sessionDuration: DEMO_INPUT.sessionDuration,
      sessionsPerWeek: DEMO_INPUT.sessionsPerWeek,
      constraints: [],
      objectives: protocolOutput.objectives,
      progression: protocolOutput.progressionCriteria,
      sessionStructure: protocolOutput.sessionStructure as object,
      rawAgentOutput: protocolOutput as object,
      patientVersion: JSON.stringify(patientOutput),
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
  })

  await prisma.userProfile.upsert({
    where: { userId },
    create: { userId, onboardingCompleted: true },
    update: { onboardingCompleted: true },
  })

  return protocol.id
}
