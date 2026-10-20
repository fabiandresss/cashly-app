import { useState } from 'react'
import { ContributionForm } from '@/components/features/ContributionForm'
import { SavingsSimulator } from '@/components/features/SavingsSimulator'
import { GoalForm } from '@/components/features/GoalForm'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useMoney } from '@/hooks/useMoney'
import {
  addContribution,
  createGoal,
  deleteContribution,
  deleteGoal,
  listContributions,
  listGoals,
  updateGoal,
} from '@/lib/data'
import { formatDate, todayISO } from '@/lib/format'
import type { GoalInput, SavingsGoal } from '@/types/db'

const PLUS = 'M12 5v14M5 12h14'
const EDIT = 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z'
const TRASH = 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6'
const CLOCK = 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2'
const CALC = 'M5 3h14v18H5zM8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01'
const TARGET = 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 17a5 5 0 100-10 5 5 0 000 10zM12 13a1 1 0 100-2 1 1 0 000 2z'

const percent = new Intl.NumberFormat('es-CL', { style: 'percent', maximumFractionDigits: 0 })

/** Cuánto aportar por mes para llegar a la fecha objetivo, o null si no aplica. */
function monthlyNeeded(goal: SavingsGoal): number | null {
  if (!goal.target_date) return null
  const remaining = goal.target_amount - goal.saved
  if (remaining <= 0) return null
  const days = (new Date(`${goal.target_date}T00:00:00`).getTime() - new Date(`${todayISO()}T00:00:00`).getTime()) / 86_400_000
  if (days <= 0) return null
  return remaining / Math.max(1, Math.ceil(days / 30.4))
}

