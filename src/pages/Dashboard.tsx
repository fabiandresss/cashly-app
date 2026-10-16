import { lazy, Suspense, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { Icon } from '@/components/ui/Icon'
import { StatCard } from '@/components/ui/StatCard'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useAuth } from '@/lib/auth-context'
import { summarize } from '@/lib/dashboard'
import { listAllTransactions, listCategories } from '@/lib/data'
import { formatDate, formatMoney } from '@/lib/format'
import type { Category } from '@/types/db'

const EvolutionChart = lazy(() =>
  import('@/components/features/EvolutionChart').then((m) => ({ default: m.EvolutionChart })),
)

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
      <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-500" />
    </div>
  )
}

export function DashboardPage() {
  const { displayName } = useAuth()
  const transactionsQuery = useAsyncData(listAllTransactions, [])
  const categoriesQuery = useAsyncData(listCategories, [])

  const summary = useMemo(
    () => (transactionsQuery.data ? summarize(transactionsQuery.data) : null),
    [transactionsQuery.data],
  )
  const categories = categoriesQuery.data ?? NO_CATEGORIES
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const [monthName] = useState(() =>
    new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }),
  )
  const loading = transactionsQuery.loading && !summary

  return (
    <>
      <section className="relative mb-8 animate-fade-up overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-7 text-white shadow-lift md:p-10">
        <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-brand-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-32 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl" />
        <p className="relative text-sm font-medium capitalize text-white/80">{monthName}</p>
        <h1 className="relative mt-2 max-w-xl text-3xl font-bold tracking-tight md:text-4xl">
          Hola, {displayName}
        </h1>
        <p className="relative mt-3 max-w-lg text-sm text-white/90">
          {summary
            ? summary.hasData
              ? `Este mes llevas ${formatMoney(summary.monthIncome)} en ingresos y ${formatMoney(summary.monthExpense)} en gastos.`
              : 'Aún no tienes movimientos. Registra el primero para ver tu resumen aquí.'
            : 'Cargando tu resumen financiero…'}
        </p>
      </section>

      {transactionsQuery.error && (
        <div className="mb-5 space-y-3">
          <Alert tone="error">{transactionsQuery.error}</Alert>
          <button
            type="button"
            onClick={transactionsQuery.reload}
            className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-brand-50"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Saldo total"
          value={summary ? formatMoney(summary.balance) : '—'}
          hint="Ingresos menos gastos, histórico"
          icon="M3 7h18v12H3zM3 7l3-3h12l3 3M16 13h2"
          delay={100}
        />
        <StatCard
          label="Ingresos del mes"
          value={summary ? formatMoney(summary.monthIncome) : '—'}
          hint={summary ? describeChange(summary.incomeChange) : 'Cargando…'}
          icon="M12 19V5M5 12l7-7 7 7"
          delay={190}
        />
        <StatCard
          label="Gastos del mes"
          value={summary ? formatMoney(summary.monthExpense) : '—'}
          hint={summary ? describeChange(summary.expenseChange) : 'Cargando…'}
          icon="M12 5v14M5 12l7 7 7-7"
          delay={280}
        />
        <StatCard
          label="Ahorro del mes"
          value={summary ? formatMoney(summary.monthSavings) : '—'}
          hint={
            summary
              ? summary.savingsRate === null
                ? 'Sin ingresos este mes'
                : `Tasa de ahorro: ${percent.format(summary.savingsRate)}`
              : 'Cargando…'
          }
          icon="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"
          delay={370}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2" delay={460}>
          <h2 className="text-base font-semibold text-heading">Evolución financiera</h2>
          <p className="mb-4 text-xs text-muted">Ingresos y gastos de los últimos 6 meses</p>
          {loading ? (
            <Spinner />
          ) : summary && summary.hasData ? (
            <Suspense fallback={<Spinner />}>
              <EvolutionChart data={summary.series} />
            </Suspense>
          ) : (
            <p className="rounded-xl border border-dashed border-brand-200 bg-brand-50/50 px-4 py-12 text-center text-sm text-muted">
              El gráfico aparecerá cuando registres movimientos.
            </p>
          )}
        </Card>

        <Card delay={550}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-heading">Últimos movimientos</h2>
            <Link to="/movimientos" className="text-xs font-semibold text-link hover:text-link-hover">
              Ver todos
            </Link>
          </div>
          {loading ? (
            <Spinner />
          ) : !summary || summary.recent.length === 0 ? (
            <div className="mt-5 flex flex-col items-center rounded-xl border border-dashed border-brand-200 bg-brand-50/50 px-4 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-link">
                <Icon path="M12 5v14M5 12h14" />
              </span>
              <p className="mt-3 text-sm font-medium text-heading">Aún no hay movimientos</p>
              <Link to="/movimientos" className="mt-1 text-xs font-semibold text-link hover:text-link-hover">
                Agregar el primero
              </Link>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {summary.recent.map((t) => {
                const category = t.category_id ? categoryById.get(t.category_id) : undefined
                const isIncome = t.type === 'income'
                return (
                  <li key={t.id} className="flex items-center gap-3 py-2.5">
                    <CategoryBadge
                      icon={category?.icon}
                      color={category?.color}
                      className="h-9 w-9"
                      iconClassName="h-[18px] w-[18px]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {t.description || category?.name || 'Sin categoría'}
                      </p>
                      <p className="text-xs text-muted">{formatDate(t.occurred_on)}</p>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-semibold ${
                        isIncome ? 'text-link' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {isIncome ? '+' : '−'}
                      {formatMoney(t.amount)}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      {summary && summary.topCategories.length > 0 && (
        <Card className="mt-5" delay={640}>
          <h2 className="text-base font-semibold text-heading">En qué gastas este mes</h2>
          <p className="mb-4 text-xs text-muted">Principales categorías de gasto</p>
          <ul className="space-y-4">
            {summary.topCategories.map((item) => {
              const category = item.categoryId ? categoryById.get(item.categoryId) : undefined
              const color = category?.color ?? '#64748b'
              return (
                <li key={item.categoryId ?? 'none'}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-medium text-ink">
                      <CategoryBadge
                        icon={category?.icon}
                        color={color}
                        className="h-6 w-6 rounded-lg"
                        iconClassName="h-3.5 w-3.5"
                      />
                      <span className="truncate">{category?.name ?? 'Sin categoría'}</span>
                    </span>
                    <span className="shrink-0 text-muted">
                      {formatMoney(item.amount)} · {percent.format(item.share)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-canvas">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(item.share * 100, 2)}%`, backgroundColor: color }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </>
  )
}
