import { useMoney } from '@/hooks/useMoney'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Balance, buttonClass, Chip, Eyebrow, FxButton, FxCard, List, ListRow, PairBars, Progress, StatCard } from '@/components/fx'
import { Alert } from '@/components/ui/Alert'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { Icon } from '@/components/ui/Icon'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useCoverProgress } from '@/hooks/useCoverProgress'
import { useAuth } from '@/lib/auth-context'
import { summarize } from '@/lib/dashboard'
import { computeInsights } from '@/lib/insights'
import { budgetStatus, STATUS_STYLES, sumExpenses } from '@/lib/budgets'
import {
  DEFAULT_ALERT_THRESHOLD,
  getAlertThreshold,
  listAllTransactions,
  listBudgets,
  listCategories,
} from '@/lib/data'
import { currentMonth, formatDate } from '@/lib/format'
import type { Category } from '@/types/db'

const NO_CATEGORIES: readonly Category[] = []

const percent = new Intl.NumberFormat('es-CL', { style: 'percent', maximumFractionDigits: 0 })

function describeChange(change: number | null): string {
  if (change === null) return 'Sin mes anterior para comparar'
  if (Math.abs(change) < 0.005) return 'Igual que el mes anterior'
  const arrow = change > 0 ? '↑' : '↓'
  return `${arrow} ${percent.format(Math.abs(change))} vs mes anterior`
}

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-mute border-t-ink" />
    </div>
  )
}

const SWAP = 'M7 7h13M7 7l3-3M7 7l3 3M17 17H4M17 17l-3-3M17 17l-3 3'
const SPARK = 'M10 3l1.9 5.6L17.5 10.5l-5.6 1.9L10 18l-1.9-5.6L2.5 10.5l5.6-1.9z'
const TONE = { ok: 'ink', warning: 'warning', exceeded: 'danger' } as const

