import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { designProtocol } from '@/lib/agents/protocol-designer'
import { enrichExercise } from '@/lib/agents/exercise-librarian'
import { writePatientVersion } from '@/lib/agents/patient-writer'
import type { ProtocolDesignerInput } from '@/types/agents'

export const runtime = 'edge'

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
  patientAge: z.number().int().optional(),
  patientSport: z.string().optional(),
  patientLevel: z.string().optional(),
  sessionDuration: z.number().int().optional(),
  sessionsPerWeek: z.number().int().optional(),
  constraints: z.array(z.string()).default([]),
  literatureContext: z.string().optional(),
})

function jsonResponse(data: object, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(req: NextRequest) {
  // Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return jsonResponse({ error: 'Non authentifié' }, 401)

  // Validation
  const parsed = BodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return jsonResponse(
      { success: false, error: 'Données invalides', details: parsed.error.flatten() },
      400
    )
  }
  const body = parsed.data

  // Billing check via Supabase (Edge-compatible — pas de Prisma)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [subResult, countResult] = await Promise.all([
    supabase.from('subscriptions').select('plan').eq('userId', user.id).single(),
    supabase
      .from('protocols')
      .select('id', { count: 'exact', head: true })
      .eq('userId', user.id)
      .gte('createdAt', startOfMonth.toISOString()),
  ])

  const plan: string = subResult.data?.plan ?? 'FREE'
  const protocolCount: number = countResult.count ?? 0

  if (plan === 'FREE' && protocolCount >= 3) {
    return jsonResponse(
      {
        error: 'Limite de 3 protocoles/mois atteinte sur le plan gratuit',
        current: protocolCount,
        limit: 3,
        upgradeUrl: '/billing',
      },
      403
    )
  }

  // Stream SSE — tout le reste se passe dans le ReadableStream
  const enc = new TextEncoder()
  const send = (controller: ReadableStreamDefaultController, data: object) => {
    controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`))
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Étape 1 — chargement des données cliniques
        send(controller, { type: 'progress', step: 1, total: 5, message: 'Chargement des données cliniques…' })

        const [pathRes, phaseRes] = await Promise.all([
          supabase.from('pathologies').select('id, name, region').eq('id', body.pathologyId).single(),
          supabase.from('phases').select('id, name, description, criteria').eq('id', body.phaseId).single(),
        ])

        if (pathRes.error || !pathRes.data) {
          throw new Error(`Pathologie introuvable : ${body.pathologyId}`)
        }
        if (phaseRes.error || !phaseRes.data) {
          throw new Error(`Phase introuvable : ${body.phaseId}`)
        }

        const pathology = pathRes.data as { id: string; name: string; region: string }
        const phase = phaseRes.data as { id: string; name: string; description: string | null; criteria: string[] }

        // Étape 2 — génération du protocole clinique
        send(controller, { type: 'progress', step: 2, total: 5, message: 'Génération du protocole clinique…' })

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

        // Étape 3 — enrichissement des exercices
        send(controller, { type: 'progress', step: 3, total: 5, message: 'Enrichissement des exercices…' })

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

        // Étape 4 — rédaction version patient
        send(controller, { type: 'progress', step: 4, total: 5, message: 'Rédaction version patient…' })

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

        // Étape 5 — finalisation
        send(controller, { type: 'progress', step: 5, total: 5, message: 'Finalisation…' })

        // Émettre le résultat complet — la sauvegarde DB se fait dans /api/save-protocol
        send(controller, {
          type: 'done',
          protocol: {
            protocolOutput,
            enrichedExercises,
            patientOutput,
            meta: {
              userId: user.id,
              pathologyId: pathology.id,
              phaseId: phase.id,
              patientAge: body.patientProfile?.age ?? body.patientAge,
              patientSport: body.patientProfile?.sport ?? body.patientSport,
              patientLevel: body.patientProfile?.level ?? body.patientLevel,
              sessionDuration: body.patientProfile?.sessionDuration ?? body.sessionDuration,
              sessionsPerWeek: body.patientProfile?.sessionsPerWeek ?? body.sessionsPerWeek,
              constraints: body.constraints,
              sins: body.sins,
              stage: body.stage,
              patientProfile: body.patientProfile,
              hasLiteratureContext: !!body.literatureContext,
            },
          },
        })
      } catch (error) {
        send(controller, {
          type: 'error',
          message: error instanceof Error ? error.message : 'Erreur lors de la génération du protocole',
          code: 'GENERATION_ERROR',
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
