import { describe, it, expect, vi } from 'vitest'
import { designProtocol } from '@/lib/agents/protocol-designer'

vi.mock('@/lib/anthropic', () => ({
  anthropic: {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify({
            objectives: ['Réduire la douleur', 'Restaurer la mobilité'],
            progressionCriteria: ['Douleur < 3/10'],
            sessionStructure: {
              warmup: { duration: 10, description: 'Échauffement général' },
              main: { duration: 25, description: 'Exercices principaux' },
              cooldown: { duration: 10, description: 'Retour au calme' },
            },
            exercises: [],
            clinicalNotes: 'Surveiller œdème résiduel',
          }),
        }],
      }),
    },
  },
  CLAUDE_MODEL: 'claude-opus-4-5',
}))

describe('protocol-designer agent', () => {
  it('retourne un protocole valide pour entorse de cheville', async () => {
    const result = await designProtocol({
      pathologyName: 'Entorse latérale de cheville',
      region: 'cheville',
      phaseName: 'Aigu',
      phaseDescription: 'Phase inflammatoire',
      phaseCriteria: ['douleur ≤ 6/10'],
      constraints: [],
    })

    expect(result.objectives).toBeInstanceOf(Array)
    expect(result.objectives.length).toBeGreaterThan(0)
    expect(result.sessionStructure).toHaveProperty('warmup')
    expect(result.sessionStructure).toHaveProperty('main')
    expect(result.sessionStructure).toHaveProperty('cooldown')
  })

  it('lève une erreur si la réponse est un JSON invalide', async () => {
    const { anthropic } = await import('@/lib/anthropic')
    vi.mocked(anthropic.messages.create).mockResolvedValueOnce({
      content: [{ type: 'text', text: 'réponse invalide sans json' }],
    } as any)

    await expect(
      designProtocol({
        pathologyName: 'Test',
        region: 'genou',
        phaseName: 'Aigu',
        phaseDescription: '',
        phaseCriteria: [],
        constraints: [],
      })
    ).rejects.toThrow('Agent 1')
  })
})