function ContributionHistory({ goal, onChanged }: { goal: SavingsGoal; onChanged: () => void }) {
  const { money } = useMoney()
  const query = useAsyncData(() => listContributions(goal.id), [goal.id])
  const [error, setError] = useState<string | null>(null)
  const items = query.data ?? []

  async function remove(id: string) {
    setError(null)
    try {
      await deleteContribution(id)
      query.reload()
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el registro.')
    }
  }

  if (query.loading && !query.data) {
    return (
      <div className="flex justify-center py-8">
        <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-mute border-t-ink" />
      </div>
    )
  }
  if (query.error) return <Alert tone="error">{query.error}</Alert>
  if (items.length === 0) return <p className="text-sm text-muted">Aún no hay aportes en esta meta.</p>

  return (
    <div className="space-y-3">
      {error && <Alert tone="error">{error}</Alert>}
      <ul className="fx-list fx-list--flat">
        {items.map((c) => (
          <li key={c.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink">{c.note || (c.amount > 0 ? 'Aporte' : 'Retiro')}</p>
              <p className="text-xs text-muted">{formatDate(c.contributed_on)}</p>
            </div>
            <p
              className={`shrink-0 text-sm font-semibold ${
                c.amount > 0 ? 'text-positive' : 'text-ink'
              }`}
            >
              {c.amount > 0 ? '+' : '−'}
              {money(Math.abs(c.amount))}
            </p>
            <button
              type="button"
              onClick={() => void remove(c.id)}
              aria-label="Eliminar registro"
              className="fx-iconbtn fx-iconbtn--ghost fx-iconbtn--sm shrink-0"
            >
              <Icon path={TRASH} className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function MetasPage() {
  const { money } = useMoney()
  const query = useAsyncData(listGoals, [])
  const [form, setForm] = useState<{ open: boolean; editing?: SavingsGoal | undefined }>({ open: false })
  const [contributing, setContributing] = useState<SavingsGoal | null>(null)
  const [history, setHistory] = useState<SavingsGoal | null>(null)
  const [toDelete, setToDelete] = useState<SavingsGoal | null>(null)
  const [simulating, setSimulating] = useState<{ open: boolean; goal?: SavingsGoal | undefined }>({ open: false })

  const goals = query.data ?? []
  const totalSaved = goals.reduce((acc, g) => acc + g.saved, 0)
  const totalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0)

  async function handleSave(input: GoalInput) {
    if (form.editing) await updateGoal(form.editing.id, input)
    else await createGoal(input)
    setForm({ open: false })
    query.reload()
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 sm:mb-0">
        <PageHeader title="Metas de ahorro" description="Define objetivos y sigue cuánto llevas ahorrado." />
        <div className="flex w-full gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => setSimulating({ open: true })}
            className="fx-btn fx-btn--soft flex-1 sm:flex-none"
          >
            <Icon path={CALC} className="h-4 w-4" />
            Simulador
          </button>
          <button
            type="button"
            onClick={() => setForm({ open: true })}
            className="fx-btn fx-btn--accent flex-1 sm:flex-none"
          >
            <Icon path={PLUS} className="h-4 w-4" />
            Nueva meta
          </button>
        </div>
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

      {goals.length > 0 && (
        <div className="fx-card fx-enter fx-grid-stats mb-4" data-cols="3">
          <StatCard label="Ahorrado en metas" value={money(totalSaved)} hint="Suma de todas tus metas" icon={TARGET} delay={60} />
          <StatCard
            label="Objetivo total"
            value={money(totalTarget)}
            hint={`${goals.length} meta${goals.length === 1 ? '' : 's'}`}
            icon="M3 7h18v12H3zM3 7l3-3h12l3 3M16 13h2"
            delay={130}
          />
          <StatCard
            label="Avance general"
            value={totalTarget > 0 ? percent.format(Math.min(totalSaved / totalTarget, 1)) : '—'}
            hint="Sobre el objetivo total"
            icon="M3 17l6-6 4 4 8-8M15 7h6v6"
            delay={200}
          />
        </div>
      )}

      {query.loading && !query.data ? (
        <div className="flex justify-center py-16">
          <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-mute border-t-ink" />
        </div>
      ) : goals.length === 0 && !query.error ? (
        <Card className="mt-5" delay={100}>
          <EmptyState
            icon={TARGET}
            title="Aún no tienes metas"
            description="Crea tu primera meta, por ejemplo: vacaciones o un fondo de emergencia."
          />
        </Card>
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal, index) => {
            const ratio = goal.target_amount > 0 ? goal.saved / goal.target_amount : 0
            const done = goal.saved >= goal.target_amount
            const needed = monthlyNeeded(goal)
            return (
              <Card key={goal.id} interactive delay={260 + index * 70}>
                <div className="flex items-center gap-3">
                  <CategoryBadge icon={goal.icon} color={goal.color} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold tracking-tight text-ink">{goal.name}</p>
                    <p className="text-xs text-muted">
                      {done
                        ? '¡Meta cumplida!'
                        : goal.target_date
                          ? `Para el ${formatDate(goal.target_date)}`
                          : 'Sin fecha objetivo'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ open: true, editing: goal })}
                    aria-label={`Editar ${goal.name}`}
                    className="fx-iconbtn fx-iconbtn--ghost fx-iconbtn--sm"
                  >
                    <Icon path={EDIT} className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(goal)}
                    aria-label={`Eliminar ${goal.name}`}
                    className="fx-iconbtn fx-iconbtn--ghost fx-iconbtn--sm"
                  >
                    <Icon path={TRASH} className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 flex items-baseline justify-between text-sm">
                  <span className="fx-num text-lg font-semibold tracking-tight text-ink">{money(goal.saved)}</span>
                  <span className="text-muted">de {money(goal.target_amount)}</span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`Avance de ${goal.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(Math.min(ratio, 1) * 100)}
                  className="mt-2 h-2 overflow-hidden rounded-full bg-mute"
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(Math.max(ratio, 0), 1) * 100}%`, backgroundColor: goal.color }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted">
                  {percent.format(Math.min(ratio, 1))} completado
                  {needed !== null && ` · Necesitas ${money(needed)} al mes`}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setContributing(goal)}
                    className="fx-btn fx-btn--primary"
                  >
                    Aportar / retirar
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistory(goal)}
                    className="fx-btn fx-btn--soft"
                  >
                    <Icon path={CLOCK} className="h-4 w-4" />
                    Historial
                  </button>
                </div>
                {!done && (
                  <button
                    type="button"
                    onClick={() => setSimulating({ open: true, goal })}
                    className="fx-btn fx-btn--soft fx-btn--sm mt-3 w-full"
                  >
                    <Icon path={CALC} className="h-4 w-4" />
                    Simular cuándo llego
                  </button>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {form.open && (
        <Modal title={form.editing ? 'Editar meta' : 'Nueva meta'} onClose={() => setForm({ open: false })}>
          <GoalForm initial={form.editing} onSubmit={handleSave} />
        </Modal>
      )}

      {contributing && (
        <Modal title={`Aportar a ${contributing.name}`} onClose={() => setContributing(null)}>
          <ContributionForm
            available={Math.max(contributing.saved, 0)}
            onSubmit={async (amount, note, date) => {
              await addContribution(contributing.id, amount, note, date)
              setContributing(null)
              query.reload()
            }}
          />
        </Modal>
      )}

      {simulating.open && (
        <Modal
          title={simulating.goal ? `Simular · ${simulating.goal.name}` : 'Simulador de ahorro'}
          onClose={() => setSimulating({ open: false })}
        >
          <SavingsSimulator
            {...(simulating.goal
              ? {
                  initialTarget: simulating.goal.target_amount,
                  initialSaved: Math.max(simulating.goal.saved, 0),
                  targetDate: simulating.goal.target_date,
                  initialMonthly: monthlyNeeded(simulating.goal) ?? 100_000,
                }
              : { initialMonthly: 100_000 })}
          />
        </Modal>
      )}

      {history && (
        <Modal title={`Historial · ${history.name}`} onClose={() => setHistory(null)}>
          <ContributionHistory goal={history} onChanged={query.reload} />
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Eliminar meta"
          message={`Se eliminará "${toDelete.name}" y su historial de aportes. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            await deleteGoal(toDelete.id)
            setToDelete(null)
            query.reload()
          }}
        />
      )}
    </>
  )
}
