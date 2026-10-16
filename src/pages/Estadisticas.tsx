import { lazy, Suspense, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { useAsyncData } from '@/hooks/useAsyncData'
import { listAllTransactions, listCategories } from '@/lib/data'
import { formatDate, formatMoney } from '@/lib/format'
import { computeStats, OTHERS_ID, PERIODS, periodMonths, type PeriodKey, type Slice } from '@/lib/stats'
import type { Category } from '@/types/db'

const EvolutionChart = lazy(() =>
  import('@/components/features/EvolutionChart').then((m) => ({ default: m.EvolutionChart })),
)
const DonutChart = lazy(() => import('@/components/features/StatsCharts').then((m) => ({ default: m.DonutChart })))
const BalanceChart = lazy(() => import('@/components/features/StatsCharts').then((m) => ({ default: m.BalanceChart })))
const WeekdayChart = lazy(() => import('@/components/features/StatsCharts').then((m) => ({ default: m.WeekdayChart })))

const NO_CATEGORIES: readonly Category[] = []
const percent = new Intl.NumberFormat('es-CL', { style: 'percent', maximumFractionDigits: 0 })

function Spinner() {
  return (
    <div className="flex h-56 items-center justify-center">
      <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-500" />
    </div>
  )
}

export function EstadisticasPage() {
  const [period, setPeriod] = useState<PeriodKey>('6m')
  const [sliceType, setSliceType] = useState<'expense' | 'income'>('expense')

  const transactionsQuery = useAsyncData(listAllTransactions, [])
  const categoriesQuery = useAsyncData(listCategories, [])
  const categories = categoriesQuery.data ?? NO_CATEGORIES
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const stats = useMemo(
    () => (transactionsQuery.data ? computeStats(transactionsQuery.data, periodMonths(period)) : null),
    [transactionsQuery.data, period],
  )

  function sliceMeta(slice: Slice): { name: string; color: string; icon?: string | undefined } {
    if (slice.categoryId === OTHERS_ID) return { name: 'Otras categorías', color: '#94a3b8' }
    if (slice.categoryId === null) return { name: 'Sin categoría', color: '#64748b' }
    const c = categoryById.get(slice.categoryId)
    return { name: c?.name ?? 'Categoría', color: c?.color ?? '#64748b', icon: c?.icon }
  }

  const slices = stats ? (sliceType === 'expense' ? stats.expenseSlices : stats.incomeSlices) : []
  const sliceTotal = stats ? (sliceType === 'expense' ? stats.expense : stats.income) : 0
  const donutData = slices.map((s) => {
    const meta = sliceMeta(s)
    return { name: meta.name, value: s.amount, color: meta.color }
  })

  const topExpense = stats?.expenseSlices[0]
  const topMeta = topExpense && topExpense.categoryId !== OTHERS_ID ? sliceMeta(topExpense) : null
  const biggest = stats?.biggestExpense
  const biggestCategory = biggest?.category_id ? categoryById.get(biggest.category_id) : undefined

  const loading = transactionsQuery.loading && !stats
  const empty = stats !== null && !stats.hasData

  return (
    <>
      <PageHeader title="Estadísticas" description="Analiza tus hábitos financieros." />

      <div role="tablist" aria-label="Período" className="mb-6 inline-flex flex-wrap rounded-xl bg-surface p-1 shadow-card ring-1 ring-line">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            role="tab"
            aria-selected={period === p.key}
            onClick={() => setPeriod(p.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              period === p.key ? 'bg-brand-700 text-white shadow-card' : 'text-muted hover:text-ink'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

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

      {loading ? (
        <Spinner />
      ) : empty ? (
        <Card delay={80}>
          <EmptyState
            icon="M4 20V10M10 20V4M16 20v-8M22 20H2"
            title="Sin datos en este período"
            description="Registra movimientos o elige un período más amplio para ver tus estadísticas."
          />
          <div className="pb-6 text-center">
            <Link to="/movimientos" className="text-sm font-semibold text-link hover:text-link-hover">
              Ir a movimientos
            </Link>
          </div>
        </Card>
      ) : stats ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Gasto promedio mensual"
              value={formatMoney(stats.avgMonthlyExpense)}
              hint={`En ${stats.months.length} mes${stats.months.length === 1 ? '' : 'es'}`}
              icon="M12 5v14M5 12l7 7 7-7"
              delay={60}
            />
            <StatCard
              label="Tasa de ahorro"
              value={stats.savingsRate === null ? '—' : percent.format(stats.savingsRate)}
              hint={stats.savingsRate === null ? 'Sin ingresos en el período' : 'Del total de ingresos'}
              icon="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"
              delay={130}
            />
            <StatCard
              label="Mayor gasto"
              value={biggest ? formatMoney(biggest.amount) : '—'}
              hint={
                biggest
                  ? `${biggest.description || biggestCategory?.name || 'Sin categoría'} · ${formatDate(biggest.occurred_on)}`
                  : 'Sin gastos en el período'
              }
              icon="M3 17l6-6 4 4 8-8M15 7h6v6"
              delay={200}
            />
            <StatCard
              label="Categoría principal"
              value={topMeta ? topMeta.name : '—'}
              hint={topExpense && topMeta ? `${formatMoney(topExpense.amount)} · ${percent.format(topExpense.share)} del gasto` : 'Sin gastos en el período'}
              icon="M12 3a9 9 0 109 9h-9V3z"
              delay={270}
            />
          </div>

          <Card className="mt-5" delay={340}>
            <h2 className="text-base font-semibold text-heading">Ingresos vs gastos</h2>
            <p className="mb-4 text-xs text-muted">Comparación mes a mes</p>
            <Suspense fallback={<Spinner />}>
              <EvolutionChart data={stats.series} />
            </Suspense>
          </Card>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Card delay={410}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-heading">Distribución por categoría</h2>
                  <p className="text-xs text-muted">Cómo se reparte el período</p>
                </div>
                <div role="radiogroup" aria-label="Tipo" className="inline-flex rounded-lg bg-canvas p-1">
                  {(
                    [
                      ['expense', 'Gastos'],
                      ['income', 'Ingresos'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={sliceType === value}
                      onClick={() => setSliceType(value)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                        sliceType === value ? 'bg-surface text-heading shadow-card' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {slices.length === 0 ? (
                <p className="rounded-xl border border-dashed border-brand-200 bg-brand-50/50 px-4 py-12 text-center text-sm text-muted">
                  No hay {sliceType === 'expense' ? 'gastos' : 'ingresos'} en este período.
                </p>
              ) : (
                <>
                  <Suspense fallback={<Spinner />}>
                    <DonutChart
                      data={donutData}
                      centerLabel={sliceType === 'expense' ? 'Gastos' : 'Ingresos'}
                      centerValue={formatMoney(sliceTotal)}
                    />
                  </Suspense>
                  <ul className="mt-4 space-y-2">
                    {slices.map((slice) => {
                      const meta = sliceMeta(slice)
                      return (
                        <li key={slice.categoryId ?? 'none'} className="flex items-center gap-2.5 text-sm">
                          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
                          <span className="min-w-0 flex-1 truncate text-ink">{meta.name}</span>
                          <span className="shrink-0 text-muted">{formatMoney(slice.amount)}</span>
                          <span className="w-10 shrink-0 text-right font-medium text-heading">
                            {percent.format(slice.share)}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </>
              )}
            </Card>

            <Card delay={480}>
              <h2 className="text-base font-semibold text-heading">Balance acumulado</h2>
              <p className="mb-4 text-xs text-muted">Evolución de tu saldo en el período</p>
              <Suspense fallback={<Spinner />}>
                <BalanceChart data={stats.series} />
              </Suspense>
            </Card>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Card delay={550}>
              <h2 className="text-base font-semibold text-heading">Gasto por día de la semana</h2>
              <p className="mb-4 text-xs text-muted">En qué días gastas más</p>
              <Suspense fallback={<Spinner />}>
                <WeekdayChart data={stats.weekday} />
              </Suspense>
            </Card>

            <Card delay={620}>
              <h2 className="text-base font-semibold text-heading">Ranking de gastos</h2>
              <p className="mb-4 text-xs text-muted">Categorías y variación vs período anterior</p>
              {stats.ranking.length === 0 ? (
                <p className="text-sm text-muted">No hay gastos en este período.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {stats.ranking.map((item) => {
                    const category = item.categoryId ? categoryById.get(item.categoryId) : undefined
                    const up = item.change !== null && item.change > 0.005
                    const down = item.change !== null && item.change < -0.005
                    return (
                      <li key={item.categoryId ?? 'none'} className="flex items-center gap-3 py-2.5">
                        <CategoryBadge
                          icon={category?.icon}
                          color={category?.color}
                          className="h-9 w-9"
                          iconClassName="h-[18px] w-[18px]"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{category?.name ?? 'Sin categoría'}</p>
                          <p className="text-xs text-muted">
                            {item.change === null
                              ? 'Sin gasto en el período anterior'
                              : `Antes: ${formatMoney(item.previous)}`}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-ink">{formatMoney(item.amount)}</p>
                          {item.change !== null && (
                            <p
                              className={`text-xs font-medium ${
                                up
                                  ? 'text-red-600 dark:text-red-400'
                                  : down
                                    ? 'text-link'
                                    : 'text-muted'
                              }`}
                            >
                              {up ? '↑' : down ? '↓' : '='} {percent.format(Math.abs(item.change))}
                            </p>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </>
  )
}
