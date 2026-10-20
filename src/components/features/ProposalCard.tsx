import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { useMoney } from '@/hooks/useMoney'
import { formatDate } from '@/lib/format'
import type { TransactionProposal } from '@/lib/assistant'
import type { Category } from '@/types/db'

export type ProposalStatus = 'pending' | 'saving' | 'saved' | 'dismissed'

interface ProposalCardProps {
  proposal: TransactionProposal
  status: ProposalStatus
  error: string | null
  category: Category | undefined
  onConfirm: () => void
  onEdit: () => void
  onDismiss: () => void
}

export function ProposalCard({ proposal, status, error, category, onConfirm, onEdit, onDismiss }: ProposalCardProps) {
  const { money } = useMoney()
  const isIncome = proposal.type === 'income'
  const settled = status === 'saved' || status === 'dismissed'

  return (
    <div className="ml-[2.9rem] max-w-[85%] rounded-[var(--r-md)] bg-surface p-4 shadow-[var(--shadow-2)]">
      <p className="fx-eyebrow">
        {status === 'saved'
          ? 'Registrado'
          : status === 'dismissed'
            ? 'Descartado'
            : `Confirma este ${isIncome ? 'ingreso' : 'gasto'}`}
      </p>

      <div className="mt-2 flex items-center gap-3">
        <CategoryBadge icon={category?.icon} color={category?.color} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{proposal.name}</p>
          <p className="truncate text-xs text-muted">
            {proposal.category_name ?? 'Sin categoría'} · {formatDate(proposal.occurred_on)}
          </p>
          {proposal.description && <p className="truncate text-xs text-muted/80">{proposal.description}</p>}
        </div>
        <p
          className={`shrink-0 text-base font-bold ${
            isIncome ? 'text-positive' : 'text-ink'
          }`}
        >
          {isIncome ? '+' : '−'}
          {money(proposal.amount)}
        </p>
      </div>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      {!settled && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={status === 'saving'}
            className="fx-btn fx-btn--accent fx-btn--sm disabled:opacity-60"
          >
            {status === 'saving' ? 'Registrando…' : 'Registrar'}
          </button>
          <button
            type="button"
            onClick={onEdit}
            disabled={status === 'saving'}
            className="fx-btn fx-btn--soft fx-btn--sm disabled:opacity-60"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={onDismiss}
            disabled={status === 'saving'}
            className="fx-btn fx-btn--ghost fx-btn--sm disabled:opacity-60"
          >
            Descartar
          </button>
        </div>
      )}
    </div>
  )
}
