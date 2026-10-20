import { useEffect, useMemo, useState } from 'react'
import { CategoryManager } from '@/components/features/CategoryManager'
import { RecurringManager } from '@/components/features/RecurringManager'
import { TemplateManager } from '@/components/features/TemplateManager'
import { TransactionForm, type TransactionSeed } from '@/components/features/TransactionForm'
import { Eyebrow, FxButton, FxCard, GroupLabel, IconButton, List, ListRow, Segmented, StatCard } from '@/components/fx'
import { Alert } from '@/components/ui/Alert'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { MoneyField } from '@/components/ui/MoneyField'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select, type SelectOption } from '@/components/ui/Select'
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

const TYPE_OPTIONS: { value: TransactionFilters['type']; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'income', label: 'Ingresos' },
  { value: 'expense', label: 'Gastos' },
]

const TABS: { value: Tab; label: string }[] = [
  { value: 'movements', label: 'Movimientos' },
  { value: 'recurring', label: 'Programados' },
  { value: 'templates', label: 'Plantillas' },
  { value: 'categories', label: 'Categorías' },
]

/** Agrupa movimientos consecutivos por fecha (vienen ordenados de más nuevo a más antiguo). */
function groupByDay(items: readonly Transaction[]): [string, Transaction[]][] {
  const groups: [string, Transaction[]][] = []
  for (const t of items) {
    const last = groups[groups.length - 1]
    if (last && last[0] === t.occurred_on) last[1].push(t)
    else groups.push([t.occurred_on, [t]])
  }
  return groups
}

const PERIOD_OPTIONS: { value: PeriodMode; label: string }[] = [
  { value: 'month', label: 'Mes' },
  { value: 'range', label: 'Rango' },
  { value: 'all', label: 'Todo' },
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
    { value: 'all', label: 'Todas', icon: iconPath('star') },
    { value: 'none', label: 'Sin categoría', icon: iconPath('tag') },
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
      <div className="flex flex-wrap items-end justify-between gap-x-4">
        <PageHeader eyebrow="Ingresos y gastos" title="Movimientos" description="Registra y gestiona tus ingresos y gastos." />
        <FxButton icon={PLUS} onClick={() => setFormState({ open: true })} className="mb-5 w-full sm:mb-7 sm:w-auto">
          Nuevo movimiento
        </FxButton>
      </div>

      <Segmented label="Secciones" options={TABS} value={tab} onChange={setTab} variant="plain" className="mb-5 sm:!inline-flex" />

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
            <div className="mb-4">
              <Eyebrow as="p" className="mb-2.5 flex items-center gap-1.5">
                <Icon path={STAR} className="h-3.5 w-3.5" />
                Favoritos
              </Eyebrow>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
                {templates.slice(0, 8).map((t) => {
                  const category = t.category_id ? categoryById.get(t.category_id) : undefined
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-surface py-1 pl-1 pr-4 text-sm font-medium text-ink shadow-card transition-transform active:scale-[0.97]"
                    >
                      <CategoryBadge
                        icon={category?.icon}
                        color={category?.color}
                        className="h-9 w-9 rounded-full !bg-soft !shadow-none"
                        iconClassName="h-4 w-4"
                      />
                      {t.name}
                      <span className="fx-num text-xs text-muted">{money(t.amount)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <FxCard className="fx-enter">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Segmented
                label="Período"
                role="radio"
                variant="plain"
                inline
                options={PERIOD_OPTIONS}
                value={filters.period}
                onChange={(value) => setFilter('period', value)}
              />
              <Segmented
                label="Tipo"
                role="radio"
                variant="plain"
                inline
                options={TYPE_OPTIONS}
                value={filters.type}
                onChange={(value) => setFilter('type', value)}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
              <div className="col-span-2 sm:col-span-1">
                <Select
                  label="Categoría"
                  value={filters.categoryId}
                  onChange={(value) => setFilter('categoryId', value)}
                  options={categoryOptions}
                />
              </div>
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
              <FxButton variant="link" className="mt-4" onClick={clearFilters}>
                Limpiar filtros
              </FxButton>
            )}
          </FxCard>

          <div className="fx-card fx-enter mt-4">
            <div className="fx-grid-stats" data-cols="3">
              <StatCard
                label="Ingresos"
                value={money(totals.income)}
                sub="De los movimientos filtrados"
                icon="M12 19V5M5 12l7-7 7 7"
                tone="positive"
              />
              <StatCard label="Gastos" value={money(totals.expense)} sub="De los movimientos filtrados" icon="M12 5v14M5 12l7 7 7-7" />
              <StatCard
                label="Balance"
                value={money(totals.balance)}
                sub="Ingresos menos gastos"
                icon="M3 7h18v12H3zM3 7l3-3h12l3 3M16 13h2"
              />
            </div>
          </div>

          {notice && (
            <div className="mt-4">
              <Alert tone="success">{notice}</Alert>
            </div>
          )}
          {actionError && (
            <div className="mt-4">
              <Alert tone="error">{actionError}</Alert>
            </div>
          )}

          <FxCard className="fx-enter mt-4">
            {transactionsQuery.error ? (
              <div className="space-y-3">
                <Alert tone="error">{transactionsQuery.error}</Alert>
                <FxButton variant="soft" size="sm" onClick={transactionsQuery.reload}>
                  Reintentar
                </FxButton>
              </div>
            ) : transactionsQuery.loading && !transactionsQuery.data ? (
              <div className="flex justify-center py-12">
                <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-mute border-t-ink" />
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
                <Eyebrow as="p">
                  {transactions.length} movimiento{transactions.length === 1 ? '' : 's'}
                  {truncated && ` · se muestran los primeros ${SEARCH_LIMIT}; acota los filtros`}
                </Eyebrow>
                {groupByDay(shown).map(([day, items]) => (
                  <div key={day}>
                    <GroupLabel>{formatDate(day)}</GroupLabel>
                    <List variant="flat">
                      {items.map((t) => {
                        const category = t.category_id ? categoryById.get(t.category_id) : undefined
                        return (
                          <ListRow
                            key={t.id}
                            media={
                              <CategoryBadge
                                icon={category?.icon}
                                color={category?.color}
                                className="h-full w-full !shadow-none"
                                iconClassName="h-[18px] w-[18px]"
                              />
                            }
                            title={t.name || t.description || category?.name || 'Sin categoría'}
                            sub={`${category?.name ?? 'Sin categoría'}${t.recurring_id ? ' · Programado' : ''}`}
                            extra={t.name && t.description ? t.description : undefined}
                            amount={money(t.amount)}
                            sign={t.type === 'income' ? '+' : '-'}
                            side={
                              <span className="-mr-2 mt-0.5 flex justify-end">
                                <IconButton
                                  icon={STAR}
                                  label="Guardar como plantilla"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => void saveAsTemplate(t)}
                                />
                                <IconButton
                                  icon={EDIT}
                                  label="Editar movimiento"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setFormState({ open: true, editing: t })}
                                />
                                <IconButton
                                  icon={TRASH}
                                  label="Eliminar movimiento"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setToDelete(t)}
                                />
                              </span>
                            }
                          />
                        )
                      })}
                    </List>
                  </div>
                ))}
                {visible < transactions.length && (
                  <div className="mt-5 flex justify-center">
                    <FxButton
                      variant="soft"
                      onClick={() => setVisibleState({ data: transactionsQuery.data, count: visible + PAGE_SIZE })}
                    >
                      Mostrar más ({transactions.length - visible} restantes)
                    </FxButton>
                  </div>
                )}
              </>
            )}
          </FxCard>
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
