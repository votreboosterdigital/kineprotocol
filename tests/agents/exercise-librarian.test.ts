import { describe, it, expect, vi } from 'vitest'
import { enrichExercise } from '@/lib/agents/exercise-librarian'

vi.mock('@/lib/anthropic', () => ({
  anthropic: {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify({
            name: 'Squat isométrique contre mur',
            slug: 'squat-isometrique-contre-mur',
            description: 'Position squat maintenue contre un mur.',
            cues: ['Dos plat contre le mur', 'Genoux à 90°'],
            commonErrors: ['Genoux qui débordent les orteils'],
            variants: ['Angle 45°', 'Ajout de charge'],
            tags: ['genou', 'quadriceps', 'isométrique'],
            suggestedVideoSearch: 'wall squat isometric physiotherapy',
          }),
        }],
      }),
    },
  },
  CLAUDE_MODEL: 'claude-opus-4-5',
}))

describe('exercise-librarian agent', () => {
  it('enrichit un exercice avec slug et cues', async () => {
    const result = await enrichExercise({
      name: 'Squat mural',
      region: 'genou',
      objective: 'renforcement quadriceps',
    })

    expect(result.slug).toMatch(/^[a-z0-9-]+$/)
    expect(result.cues).toBeInstanceOf(Array)
    expect(result.tags).toBeInstanceOf(Array)
    expect(result.description).toBeTruthy()
  })
})
