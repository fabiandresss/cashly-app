import { Segmented } from '@/components/fx'
import type { TransactionType } from '@/types/db'

interface TypeToggleProps {
  value: TransactionType
  onChange: (value: TransactionType) => void
}

const OPTIONS = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
] as const

export function TypeToggle({ value, onChange }: TypeToggleProps) {
  return <Segmented role="radio" variant="plain" label="Tipo" options={OPTIONS} value={value} onChange={onChange} />
}
