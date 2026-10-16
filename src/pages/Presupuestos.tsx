import { useMoney } from '@/hooks/useMoney'
import { useMemo, useState } from 'react'
import { BudgetForm } from '@/components/features/BudgetForm'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StatCard } from '@/components/ui/StatCard'
import { useAsyncData } from '@/hooks/useAsyncData'
import { budgetStatus, STATUS_STYLES, sumExpenses } from '@/lib/budgets'
import {
  copyBudgets,
  createBudget,
  DEFAULT_ALERT_THRESHOLD,
  deleteBudget,
  getAlertThreshold,
  listBudgets,
  listCategories,
  listMonthExpenses,
  updateBudget,
} from '@/lib/data'
import { currentMonth, monthRange, monthTitle, shiftMonth } from '@/lib/format'
import type { Budget, Category } from '@/types/db'

const PLUS = 'M12 5v14M5 12h14'
const EDIT = 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z'
const TRASH = 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6'
const CHEVRON_LEFT = 'M15 6l-6 6 6 6'
const CHEVRON_RIGHT = 'M9 6l6 6-6 6'
const WALLET = 'M3 7a2 2 0 012-2h13v4M3 7v10a2 2 0 002 2h15V9H5a2 2 0 01-2-2zM16 14h.01'

const NO_CATEGORIES: readonly Category[] = []
const NO_BUDGETS: readonly Budget[] = []

const percent = new Intl.NumberFormat('es-CL', { style: 'percent', maximumFractionDigits: 0 })