export function DashboardPage() {
  const { money, hidden } = useMoney()
  const { displayName } = useAuth()
  const transactionsQuery = useAsyncData(listAllTransactions, [])
  const categoriesQuery = useAsyncData(listCategories, [])

  const summary = useMemo(
    () => (transactionsQuery.data ? summarize(transactionsQuery.data) : null),
    [transactionsQuery.data],
  )
  const categories = categoriesQuery.data ?? NO_CATEGORIES
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const [month] = useState(() => currentMonth())
  const budgetsQuery = useAsyncData(() => listBudgets(month), [month])
  const thresholdQuery = useAsyncData(getAlertThreshold, [])
  const threshold = thresholdQuery.data ?? DEFAULT_ALERT_THRESHOLD

  const budgetProgress = useMemo(() => {
    const budgets = budgetsQuery.data
    if (!budgets || !transactionsQuery.data) return []
    const monthExpenses = transactionsQuery.data.filter(
      (t) => t.type === 'expense' && t.occurred_on.startsWith(month),
    )
    const spent = sumExpenses(monthExpenses)
    return budgets
      .map((b) => {
        const used = b.category_id ? (spent.byCategory.get(b.category_id) ?? 0) : spent.total
        const ratio = b.amount > 0 ? used / b.amount : 0
        return { budget: b, used, ratio, status: budgetStatus(used, b.amount, threshold) }
      })
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 4)
  }, [budgetsQuery.data, transactionsQuery.data, month, threshold])

  const insights = useMemo(
    () =>
      transactionsQuery.data
        ? computeInsights(
            transactionsQuery.data,
            month,
            (id) => (id ? (categoryById.get(id)?.name ?? 'Categoría') : 'Sin categoría'),
            money,
          )
        : [],
    [transactionsQuery.data, month, categoryById, money],
  )

  const [monthName] = useState(() =>
    new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }),
  )
  const loading = transactionsQuery.loading && !summary

  const firstName = displayName.split(' ')[0] ?? displayName
  const heroRef = useRef<HTMLElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  useCoverProgress(heroRef, sheetRef)

  return (
    <>
      {/* Al hacer scroll, la tarjeta del saldo sube y se superpone a la bienvenida. */}
      <div className="fx-cover">
      <section ref={heroRef} className="fx-hero fx-enter">
        <div className="fx-hero__content">
        <Eyebrow className="first-letter:uppercase">{monthName}</Eyebrow>
        <h1 className="fx-h1 mt-3 max-w-2xl !text-[var(--hero-ink)]">
          Hola, {firstName}. <span className="text-[var(--hero-ink-2)]">Así van tus finanzas.</span>
        </h1>
        <p className="fx-hero__lead mt-3 max-w-lg">
          {summary
            ? summary.hasData
              ? `Este mes llevas ${money(summary.monthIncome)} en ingresos y ${money(summary.monthExpense)} en gastos.`
              : 'Aún no tienes movimientos. Registra el primero para ver tu resumen aquí.'
            : 'Cargando tu resumen financiero…'}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link to="/movimientos" className={buttonClass({ variant: 'accent' })}>
            <Icon path={SWAP} className="h-[18px] w-[18px]" />
            Movimientos
          </Link>
          <Link to="/asistente" className={buttonClass({ variant: 'glass' })}>
            <Icon path={SPARK} className="h-[18px] w-[18px]" />
            Preguntar a Cashly AI
          </Link>
        </div>
        </div>
      </section>

      <div ref={sheetRef} className="fx-sheet fx-enter" style={{ animationDelay: '80ms' }}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="fx-balance-label">Saldo total · histórico</p>
            <Balance amount={summary?.balance ?? 0} hidden={hidden} className="mt-2" />
          </div>
          {summary && summary.savingsRate !== null && (
            <Chip variant="accent">Tasa de ahorro {percent.format(summary.savingsRate)}</Chip>
          )}
        </div>
        <div className="fx-grid-stats mt-6" data-cols="3">
          <StatCard
            label="Ingresos del mes"
            value={summary ? money(summary.monthIncome) : '—'}
            sub={summary ? describeChange(summary.incomeChange) : 'Cargando…'}
            icon="M12 19V5M5 12l7-7 7 7"
            tone="positive"
          />
          <StatCard
            label="Gastos del mes"
            value={summary ? money(summary.monthExpense) : '—'}
            sub={summary ? describeChange(summary.expenseChange) : 'Cargando…'}
            icon="M12 5v14M5 12l7 7 7-7"
          />
          <StatCard
            label="Ahorro del mes"
            value={summary ? money(summary.monthSavings) : '—'}
            sub={
              summary ? (summary.savingsRate === null ? 'Sin ingresos este mes' : 'Ingresos menos gastos') : 'Cargando…'
            }
            icon="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"
          />
        </div>
      </div>

      </div>

      {transactionsQuery.error && (
        <div className="mt-5 space-y-3">
          <Alert tone="error">{transactionsQuery.error}</Alert>
          <FxButton variant="soft" size="sm" onClick={transactionsQuery.reload}>
            Reintentar
          </FxButton>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <FxCard className="fx-enter lg:col-span-3" title="Evolución financiera" sub="Últimos 6 meses">
          {loading ? (
            <Spinner />
          ) : summary && summary.hasData ? (
            <PairBars data={summary.series} format={money} label="Ingresos y gastos de los últimos 6 meses" />
          ) : (
            <p className="rounded-[var(--r-md)] bg-soft px-4 py-12 text-center text-sm text-muted">
              El gráfico aparecerá cuando registres movimientos.
            </p>
          )}
        </FxCard>

        <FxCard
          className="fx-enter lg:col-span-2"
          title="Últimos movimientos"
          sub="Recientes"
          action={
            <Link to="/movimientos" className={buttonClass({ variant: 'soft', size: 'sm', mono: true })}>
              Ver todos
            </Link>
          }
        >
          {loading ? (
            <Spinner />
          ) : !summary || summary.recent.length === 0 ? (
            <div className="flex flex-col items-center rounded-[var(--r-md)] bg-soft px-4 py-10 text-center">
              <p className="text-sm font-medium text-ink">Aún no hay movimientos</p>
              <Link to="/movimientos" className={`${buttonClass({ variant: 'link' })} mt-1`}>
                Agregar el primero
              </Link>
            </div>
          ) : (
            <List variant="flat">
              {summary.recent.map((t) => {
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
                    sub={`${formatDate(t.occurred_on)} · ${category?.name ?? 'Sin categoría'}`}
                    amount={money(t.amount)}
                    sign={t.type === 'income' ? '+' : '-'}
                  />
                )
              })}
            </List>
          )}
        </FxCard>
      </div>

      {(budgetProgress.length > 0 || (summary && summary.topCategories.length > 0)) && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {budgetProgress.length > 0 && (
            <FxCard
              className="fx-enter"
              title="Presupuestos del mes"
              sub="Los más cerca de su límite"
              action={
                <Link to="/presupuestos" className={buttonClass({ variant: 'soft', size: 'sm', mono: true })}>
                  Ver todos
                </Link>
              }
            >
              <ul className="space-y-4">
                {budgetProgress.map(({ budget, used, ratio, status }) => {
                  const category = budget.category_id ? categoryById.get(budget.category_id) : undefined
                  const name = budget.category_id ? (category?.name ?? 'Categoría') : 'Presupuesto total'
                  return (
                    <li key={budget.id}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2.5 font-medium text-ink">
                          <CategoryBadge
                            icon={budget.category_id ? category?.icon : 'wallet'}
                            color={budget.category_id ? category?.color : undefined}
                            className="h-8 w-8 rounded-full"
                            iconClassName="h-4 w-4"
                          />
                          <span className="truncate">{name}</span>
                        </span>
                        <span className={`fx-num shrink-0 text-xs font-semibold ${STATUS_STYLES[status].text}`}>
                          {money(used)} <span className="font-normal text-muted">/ {money(budget.amount)}</span>
                        </span>
                      </div>
                      <Progress value={ratio} tone={TONE[status]} label={`Avance de ${name}`} />
                    </li>
                  )
                })}
              </ul>
            </FxCard>
          )}

          {summary && summary.topCategories.length > 0 && (
            <FxCard className="fx-enter" title="En qué gastas" sub="Principales categorías del mes">
              <List>
                {summary.topCategories.map((item) => {
                  const category = item.categoryId ? categoryById.get(item.categoryId) : undefined
                  const name = category?.name ?? 'Sin categoría'
                  return (
                    <ListRow
                      key={item.categoryId ?? 'none'}
                      media={
                        <CategoryBadge
                          icon={category?.icon}
                          color={category?.color}
                          className="h-full w-full !shadow-none"
                          iconClassName="h-[18px] w-[18px]"
                        />
                      }
                      title={name}
                      extra={
                        <span className="mt-1.5 block">
                          <Progress value={item.share} label={`Participación de ${name}`} />
                        </span>
                      }
                      amount={money(item.amount)}
                      side={percent.format(item.share)}
                    />
                  )
                })}
              </List>
            </FxCard>
          )}
        </div>
      )}

      {insights.length > 0 && (
        <FxCard className="fx-enter mt-4" title="Alertas y hábitos" sub="Detectado en tus movimientos">
          <ul className="grid gap-2.5 md:grid-cols-2">
            {insights.map((insight) => (
              <li key={insight.id} className="fx-stat !gap-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">{insight.title}</p>
                  {insight.severity === 'warning' && (
                    <Chip variant="warning" size="sm">
                      Atención
                    </Chip>
                  )}
                </div>
                <p className="text-[13px] text-muted">{insight.detail}</p>
              </li>
            ))}
          </ul>
        </FxCard>
      )}
    </>
  )
}
