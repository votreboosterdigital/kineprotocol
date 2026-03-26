import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/generate-protocol/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mocks
vi.mock('@/lib/prisma', () => ({
  prisma: {
    pathology: { findUniqueOrThrow: vi.fn() },
    phase: { findUniqueOrThrow: vi.fn() },
    exercise: { upsert: vi.fn() },
    protocol: { create: vi.fn() },
  },
}))

vi.mock('@/lib/agents/protocol-designer', () => ({
  designProtocol: vi.fn().mockResolvedValue({
    objectives: ['Réduire la douleur'],
    progressionCriteria: ['Douleur < 3/10'],
    sessionStructure: {
      warmup: { duration: 10, description: 'Échauffement' },
      main: { duration: 25, description: 'Principal' },
      cooldown: { duration: 10, description: 'Retour au calme' },
    },
    exercises: [{
      name: 'Squat mural',
      region: 'genou',
      objective: 'renforcement',
      type: 'STRENGTH',
      level: 'BEGINNER',
      equipment: [],
      description: 'Squat contre le mur',
      cues: ['Dos droit'],
      commonErrors: [],
      variants: [],
      sets: 3,
      reps: '10',
      rest: '60s',
      order: 1,
    }],
    clinicalNotes: 'Surveiller douleur',
  }),
}))

vi.mock('@/lib/agents/exercise-librarian', () => ({
  enrichExercise: vi.fn().mockResolvedValue({
    name: 'Squat isométrique contre mur',
    slug: 'squat-isometrique-contre-mur',
    description: 'Description enrichie',
    cues: ['Cue 1'],
    commonErrors: [],
    variants: [],
    tags: ['genou'],
    suggestedVideoSearch: 'wall squat',
  }),
}))

vi.mock('@/lib/agents/patient-writer', () => ({
  writePatientVersion: vi.fn().mockResolvedValue({
    title: 'Votre programme de rééducation',
    introduction: 'Bienvenue',
    objectives: ['Réduire la douleur'],
    exercises: [{ name: 'Squat', howTo: 'Comment faire', sets: '3x10', tip: 'Conseil' }],
    progressionMessage: 'Progression',
    importantWarnings: [],
    motivationalClose: 'Bon courage',
  }),
}))

describe('POST /api/generate-protocol', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const mockedPrisma = vi.mocked(prisma, true)
    mockedPrisma.pathology.findUniqueOrThrow.mockResolvedValue({
      id: 'path-1', name: 'Entorse cheville', region: 'cheville',
    } as any)
    mockedPrisma.phase.findUniqueOrThrow.mockResolvedValue({
      id: 'phase-aigu', name: 'Aigu', description: 'Phase aiguë', criteria: ['douleur ≤ 6/10'],
    } as any)
    mockedPrisma.exercise.upsert.mockResolvedValue({ id: 'ex-1', slug: 'squat-isometrique-contre-mur' } as any)
    mockedPrisma.protocol.create.mockResolvedValue({
      id: 'proto-1', pathologyId: 'path-1', phaseId: 'phase-aigu',
      pathology: { name: 'Entorse cheville' },
      phase: { name: 'Aigu' },
      exercises: [],
    } as any)
  })

  it('retourne 200 avec un protocole valide', async () => {
    const req = new NextRequest('http://localhost/api/generate-protocol', {
      method: 'POST',
      body: JSON.stringify({ pathologyId: 'path-1', phaseId: 'phase-aigu', constraints: [] }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.protocol).toBeDefined()
  })

  it('retourne 500 si pathologie non trouvée', async () => {
    vi.mocked(prisma.pathology.findUniqueOrThrow).mockRejectedValue(new Error('Not found'))

    const req = new NextRequest('http://localhost/api/generate-protocol', {
      method: 'POST',
      body: JSON.stringify({ pathologyId: 'invalid', phaseId: 'phase-aigu', constraints: [] }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.success).toBe(false)
  })
})
