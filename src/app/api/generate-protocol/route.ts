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
