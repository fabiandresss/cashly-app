import { STATUS_STYLES } from '@/lib/budgets'
import type { BudgetStatus } from '@/types/db'

interface ProgressBarProps {
  /** Fracción gastada; puede superar 1. */
  ratio: number
  status: BudgetStatus
  label: string
}

export function ProgressBar({ ratio, status, label }: ProgressBarProps) {
  const width = Math.min(Math.max(ratio, 0), 1) * 100
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(Math.min(ratio, 1) * 100)}
      className="h-2.5 overflow-hidden rounded-full bg-canvas"
    >
      <div
        className={`h-full rounded-full transition-all duration-700 ${STATUS_STYLES[status].bar}`}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
