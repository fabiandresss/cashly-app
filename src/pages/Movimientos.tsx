import { useEffect, useMemo, useState } from 'react'
import { CategoryManager } from '@/components/features/CategoryManager'
import { RecurringManager } from '@/components/features/RecurringManager'
import { TemplateManager } from '@/components/features/TemplateManager'
import { TransactionForm, type TransactionSeed } from '@/components/features/TransactionForm'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { MoneyField } from '@/components/ui/MoneyField'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select, type SelectOption } from '@/components/ui/Select'
import { StatCard } from '@/components/ui/StatCard'
import { TextField } from '@/components/ui/TextField'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useMoney } from '@/hooks/useMoney'
import { iconPath } from '@/lib/categoryIcons'
import {
  createTemplate,
  createTransaction,
  deleteTransaction,
  listCategories,
  listTemplates,
  listTransactions,
  SEARCH_LIMIT,
  updateTransaction,
} from '@/lib/data'
import { currentMonth, formatDate, todayISO } from '@/lib/format'
import type {
  Category,
  PeriodMode,
  Transaction,
  TransactionFilters,
  TransactionInput,
  TransactionTemplate,
} from '@/types/db'

const PLUS = 'M12 5v14M5 12h14'
const EDIT = 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z'
const TRASH = 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6'
const STAR = 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3 1.2-6.8-5-4.9 6.9-1z'
const LIST_ICON = 'M7 7h13M7 7l3-3M7 7l3 3M17 17H4M17 17l-3-3M17 17l-3 3'
const PAGE_SIZE = 100

type Tab = 'movements' | 'recurring' | 'templates' | 'categories'

// Referencias estables para evitar recalcular memos mientras no hay datos.
const NO_CATEGORIES: readonly Category[] = []
const NO_TRANSACTIONS: readonly Transaction[] = []
const NO_TEMPLATES: readonly TransactionTemplate[] = []

const TYPE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'income', label: 'Ingresos' },
  { value: 'expense', label: 'Gastos' },
]

const PERIOD_OPTIONS: { value: PeriodMode; label: string }[] = [
  { value: 'month', label: 'Un mes' },
  { value: 'range', label: 'Rango de fechas' },
  { value: 'all', label: 'Todo el historial' },
]

const DEFAULT_FILTERS: TransactionFilters = {
  period: 'month',
  month: currentMonth(),
  from: '',
  to: '',
  type: 'all',
  categoryId: 'all',
  query: '',
  minAmount: '',
  maxAmount: '',
}

