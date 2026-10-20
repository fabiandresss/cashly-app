import { useMemo, useState } from 'react'
import { DebtForm } from '@/components/features/DebtForm'
import { PayDebtForm } from '@/components/features/PayDebtForm'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useMoney } from '@/hooks/useMoney'
import {
  createDebt,
  deleteDebt,
  listCategories,
  listDebtPayments,
  listDebts,
  payDebt,
  undoDebtPayment,
  updateDebt,
} from '@/lib/data'
import { formatDate, todayISO } from '@/lib/format'
import type { Category, Debt, DebtInput, DebtPayment } from '@/types/db'

const PLUS = 'M12 5v14M5 12h14'
const EDIT = 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z'
const TRASH = 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6'
const CLOCK = 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2'
const CARD = 'M3 6h18v12H3zM3 10h18M7 15h4M16 15h1'
const CHECK = 'M5 12l5 5L20 7'

const NO_CATEGORIES: readonly Category[] = []
const NO_DEBTS: readonly Debt[] = []
const percent = new Intl.NumberFormat('es-CL', { style: 'percent', maximumFractionDigits: 0 })

function daysUntil(dueISO: string): number {
  const ms = new Date(`${dueISO}T00:00:00`).getTime() - new Date(`${todayISO()}T00:00:00`).getTime()
  return Math.round(ms / 86_400_000)
}

function dueInfo(dueISO: string | null): { text: string; tone: 'danger' | 'warning' | 'normal' } | null {
  if (!dueISO) return null
  const days = daysUntil(dueISO)
  if (days < 0) return { text: `Vencida hace ${-days} día${days === -1 ? '' : 's'}`, tone: 'danger' }
  if (days === 0) return { text: 'Vence hoy', tone: 'warning' }
  if (days <= 7) return { text: `Vence en ${days} día${days === 1 ? '' : 's'}`, tone: 'warning' }
  return { text: `Vence el ${formatDate(dueISO)}`, tone: 'normal' }
}

const TONE_CLASS = {
  danger: 'text-danger',
  warning: 'text-[var(--warning)]',
  normal: 'text-muted',
} as const

