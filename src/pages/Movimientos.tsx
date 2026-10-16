import { useMoney } from '@/hooks/useMoney'
import { useMemo, useState } from 'react'
import { CategoryManager } from '@/components/features/CategoryManager'
import { RecurringManager } from '@/components/features/RecurringManager'
import { TransactionForm } from '@/components/features/TransactionForm'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { Select, type SelectOption } from '@/components/ui/Select'
import { iconPath } from '@/lib/categoryIcons'
import { StatCard } from '@/components/ui/StatCard'
import { TextField } from '@/components/ui/TextField'
import { useAsyncData } from '@/hooks/useAsyncData'
import {
  createTransaction,
  deleteTransaction,
  listCategories,
  listTransactions,
  updateTransaction,
} from '@/lib/data'
import { currentMonth, formatDate } from '@/lib/format'
import type { Category, Transaction, TransactionFilters, TransactionInput } from '@/types/db'

const PLUS = 'M12 5v14M5 12h14'
const EDIT = 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z'
const TRASH = 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6'
const LIST_ICON = 'M7 7h13M7 7l3-3M7 7l3 3M17 17H4M17 17l-3-3M17 17l-3 3'

type Tab = 'movements' | 'recurring' | 'categories'

// Referencias estables para evitar recalcular memos mientras no hay datos.
const NO_CATEGORIES: readonly Category[] = []
const NO_TRANSACTIONS: readonly Transaction[] = []

const TYPE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'income', label: 'Ingresos' },
  { value: 'expense', label: 'Gastos' },
]

