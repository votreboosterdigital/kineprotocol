import { describe, it, expect } from 'vitest'
import { buildClinicalContext } from '@/lib/agents/clinical-context'

describe('buildClinicalContext', () => {
  it('retourne une chaîne vide si tous les params sont nulls', () => {
    const result = buildClinicalContext(undefined, undefined, undefined)
    expect(result.trim()).toBe('')
  })

  it('signale la sévérité élevée avec isométrie', () => {
    const result = buildClinicalContext(
      { severity: 'high', irritability: 'low', nature: 'mechanical' },
      undefined,
      undefined
    )
    expect(result).toContain('ÉLEVÉE')
    expect(result).toContain('isométrie prioritaire')
  })

  it('contraint le stage aigu à ≤50% 1RM', () => {
    const result = buildClinicalContext(undefined, 'acute', undefined)
    expect(result).toContain('AIGU')
    expect(result).toContain('50% 1RM')
  })

  it('inclut LSI pour return_performance', () => {
    const result = buildClinicalContext(undefined, undefined, {
      age: 25, sex: 'M', sport: 'football',
      level: 'elite', objective: 'return_performance',
      sessionsPerWeek: 3, sessionDuration: 45,
    })
    expect(result).toContain('LSI >90%')
    expect(result).toContain('Hop tests')
  })

  it('spécifie RPE 5-6 pour niveau sédentaire', () => {
    const result = buildClinicalContext(undefined, undefined, {
      age: 60, sex: 'F', sport: '',
      level: 'sedentary', objective: 'return_activity',
      sessionsPerWeek: 2, sessionDuration: 30,
    })
    expect(result).toContain('RPE 4-5/10')
  })

  it('indique mobilisation neurale pour SINS neuropathique', () => {
    const result = buildClinicalContext(
      { severity: 'low', irritability: 'low', nature: 'neuropathic' },
      undefined,
      undefined
    )
    expect(result).toContain('mobilisation neurale')
  })
})