export function MovimientosPage() {
  const { money } = useMoney()
  const [tab, setTab] = useState<Tab>('movements')
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS)
  // Los campos de texto se aplican con un pequeño retraso para no consultar en cada tecla.
  const [draft, setDraft] = useState({ query: '', minAmount: '', maxAmount: '' })
  // Cuántos movimientos se muestran; se reinicia solo cuando cambian los resultados.
  const [visibleState, setVisibleState] = useState<{ data: unknown; count: number }>({ data: null, count: PAGE_SIZE })
  const [formState, setFormState] = useState<{
    open: boolean
    editing?: Transaction | undefined
    seed?: TransactionSeed | undefined
  }>({ open: false })
  const [toDelete, setToDelete] = useState<Transaction | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const categoriesQuery = useAsyncData(listCategories, [])
  const templatesQuery = useAsyncData(listTemplates, [])
  const transactionsQuery = useAsyncData(
    () => listTransactions(filters),
    [
      filters.period,
      filters.month,
      filters.from,
      filters.to,
      filters.type,
      filters.categoryId,
      filters.query,
      filters.minAmount,
      filters.maxAmount,
    ],
  )

  useEffect(() => {
    const id = setTimeout(() => {
      setFilters((prev) =>
        prev.query === draft.query && prev.minAmount === draft.minAmount && prev.maxAmount === draft.maxAmount
          ? prev
          : { ...prev, ...draft },
      )
    }, 400)
    return () => clearTimeout(id)
  }, [draft])

  const visible = visibleState.data === transactionsQuery.data ? visibleState.count : PAGE_SIZE
  const categories: readonly Category[] = categoriesQuery.data ?? NO_CATEGORIES
  const transactions: readonly Transaction[] = transactionsQuery.data ?? NO_TRANSACTIONS
  const templates: readonly TransactionTemplate[] = templatesQuery.data ?? NO_TEMPLATES
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

  const filtersActive =
    filters.period !== 'month' ||
    filters.month !== currentMonth() ||
    filters.type !== 'all' ||
    filters.categoryId !== 'all' ||
    draft.query !== '' ||
    draft.minAmount !== '' ||
    draft.maxAmount !== ''

  function setFilter<K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) {
    setFilters((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'type') next.categoryId = 'all'
      return next
    })
  }

  function clearFilters() {
    setFilters({ ...DEFAULT_FILTERS, month: currentMonth() })
    setDraft({ query: '', minAmount: '', maxAmount: '' })
  }

  async function handleSave(input: TransactionInput) {
    if (formState.editing) await updateTransaction(formState.editing.id, input)
    else await createTransaction(input)
    setFormState({ open: false })
    transactionsQuery.reload()
  }

  function applyTemplate(template: TransactionTemplate) {
    setTab('movements')
    setFormState({
      open: true,
      seed: {
        type: template.type,
        amount: template.amount,
        category_id: template.category_id,
        name: template.name,
        description: template.description,
        occurred_on: todayISO(),
      },
    })
  }

  async function saveAsTemplate(t: Transaction) {
    setNotice(null)
    setActionError(null)
    const name = t.name || t.description
    if (!name) {
      setActionError('Ponle un nombre al movimiento antes de guardarlo como plantilla.')
      return
    }
    try {
      await createTemplate({
        type: t.type,
        amount: t.amount,
        category_id: t.category_id,
        name: name.slice(0, 100),
        description: t.name ? t.description : null,
      })
      setNotice(`"${name}" quedó guardado como plantilla.`)
      templatesQuery.reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo guardar la plantilla.')
    }
  }

  const shown = transactions.slice(0, visible)
  const truncated = transactions.length >= SEARCH_LIMIT

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 sm:mb-0">
        <PageHeader title="Movimientos" description="Registra y gestiona tus ingresos y gastos." />
        <button
          type="button"
          onClick={() => setFormState({ open: true })}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white shadow-card transition-all hover:bg-brand-600 hover:shadow-lift active:scale-[0.99] sm:w-auto"
        >
          <Icon path={PLUS} className="h-4 w-4" />
          Nuevo movimiento
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Secciones"
        className="mb-6 grid grid-cols-4 rounded-xl bg-surface p-1 shadow-card ring-1 ring-line sm:inline-flex"
      >
        {(
          [
            ['movements', 'Movimientos'],
            ['recurring', 'Programados'],
            ['templates', 'Plantillas'],
            ['categories', 'Categorías'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`whitespace-nowrap rounded-lg px-1 py-2 text-xs font-medium transition-all sm:px-4 sm:text-sm ${
              tab === value ? 'bg-brand-700 text-white shadow-card' : 'text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'recurring' ? (
        <RecurringManager categories={categories} onGenerated={transactionsQuery.reload} />
      ) : tab === 'templates' ? (
        <TemplateManager
          templates={templates}
          categories={categories}
          loading={templatesQuery.loading}
          error={templatesQuery.error}
          onChanged={templatesQuery.reload}
          onUse={applyTemplate}
        />
      ) : tab === 'categories' ? (
        <>
          {categoriesQuery.error && <Alert tone="error">{categoriesQuery.error}</Alert>}
          <CategoryManager categories={categories} onChanged={categoriesQuery.reload} />
        </>
      ) : (
        <>
          {templates.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                <Icon path={STAR} className="h-3.5 w-3.5" />
                Favoritos
              </p>
              <div className="flex flex-wrap gap-2">
                {templates.slice(0, 8).map((t) => {
                  const category = t.category_id ? categoryById.get(t.category_id) : undefined
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-1.5 pr-3.5 text-sm font-medium text-ink shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50 hover:shadow-lift"
                    >
                      <CategoryBadge
                        icon={category?.icon}
                        color={category?.color}
                        className="h-7 w-7 rounded-full"
                        iconClassName="h-3.5 w-3.5"
                      />
                      {t.name}
                      <span className="text-xs text-muted">{money(t.amount)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <Card delay={60}>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <div className="col-span-2 sm:col-span-1">
                <Select
                  label="Período"
                  value={filters.period}
                  onChange={(value) => setFilter('period', value as PeriodMode)}
                  options={PERIOD_OPTIONS}
                />
              </div>
              {filters.period === 'month' && (
                <div className="col-span-2 sm:col-span-1">
                  <TextField
                    label="Mes"
                    type="month"
                    name="month"
                    value={filters.month}
                    onChange={(value) => value && setFilter('month', value)}
                  />
                </div>
              )}
              {filters.period === 'range' && (
                <>
                  <TextField
                    label="Desde"
                    type="date"
                    name="from"
                    value={filters.from}
                    onChange={(value) => setFilter('from', value)}
                  />
                  <TextField
                    label="Hasta"
                    type="date"
                    name="to"
                    value={filters.to}
                    onChange={(value) => setFilter('to', value)}
                  />
                </>
              )}
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
              <div className="col-span-2">
                <TextField
                  label="Buscar por nombre o descripción"
                  name="search"
                  placeholder="Ej: farmacia, uber, arriendo…"
                  maxLength={60}
                  value={draft.query}
                  onChange={(value) => setDraft((d) => ({ ...d, query: value }))}
                />
              </div>
              <MoneyField
                label="Monto mínimo"
                name="min"
                value={draft.minAmount}
                onChange={(value) => setDraft((d) => ({ ...d, minAmount: value }))}
              />
              <MoneyField
                label="Monto máximo"
                name="max"
                value={draft.maxAmount}
                onChange={(value) => setDraft((d) => ({ ...d, maxAmount: value }))}
              />
            </div>
            {filtersActive && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-semibold text-link hover:text-link-hover"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </Card>

          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <StatCard
              label="Ingresos"
              value={money(totals.income)}
              hint="De los movimientos filtrados"
              icon="M12 19V5M5 12l7-7 7 7"
              delay={120}
            />
            <StatCard
              label="Gastos"
              value={money(totals.expense)}
              hint="De los movimientos filtrados"
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

          {notice && (
            <div className="mt-5">
              <Alert tone="success">{notice}</Alert>
            </div>
          )}
          {actionError && (
            <div className="mt-5">
              <Alert tone="error">{actionError}</Alert>
            </div>
          )}

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
                title={filtersActive ? 'Sin resultados' : 'Sin movimientos en este período'}
                description={
                  filtersActive
                    ? 'Prueba con otros filtros o límpialos para ver todos tus movimientos.'
                    : 'Agrega tu primer ingreso o gasto con el botón “Nuevo movimiento”.'
                }
              />
            ) : (
              <>
                <p className="mb-2 text-xs text-muted">
                  {transactions.length} movimiento{transactions.length === 1 ? '' : 's'}
                  {truncated && ` (se muestran los primeros ${SEARCH_LIMIT}; acota los filtros para ver el resto)`}
                </p>
                <ul className="divide-y divide-line">
                  {shown.map((t) => {
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
                            {formatDate(t.occurred_on)} · {category?.name ?? 'Sin categoría'}
                            {t.recurring_id ? ' · Programado' : ''}
                          </p>
                          {t.name && t.description && (
                            <p className="truncate text-xs text-muted/80">{t.description}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end sm:flex-row sm:items-center">
                        <p
                          className={`text-sm font-semibold sm:mr-1 ${
                            isIncome ? 'text-link' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {isIncome ? '+' : '−'}
                          {money(t.amount)}
                        </p>
                        <div className="-mr-1.5 flex sm:mr-0">
                        <button
                          type="button"
                          onClick={() => void saveAsTemplate(t)}
                          aria-label="Guardar como plantilla"
                          title="Guardar como plantilla"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-amber-500/10 hover:text-amber-600"
                        >
                          <Icon path={STAR} className="h-4 w-4" />
                        </button>
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
                        </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
                {visible < transactions.length && (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleState({ data: transactionsQuery.data, count: visible + PAGE_SIZE })}
                      className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-brand-50"
                    >
                      Mostrar más ({transactions.length - visible} restantes)
                    </button>
                  </div>
                )}
              </>
            )}
          </Card>
        </>
      )}

      {formState.open && (
        <Modal
          title={formState.editing ? 'Editar movimiento' : 'Nuevo movimiento'}
          onClose={() => setFormState({ open: false })}
        >
          <TransactionForm
            categories={categories}
            initial={formState.editing}
            seed={formState.seed}
            onSubmit={handleSave}
          />
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