export function MovimientosPage() {
  const { money } = useMoney()
  const [tab, setTab] = useState<Tab>('movements')
  const [filters, setFilters] = useState<TransactionFilters>({
    month: currentMonth(),
    type: 'all',
    categoryId: 'all',
  })
  const [formState, setFormState] = useState<{ open: boolean; editing?: Transaction | undefined }>({ open: false })
  const [toDelete, setToDelete] = useState<Transaction | null>(null)

  const categoriesQuery = useAsyncData(listCategories, [])
  const transactionsQuery = useAsyncData(
    () => listTransactions(filters),
    [filters.month, filters.type, filters.categoryId],
  )

  const categories: readonly Category[] = categoriesQuery.data ?? NO_CATEGORIES
  const transactions: readonly Transaction[] = transactionsQuery.data ?? NO_TRANSACTIONS
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const totals = useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of transactions) {
      if (t.type === 'income') income += t.amount
      else expense += t.amount
    }
    return { income, expense, balance: income - expense }
  }, [transactions])

  const categoryOptions: SelectOption[] = [
    { value: 'all', label: 'Todas', icon: iconPath('star'), color: '#10b981' },
    { value: 'none', label: 'Sin categoría', icon: iconPath('tag'), color: '#64748b' },
    ...categories
      .filter((c) => filters.type === 'all' || c.type === filters.type)
      .map((c) => ({ value: c.id, label: c.name, icon: iconPath(c.icon), color: c.color })),
  ]

  function setFilter<K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) {
    setFilters((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'type') next.categoryId = 'all'
      return next
    })
  }

  async function handleSave(input: TransactionInput) {
    if (formState.editing) await updateTransaction(formState.editing.id, input)
    else await createTransaction(input)
    setFormState({ open: false })
    transactionsQuery.reload()
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Movimientos" description="Registra y gestiona tus ingresos y gastos." />
        <button
          type="button"
          onClick={() => setFormState({ open: true })}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white shadow-card transition-all hover:bg-brand-600 hover:shadow-lift active:scale-[0.99]"
        >
          <Icon path={PLUS} className="h-4 w-4" />
          Nuevo movimiento
        </button>
      </div>

      <div role="tablist" aria-label="Secciones" className="mb-6 inline-flex rounded-xl bg-surface p-1 shadow-card ring-1 ring-line">
        {(
          [
            ['movements', 'Movimientos'],
            ['recurring', 'Programados'],
            ['categories', 'Categorías'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === value ? 'bg-brand-700 text-white shadow-card' : 'text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'recurring' ? (
        <RecurringManager categories={categories} onGenerated={transactionsQuery.reload} />
      ) : tab === 'categories' ? (
        <>
          {categoriesQuery.error && <Alert tone="error">{categoriesQuery.error}</Alert>}
          <CategoryManager categories={categories} onChanged={categoriesQuery.reload} />
        </>
      ) : (
        <>
          <Card delay={60}>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                label="Mes"
                type="month"
                name="month"
                value={filters.month}
                onChange={(value) => value && setFilter('month', value)}
              />
              <Select
                label="Tipo"
                value={filters.type}
                onChange={(value) => setFilter('type', value as TransactionFilters['type'])}
                options={TYPE_OPTIONS}
              />
              <Select
                label="Categoría"
                value={filters.categoryId}
                onChange={(value) => setFilter('categoryId', value)}
                options={categoryOptions}
              />
            </div>
          </Card>

          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <StatCard
              label="Ingresos"
              value={money(totals.income)}
              hint="Del período filtrado"
              icon="M12 19V5M5 12l7-7 7 7"
              delay={120}
            />
            <StatCard
              label="Gastos"
              value={money(totals.expense)}
              hint="Del período filtrado"
              icon="M12 5v14M5 12l7 7 7-7"
              delay={200}
            />
            <StatCard
              label="Balance"
              value={money(totals.balance)}
              hint="Ingresos menos gastos"
              icon="M3 7h18v12H3zM3 7l3-3h12l3 3M16 13h2"
              delay={280}
            />
          </div>

          <Card className="mt-5" delay={340}>
            {transactionsQuery.error ? (
              <div className="space-y-3">
                <Alert tone="error">{transactionsQuery.error}</Alert>
                <button
                  type="button"
                  onClick={transactionsQuery.reload}
                  className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-brand-50"
                >
                  Reintentar
                </button>
              </div>
            ) : transactionsQuery.loading && !transactionsQuery.data ? (
              <div className="flex justify-center py-12">
                <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-500" />
              </div>
            ) : transactions.length === 0 ? (
              <EmptyState
                icon={LIST_ICON}
                title="Sin movimientos en este período"
                description="Agrega tu primer ingreso o gasto con el botón “Nuevo movimiento”."
              />
            ) : (
              <ul className="divide-y divide-line">
                {transactions.map((t) => {
                  const category = t.category_id ? categoryById.get(t.category_id) : undefined
                  const isIncome = t.type === 'income'
                  return (
                    <li key={t.id} className="flex items-center gap-3 py-3">
                      <CategoryBadge icon={category?.icon} color={category?.color} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {t.name || t.description || category?.name || 'Sin categoría'}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {category?.name ?? 'Sin categoría'} · {formatDate(t.occurred_on)}
                        </p>
                        {t.name && t.description && (
                          <p className="truncate text-xs text-muted/80">{t.description}</p>
                        )}
                      </div>
                      <p
                        className={`shrink-0 text-sm font-semibold ${
                          isIncome ? 'text-link' : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {isIncome ? '+' : '−'}
                        {money(t.amount)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setFormState({ open: true, editing: t })}
                        aria-label="Editar movimiento"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-brand-50 hover:text-ink"
                      >
                        <Icon path={EDIT} className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setToDelete(t)}
                        aria-label="Eliminar movimiento"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-500/10 hover:text-red-600"
                      >
                        <Icon path={TRASH} className="h-4 w-4" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </>
      )}

      {formState.open && (
        <Modal
          title={formState.editing ? 'Editar movimiento' : 'Nuevo movimiento'}
          onClose={() => setFormState({ open: false })}
        >
          <TransactionForm categories={categories} initial={formState.editing} onSubmit={handleSave} />
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Eliminar movimiento"
          message={`Se eliminará ${toDelete.name || toDelete.description ? `"${toDelete.name || toDelete.description}"` : 'el movimiento'} por ${money(toDelete.amount)}. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            await deleteTransaction(toDelete.id)
            setToDelete(null)
            transactionsQuery.reload()
          }}
        />
      )}
    </>
  )
}