export function PresupuestosPage() {
  const { money } = useMoney()
  const [month, setMonth] = useState(currentMonth())
  const [formState, setFormState] = useState<{ open: boolean; editing?: Budget | undefined }>({ open: false })
  const [toDelete, setToDelete] = useState<Budget | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [copying, setCopying] = useState(false)

  const budgetsQuery = useAsyncData(() => listBudgets(month), [month])
  const expensesQuery = useAsyncData(() => listMonthExpenses(month), [month])
  const categoriesQuery = useAsyncData(listCategories, [])
  const thresholdQuery = useAsyncData(getAlertThreshold, [])

  const budgets = budgetsQuery.data ?? NO_BUDGETS
  const categories = categoriesQuery.data ?? NO_CATEGORIES
  const threshold = thresholdQuery.data ?? DEFAULT_ALERT_THRESHOLD
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const spent = useMemo(() => sumExpenses(expensesQuery.data ?? []), [expensesQuery.data])
  const totalBudget = budgets.find((b) => b.category_id === null)
  const categoryBudgets = useMemo(
    () =>
      budgets
        .filter((b) => b.category_id !== null)
        .sort((a, b) => {
          const na = categoryById.get(a.category_id ?? '')?.name ?? ''
          const nb = categoryById.get(b.category_id ?? '')?.name ?? ''
          return na.localeCompare(nb, 'es')
        }),
    [budgets, categoryById],
  )

  const budgetedCategoryIds = new Set(categoryBudgets.map((b) => b.category_id))
  const availableCategories = categories.filter((c) => c.type === 'expense' && !budgetedCategoryIds.has(c.id))

  const sumOfCategoryBudgets = categoryBudgets.reduce((acc, b) => acc + b.amount, 0)
  const limit = totalBudget?.amount ?? sumOfCategoryBudgets
  const available = limit - spent.total
  const isCurrentMonth = month === currentMonth()

  const loading = budgetsQuery.loading && !budgetsQuery.data
  const error = budgetsQuery.error ?? expensesQuery.error ?? categoriesQuery.error

  function reloadAll() {
    budgetsQuery.reload()
    expensesQuery.reload()
  }

  async function handleSave(input: { category_id: string | null; amount: number }) {
    if (formState.editing) {
      await updateBudget(formState.editing.id, input.amount)
    } else {
      await createBudget({ ...input, month: monthRange(month).from })
    }
    setFormState({ open: false })
    reloadAll()
  }

  async function handleCopy() {
    setCopying(true)
    setCopyError(null)
    setNotice(null)
    try {
      const count = await copyBudgets(shiftMonth(month, -1), month)
      setNotice(
        count === 0
          ? 'No había presupuestos nuevos para copiar del mes anterior.'
          : `Se copiaron ${count} presupuesto${count === 1 ? '' : 's'} del mes anterior.`,
      )
      reloadAll()
    } catch (err) {
      setCopyError(err instanceof Error ? err.message : 'No se pudieron copiar los presupuestos.')
    } finally {
      setCopying(false)
    }
  }

  function renderBudgetCard(budget: Budget, index: number) {
    const category = budget.category_id ? categoryById.get(budget.category_id) : undefined
    const used = budget.category_id ? (spent.byCategory.get(budget.category_id) ?? 0) : 0
    const ratio = budget.amount > 0 ? used / budget.amount : 0
    const status = budgetStatus(used, budget.amount, threshold)
    const styles = STATUS_STYLES[status]
    const remaining = budget.amount - used

    return (
      <Card key={budget.id} interactive delay={300 + index * 70}>
        <div className="flex items-center gap-3">
          <CategoryBadge icon={category?.icon} color={category?.color} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-heading">{category?.name ?? 'Categoría'}</p>
            <p className={`text-xs font-medium ${styles.text}`}>{styles.label}</p>
          </div>
          <button
            type="button"
            onClick={() => setFormState({ open: true, editing: budget })}
            aria-label={`Editar presupuesto de ${category?.name ?? 'categoría'}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-brand-50 hover:text-ink"
          >
            <Icon path={EDIT} className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setToDelete(budget)}
            aria-label={`Eliminar presupuesto de ${category?.name ?? 'categoría'}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-500/10 hover:text-red-600"
          >
            <Icon path={TRASH} className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex items-baseline justify-between text-sm">
          <span className="font-semibold text-ink">{money(used)}</span>
          <span className="text-muted">de {money(budget.amount)}</span>
        </div>
        <div className="mt-2">
          <ProgressBar ratio={ratio} status={status} label={`Avance del presupuesto de ${category?.name ?? 'categoría'}`} />
        </div>
        <p className={`mt-2 text-xs ${remaining < 0 ? STATUS_STYLES.exceeded.text : 'text-muted'}`}>
          {remaining >= 0
            ? `Te quedan ${money(remaining)} · ${percent.format(ratio)} usado`
            : `Te pasaste por ${money(-remaining)}`}
        </p>
      </Card>
    )
  }

  const totalStatus = totalBudget ? budgetStatus(spent.total, totalBudget.amount, threshold) : 'ok'

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 sm:mb-0">
        <PageHeader title="Presupuestos" description="Define límites de gasto y sigue su cumplimiento." />
        <button
          type="button"
          onClick={() => setFormState({ open: true })}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white shadow-card transition-all hover:bg-brand-600 hover:shadow-lift active:scale-[0.99] sm:w-auto"
        >
          <Icon path={PLUS} className="h-4 w-4" />
          Nuevo presupuesto
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex w-full items-center rounded-xl bg-surface p-1 shadow-card ring-1 ring-line sm:inline-flex sm:w-auto">
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            aria-label="Mes anterior"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-brand-50 hover:text-ink"
          >
            <Icon path={CHEVRON_LEFT} className="h-5 w-5" />
          </button>
          <span className="min-w-0 flex-1 px-2 text-center sm:min-w-40 sm:flex-none text-sm font-semibold text-heading first-letter:uppercase">
            {monthTitle(month)}
          </span>
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            aria-label="Mes siguiente"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-brand-50 hover:text-ink"
          >
            <Icon path={CHEVRON_RIGHT} className="h-5 w-5" />
          </button>
        </div>
        {!isCurrentMonth && (
          <button
            type="button"
            onClick={() => setMonth(currentMonth())}
            className="text-sm font-semibold text-link hover:text-link-hover"
          >
            Ir al mes actual
          </button>
        )}
        <button
          type="button"
          onClick={handleCopy}
          disabled={copying}
          className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 sm:ml-auto sm:w-auto text-sm font-semibold text-ink transition-colors hover:bg-brand-50 disabled:opacity-60"
        >
          {copying ? 'Copiando…' : 'Copiar del mes anterior'}
        </button>
      </div>

      {error && (
        <div className="mb-5 space-y-3">
          <Alert tone="error">{error}</Alert>
          <button
            type="button"
            onClick={reloadAll}
            className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-brand-50"
          >
            Reintentar
          </button>
        </div>
      )}
      {copyError && (
        <div className="mb-5">
          <Alert tone="error">{copyError}</Alert>
        </div>
      )}
      {notice && (
        <div className="mb-5">
          <Alert tone="success">{notice}</Alert>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard
          label={totalBudget ? 'Presupuesto total' : 'Suma de presupuestos'}
          value={money(limit)}
          hint={totalBudget ? 'Límite global del mes' : 'Suma de los límites por categoría'}
          icon={WALLET}
          delay={80}
        />
        <StatCard
          label="Gastado"
          value={money(spent.total)}
          hint="Todos los gastos del mes"
          icon="M12 5v14M5 12l7 7 7-7"
          delay={160}
        />
        <StatCard
          label={available >= 0 ? 'Disponible' : 'Excedido'}
          value={money(Math.abs(available))}
          hint={limit > 0 ? `${percent.format(spent.total / limit)} del límite usado` : 'Define un presupuesto'}
          icon="M3 7h18v12H3zM3 7l3-3h12l3 3M16 13h2"
          delay={240}
        />
      </div>

      {totalBudget && (
        <Card className="mt-5" delay={300}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-heading">Presupuesto total del mes</h2>
              <p className={`text-xs font-medium ${STATUS_STYLES[totalStatus].text}`}>
                {STATUS_STYLES[totalStatus].label}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormState({ open: true, editing: totalBudget })}
              aria-label="Editar presupuesto total"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-brand-50 hover:text-ink"
            >
              <Icon path={EDIT} className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setToDelete(totalBudget)}
              aria-label="Eliminar presupuesto total"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-500/10 hover:text-red-600"
            >
              <Icon path={TRASH} className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex items-baseline justify-between text-sm">
            <span className="font-semibold text-ink">{money(spent.total)}</span>
            <span className="text-muted">de {money(totalBudget.amount)}</span>
          </div>
          <div className="mt-2">
            <ProgressBar
              ratio={totalBudget.amount > 0 ? spent.total / totalBudget.amount : 0}
              status={totalStatus}
              label="Avance del presupuesto total"
            />
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-500" />
        </div>
      ) : categoryBudgets.length === 0 && !totalBudget ? (
        <Card className="mt-5" delay={300}>
          <EmptyState
            icon="M12 3a9 9 0 109 9h-9V3z"
            title="Sin presupuestos este mes"
            description="Crea un límite por categoría o uno total, o copia los del mes anterior."
          />
        </Card>
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {categoryBudgets.map((budget, index) => renderBudgetCard(budget, index))}
        </div>
      )}

      {formState.open && (
        <Modal
          title={formState.editing ? 'Editar presupuesto' : 'Nuevo presupuesto'}
          onClose={() => setFormState({ open: false })}
        >
          <BudgetForm
            availableCategories={availableCategories}
            canCreateTotal={!totalBudget}
            initial={formState.editing}
            initialLabel={
              formState.editing
                ? formState.editing.category_id
                  ? categoryById.get(formState.editing.category_id)?.name
                  : 'Presupuesto total del mes'
                : undefined
            }
            onSubmit={handleSave}
          />
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Eliminar presupuesto"
          message={`Se eliminará el límite de ${money(toDelete.amount)}. Tus movimientos no se modifican.`}
          confirmLabel="Eliminar"
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            await deleteBudget(toDelete.id)
            setToDelete(null)
            reloadAll()
          }}
        />
      )}
    </>
  )
}
