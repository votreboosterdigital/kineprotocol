import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { canGenerateProtocol } from '@/lib/billing'
import type { ExerciseType, ExerciseLevel } from '@prisma/client'

// Schéma du payload émis par la route Edge dans l'event `done`
const MetaSchema = z.object({
  userId: z.string(),
  pathologyId: z.string(),
  phaseId: z.string(),
  patientAge: z.number().int().optional(),
  patientSport: z.string().optional(),
  patientLevel: z.string().optional(),
  sessionDuration: z.number().int().optional(),
  sessionsPerWeek: z.number().int().optional(),
  constraints: z.array(z.string()).default([]),
  sins: z.object({
    severity: z.enum(['low', 'medium', 'high']),
    irritability: z.enum(['low', 'medium', 'high']),
    nature: z.enum(['mechanical', 'inflammatory', 'neuropathic']),
  }).optional(),
  stage: z.enum(['acute', 'subacute', 'chronic']).optional(),
  patientProfile: z.object({
    age: z.number().int(),
    sex: z.enum(['M', 'F']),
    sport: z.string(),
    level: z.enum(['sedentary', 'amateur', 'competitive', 'elite']),
    objective: z.enum(['return_activity', 'return_sport', 'return_performance']),
    sessionsPerWeek: z.number().int(),
    sessionDuration: z.union([z.literal(30), z.literal(45), z.literal(60)]),
  }).optional(),
  hasLiteratureContext: z.boolean().default(false),
})

const BodySchema = z.object({
  protocolOutput: z.object({
    objectives: z.array(z.string()),
    progressionCriteria: z.array(z.string()),
    sessionStructure: z.record(z.string(), z.unknown()),
    exercises: z.array(z.record(z.string(), z.unknown())),
    clinicalNotes: z.string().optional(),
  }),
  enrichedExercises: z.array(z.object({
    name: z.string(),
    slug: z.string(),
    region: z.string(),
    objective: z.string(),
    type: z.string(),
    level: z.string(),
    equipment: z.array(z.string()),
    description: z.string(),
    cues: z.array(z.string()),
    commonErrors: z.array(z.string()),
    variants: z.array(z.string()),
    tags: z.array(z.string()),
    sets: z.number().optional(),
    reps: z.string().optional(),
    rest: z.string().optional(),
  })),
  patientOutput: z.unknown(),
  meta: MetaSchema,
})

export async function POST(req: NextRequest) {
  try {
    // Vérification auth — l'utilisateur doit être le même que dans meta.userId
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const parsed = BodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Payload invalide', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { protocolOutput, enrichedExercises, patientOutput, meta } = parsed.data

    // Vérification que le userId du payload correspond à l'utilisateur connecté
    if (meta.userId !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Billing check (Node.js — Prisma)
    const { allowed, reason, current, limit } = await canGenerateProtocol(user.id)
    if (!allowed) {
      return NextResponse.json(
        { error: reason, current, limit, upgradeUrl: '/billing' },
        { status: 403 }
      )
    }

    // Upsert exercices
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

    // Création du protocole
    const protocol = await prisma.protocol.create({
      data: {
        userId: user.id,
        pathologyId: meta.pathologyId,
        phaseId: meta.phaseId,
        patientAge: meta.patientProfile?.age ?? meta.patientAge,
        patientSport: meta.patientProfile?.sport ?? meta.patientSport,
        patientLevel: meta.patientProfile?.level ?? meta.patientLevel,
        sessionDuration: meta.patientProfile?.sessionDuration ?? meta.sessionDuration,
        sessionsPerWeek: meta.patientProfile?.sessionsPerWeek ?? meta.sessionsPerWeek,
        constraints: meta.constraints,
        objectives: protocolOutput.objectives,
        progression: protocolOutput.progressionCriteria,
        sessionStructure: protocolOutput.sessionStructure as object,
        rawAgentOutput: protocolOutput as object,
        patientVersion: JSON.stringify(patientOutput),
        hasLiteratureContext: meta.hasLiteratureContext,
        sins: meta.sins ?? undefined,
        stage: meta.stage ?? undefined,
        patientProfile: meta.patientProfile ?? undefined,
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
    console.error('[save-protocol]', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la sauvegarde du protocole' },
      { status: 500 }
    )
  }
}
