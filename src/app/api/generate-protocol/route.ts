import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { designProtocol } from '@/lib/agents/protocol-designer'
import { enrichExercise } from '@/lib/agents/exercise-librarian'
import { writePatientVersion } from '@/lib/agents/patient-writer'
import type { ProtocolDesignerInput } from '@/types/agents'
import type { ExerciseType, ExerciseLevel } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      pathologyId,
      phaseId,
      patientAge,
      patientSport,
      patientLevel,
      sessionDuration,
      sessionsPerWeek,
      constraints,
    } = body

    // Chargement en parallèle de la pathologie et de la phase
    const [pathology, phase] = await Promise.all([
      prisma.pathology.findUniqueOrThrow({ where: { id: pathologyId } }),
      prisma.phase.findUniqueOrThrow({ where: { id: phaseId } }),
    ])

    // Préparation de l'input pour l'agent Protocol Designer
    const agentInput: ProtocolDesignerInput = {
      pathologyName: pathology.name,
      region: pathology.region,
      phaseName: phase.name,
      phaseDescription: phase.description ?? '',
      phaseCriteria: phase.criteria,
      patientAge,
      patientSport,
      patientLevel,
      sessionDuration,
      sessionsPerWeek,
      constraints: constraints ?? [],
    }

    // Appel de l'agent Protocol Designer
    const protocolOutput = await designProtocol(agentInput)

    // Enrichissement de chaque exercice via l'agent Exercise Librarian
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

    // Sauvegarde des exercices en base (upsert par slug)
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

    // Génération de la version patient via l'agent Patient Writer
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
      patientAge,
      patientSport,
    })

    // Création du protocole final en base avec tous ses exercices
    const protocol = await prisma.protocol.create({
      data: {
        pathologyId: pathology.id,
        phaseId: phase.id,
        patientAge,
        patientSport,
        patientLevel,
        sessionDuration,
        sessionsPerWeek,
        constraints: constraints ?? [],
        objectives: protocolOutput.objectives,
        progression: protocolOutput.progressionCriteria,
        sessionStructure: protocolOutput.sessionStructure,
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
      { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}
