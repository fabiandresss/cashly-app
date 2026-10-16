import type { TransactionType } from '@/types/db'

interface TypeToggleProps {
  value: TransactionType
  onChange: (value: TransactionType) => void
}

const OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
]

export function TypeToggle({ value, onChange }: TypeToggleProps) {
  return (
    <div role="radiogroup" aria-label="Tipo" className="grid grid-cols-2 gap-1 rounded-xl bg-canvas p-1">
      {OPTIONS.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              active
                ? option.value === 'expense'
                  ? 'bg-surface text-red-600 shadow-card dark:text-red-400'
                  : 'bg-surface text-link shadow-card'
                : 'text-muted hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
