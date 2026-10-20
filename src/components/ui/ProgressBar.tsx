import { Progress } from '@/components/fx'
import type { BudgetStatus } from '@/types/db'

interface ProgressBarProps {
  /** Fracción gastada; puede superar 1. */
  ratio: number
  status: BudgetStatus
  label: string
}

const TONE = { ok: 'ink', warning: 'warning', exceeded: 'danger' } as const

export function ProgressBar({ ratio, status, label }: ProgressBarProps) {
  return <Progress value={ratio} tone={TONE[status]} label={label} />
}
