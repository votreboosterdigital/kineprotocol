import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PillGroup } from '@/components/ui/pill-group'

const options = [
  { value: 'a' as const, label: 'Option A' },
  { value: 'b' as const, label: 'Option B' },
  { value: 'c' as const, label: 'Option C' },
]

describe('PillGroup', () => {
  it('rend toutes les options', () => {
    render(<PillGroup options={options} value={null} onChange={() => {}} />)
    expect(screen.getByText('Option A')).toBeDefined()
    expect(screen.getByText('Option B')).toBeDefined()
    expect(screen.getByText('Option C')).toBeDefined()
  })

  it('applique la classe active sur la valeur sélectionnée', () => {
    render(<PillGroup options={options} value="b" onChange={() => {}} />)
    const selected = screen.getByText('Option B').closest('button')
    const unselected = screen.getByText('Option A').closest('button')
    expect(selected?.className).toContain('bg-[#0D9488]')
    expect(unselected?.className).not.toContain('bg-[#0D9488]')
  })

  it('appelle onChange avec la bonne valeur au clic', () => {
    const onChange = vi.fn()
    render(<PillGroup options={options} value={null} onChange={onChange} />)
    fireEvent.click(screen.getByText('Option C'))
    expect(onChange).toHaveBeenCalledWith('c')
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('applique la taille sm', () => {
    render(<PillGroup options={options} value={null} onChange={() => {}} size="sm" />)
    const btn = screen.getByText('Option A').closest('button')
    expect(btn?.className).toContain('text-xs')
  })
})
