'use client'
import { cn } from '@/lib/utils'

interface PillOption<T extends string> {
  value: T
  label: string
}

interface PillGroupProps<T extends string> {
  options: PillOption<T>[]
  value: T | null
  onChange: (value: T) => void
  size?: 'sm' | 'md'
}

export function PillGroup<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: PillGroupProps<T>) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-full font-medium border transition-all duration-150',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
            value === opt.value
              ? 'bg-[#0D9488] border-[#0D9488] text-white'
              : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 bg-transparent'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