function PaymentHistory({ debt, onChanged }: { debt: Debt; onChanged: () => void }) {
  const { money } = useMoney()
  const query = useAsyncData(() => listDebtPayments(debt.id), [debt.id])
  const [toUndo, setToUndo] = useState<DebtPayment | null>(null)
  const payments = query.data ?? []

  if (query.loading && !query.data) {
    return (
      <div className="flex justify-center py-8">
        <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-mute border-t-ink" />
      </div>
    )
  }
  if (query.error) return <Alert tone="error">{query.error}</Alert>
  if (payments.length === 0) return <p className="text-sm text-muted">Aún no has registrado pagos de esta deuda.</p>

  return (
    <>
      <ul className="fx-list fx-list--flat">
        {payments.map((p) => (
          <li key={p.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">Pago</p>
              <p className="text-xs text-muted">{formatDate(p.paid_on)}</p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-ink">{money(p.amount)}</p>
            <button
              type="button"
              onClick={() => setToUndo(p)}
              aria-label="Deshacer pago"
              title="Deshacer pago"
              className="fx-iconbtn fx-iconbtn--ghost fx-iconbtn--sm shrink-0"
            >
              <Icon path={TRASH} className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      {toUndo && (
        <ConfirmDialog
          title="Deshacer pago"
          message={`Se eliminará este pago de ${money(toUndo.amount)} y también el gasto que se había generado en tus movimientos.`}
          confirmLabel="Deshacer"
          onCancel={() => setToUndo(null)}
          onConfirm={async () => {
            await undoDebtPayment(toUndo.id)
            setToUndo(null)
            query.reload()
            onChanged()
          }}
        />
      )}
    </>
  )
}

export function DeudasPage() {
  const { money } = useMoney()
  const query = useAsyncData(listDebts, [])
  const categoriesQuery = useAsyncData(listCategories, [])
  const categories = categoriesQuery.data ?? NO_CATEGORIES

  const [form, setForm] = useState<{ open: boolean; editing?: Debt | undefined }>({ open: false })
  const [paying, setPaying] = useState<Debt | null>(null)
  const [history, setHistory] = useState<Debt | null>(null)
  const [toDelete, setToDelete] = useState<Debt | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const debts = query.data ?? NO_DEBTS
  const { pending, settled, totals } = useMemo(() => {
    const open: Debt[] = []
    const closed: Debt[] = []
    let remaining = 0
    let paid = 0
    for (const d of debts) {
      paid += d.paid
      if (d.total_amount - d.paid > 0.004) {
        open.push(d)
        remaining += d.total_amount - d.paid
      } else {
        closed.push(d)
      }
    }
    open.sort((a, b) => {
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      if (a.due_date) return -1
      if (b.due_date) return 1
      return 0
    })
    return { pending: open, settled: closed, totals: { remaining, paid } }
  }, [debts])

  const nextDue = pending.find((d) => d.due_date)

  async function handleSave(input: DebtInput) {
    if (form.editing) await updateDebt(form.editing.id, input)
    else await createDebt(input)
    setForm({ open: false })
    query.reload()
  }

  function renderDebt(debt: Debt, index: number, isSettled: boolean) {
    const remaining = Math.max(debt.total_amount - debt.paid, 0)
    const ratio = debt.total_amount > 0 ? debt.paid / debt.total_amount : 0
    const due = isSettled ? null : dueInfo(debt.due_date)
    return (
      <Card key={debt.id} interactive delay={240 + index * 60}>
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-card ${
              isSettled ? 'bg-accent text-accent-ink' : 'bg-[var(--chip)] text-ink'
            }`}
            aria-hidden="true"
          >
            <Icon path={isSettled ? CHECK : CARD} className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold tracking-tight text-ink">{debt.name}</p>
            {isSettled ? (
              <p className="text-xs font-medium text-link">Pagada por completo</p>
            ) : due ? (
              <p className={`text-xs font-medium ${TONE_CLASS[due.tone]}`}>{due.text}</p>
            ) : (
              <p className="text-xs text-muted">Sin fecha de vencimiento</p>
            )}
            {debt.notes && <p className="truncate text-xs text-muted/80">{debt.notes}</p>}
          </div>
          <button
            type="button"
            onClick={() => setForm({ open: true, editing: debt })}
            aria-label={`Editar ${debt.name}`}
            className="fx-iconbtn fx-iconbtn--ghost fx-iconbtn--sm shrink-0"
          >
            <Icon path={EDIT} className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setToDelete(debt)}
            aria-label={`Eliminar ${debt.name}`}
            className="fx-iconbtn fx-iconbtn--ghost fx-iconbtn--sm shrink-0"
          >
            <Icon path={TRASH} className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-baseline justify-between text-sm">
          <span className="fx-num text-lg font-semibold tracking-tight text-ink">{isSettled ? money(debt.total_amount) : money(remaining)}</span>
          <span className="text-muted">
            {isSettled ? 'total pagado' : `pendiente de ${money(debt.total_amount)}`}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={`Pagado de ${debt.name}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(Math.min(ratio, 1) * 100)}
          className="mt-2 h-2 overflow-hidden rounded-full bg-mute"
        >
          <div
            className="h-full rounded-full bg-ink transition-all duration-700"
            style={{ width: `${Math.min(Math.max(ratio, 0), 1) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          {money(debt.paid)} pagados · {percent.format(Math.min(ratio, 1))}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {!isSettled ? (
            <button
              type="button"
              onClick={() => setPaying(debt)}
              className="fx-btn fx-btn--primary"
            >
              Pagar
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => setHistory(debt)}
            className="fx-btn fx-btn--soft"
          >
            <Icon path={CLOCK} className="h-4 w-4" />
            Pagos
          </button>
        </div>
      </Card>
    )
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 sm:mb-0">
        <PageHeader title="Deudas" description="Registra lo que debes y págalo cuando corresponda." />
        <button
          type="button"
          onClick={() => setForm({ open: true })}
          className="fx-btn fx-btn--accent w-full sm:w-auto"
        >
          <Icon path={PLUS} className="h-4 w-4" />
          Nueva deuda
        </button>
      </div>

      {query.error && (
        <div className="mb-5 space-y-3">
          <Alert tone="error">{query.error}</Alert>
          <button
            type="button"
            onClick={query.reload}
            className="fx-btn fx-btn--soft fx-btn--sm"
          >
            Reintentar
          </button>
        </div>
      )}
      {notice && (
        <div className="mb-5">
          <Alert tone="success">{notice}</Alert>
        </div>
      )}

      {debts.length > 0 && (
        <div className="fx-card fx-enter fx-grid-stats mb-4" data-cols="3">
          <StatCard
            label="Total pendiente"
            value={money(totals.remaining)}
            hint={`${pending.length} deuda${pending.length === 1 ? '' : 's'} activa${pending.length === 1 ? '' : 's'}`}
            icon={CARD}
            delay={60}
          />
          <StatCard
            label="Ya pagado"
            value={money(totals.paid)}
            hint="Suma de todos tus pagos"
            icon={CHECK}
            delay={130}
          />
          <StatCard
            label="Próximo vencimiento"
            value={nextDue?.due_date ? formatDate(nextDue.due_date) : '—'}
            hint={nextDue ? nextDue.name : 'Sin fechas de vencimiento'}
            icon="M3 5h18v16H3zM16 3v4M8 3v4M3 10h18"
            delay={200}
          />
        </div>
      )}

      {query.loading && !query.data ? (
        <div className="flex justify-center py-16">
          <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-mute border-t-ink" />
        </div>
      ) : debts.length === 0 && !query.error ? (
        <Card className="mt-5" delay={100}>
          <EmptyState
            icon={CARD}
            title="Sin deudas registradas"
            description="Crea una deuda y, cuando la pagues, un botón generará el gasto en tus movimientos."
          />
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {pending.map((d, i) => renderDebt(d, i, false))}
            </div>
          )}
          {settled.length > 0 && (
            <>
              <h2 className="fx-eyebrow fx-group-label !mt-8">Pagadas</h2>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {settled.map((d, i) => renderDebt(d, i, true))}
              </div>
            </>
          )}
        </>
      )}

      {form.open && (
        <Modal title={form.editing ? 'Editar deuda' : 'Nueva deuda'} onClose={() => setForm({ open: false })}>
          <DebtForm categories={categories} initial={form.editing} onSubmit={handleSave} />
        </Modal>
      )}

      {paying && (
        <Modal title="Registrar pago" onClose={() => setPaying(null)}>
          <PayDebtForm
            debtName={paying.name}
            remaining={Math.max(paying.total_amount - paying.paid, 0)}
            onSubmit={async (amount, paidOn) => {
              await payDebt(paying.id, amount, paidOn)
              setNotice(`Se registró el pago de ${money(amount)} y se creó el gasto "Pago: ${paying.name}" en tus movimientos.`)
              setPaying(null)
              query.reload()
            }}
          />
        </Modal>
      )}

      {history && (
        <Modal title={`Pagos · ${history.name}`} onClose={() => setHistory(null)}>
          <PaymentHistory debt={history} onChanged={query.reload} />
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Eliminar deuda"
          message={`Se eliminará "${toDelete.name}" y su historial de pagos. Los gastos ya generados en tus movimientos se mantienen.`}
          confirmLabel="Eliminar"
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            await deleteDebt(toDelete.id)
            setToDelete(null)
            query.reload()
          }}
        />
      )}
    </>
  )
}
