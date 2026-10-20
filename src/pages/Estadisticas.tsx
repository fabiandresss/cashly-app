import { useMoney } from '@/hooks/useMoney'
import { lazy, Suspense, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, buttonClass, FxButton, FxCard, List, ListRow, PairBars, Segmented, StatCard } from '@/components/fx'
import { Alert } from '@/components/ui/Alert'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAsyncData } from '@/hooks/useAsyncData'
import { listAllTransactions, listCategories } from '@/lib/data'
import { formatDate } from '@/lib/format'
import { computeStats, OTHERS_ID, PERIODS, periodMonths, type PeriodKey, type Slice } from '@/lib/stats'
import type { Category } from '@/types/db'

const DonutChart = lazy(() => import('@/components/features/StatsCharts').then((m) => ({ default: m.DonutChart })))
const BalanceChart = lazy(() => import('@/components/features/StatsCharts').then((m) => ({ default: m.BalanceChart })))

const NO_CATEGORIES: readonly Category[] = []
const SLICE_OPTIONS = [
  { value: 'expense', label: 'Gastos' },
  { value: 'income', label: 'Ingresos' },
] as const
const percent = new Intl.NumberFormat('es-CL', { style: 'percent', maximumFractionDigits: 0 })

function Spinner() {
  return (
    <div className="flex h-56 items-center justify-center">
      <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-mute border-t-ink" />
    </div>
  )
}

export function EstadisticasPage() {
  const { money } = useMoney()
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
  const weekdayTotals = stats?.weekday.map((d) => d.total) ?? []
  const peakDay = weekdayTotals.length ? weekdayTotals.indexOf(Math.max(...weekdayTotals)) : null

  const loading = transactionsQuery.loading && !stats
  const empty = stats !== null && !stats.hasData

  return (
    <>
      <PageHeader eyebrow="Análisis" title="Estadísticas" description="Tus hábitos financieros en el período que elijas." />

      <Segmented
        label="Período"
        options={PERIODS.map((p) => ({ value: p.key, label: p.label }))}
        value={period}
        onChange={setPeriod}
        className="mb-5 sm:!inline-flex"
      />

      {transactionsQuery.error && (
        <div className="mb-5 space-y-3">
          <Alert tone="error">{transactionsQuery.error}</Alert>
          <FxButton variant="soft" size="sm" onClick={transactionsQuery.reload}>
            Reintentar
          </FxButton>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : empty ? (
        <FxCard className="fx-enter">
          <EmptyState
            icon="M4 20V10M10 20V4M16 20v-8M22 20H2"
            title="Sin datos en este período"
            description="Registra movimientos o elige un período más amplio para ver tus estadísticas."
          />
          <div className="pb-4 text-center">
            <Link to="/movimientos" className={buttonClass({ variant: 'soft' })}>
              Ir a movimientos
            </Link>
          </div>
        </FxCard>
      ) : stats ? (
        <>
          <FxCard className="fx-enter">
            <div className="fx-grid-stats" data-cols="4">
              <StatCard
                label="Gasto promedio"
                value={money(stats.avgMonthlyExpense)}
                sub={`Mensual, en ${stats.months.length} mes${stats.months.length === 1 ? '' : 'es'}`}
                icon="M12 5v14M5 12l7 7 7-7"
              />
              <StatCard
                label="Tasa de ahorro"
                value={stats.savingsRate === null ? '—' : percent.format(stats.savingsRate)}
                sub={stats.savingsRate === null ? 'Sin ingresos en el período' : 'Del total de ingresos'}
                icon="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"
                {...(stats.savingsRate !== null && stats.savingsRate > 0 ? { tone: 'positive' as const } : {})}
              />
              <StatCard
                label="Mayor gasto"
                value={biggest ? money(biggest.amount) : '—'}
                sub={
                  biggest
                    ? `${biggest.name || biggest.description || biggestCategory?.name || 'Sin categoría'} · ${formatDate(biggest.occurred_on)}`
                    : 'Sin gastos en el período'
                }
                icon="M3 17l6-6 4 4 8-8M15 7h6v6"
              />
              <StatCard
                label="Categoría principal"
                value={topMeta ? topMeta.name : '—'}
                sub={
                  topExpense && topMeta
                    ? `${money(topExpense.amount)} · ${percent.format(topExpense.share)} del gasto`
                    : 'Sin gastos en el período'
                }
                icon="M12 3a9 9 0 109 9h-9V3z"
              />
            </div>
          </FxCard>

          <FxCard className="fx-enter mt-4" title="Ingresos vs gastos" sub="Mes a mes">
            <PairBars data={stats.series} format={money} label="Ingresos y gastos por mes en el período" />
          </FxCard>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <FxCard
              className="fx-enter"
              title="Distribución"
              sub="Por categoría"
              action={
                <Segmented
                  role="radio"
                  variant="plain"
                  inline
                  label="Tipo"
                  options={SLICE_OPTIONS}
                  value={sliceType}
                  onChange={setSliceType}
                />
              }
            >
              {slices.length === 0 ? (
                <p className="rounded-[var(--r-md)] bg-soft px-4 py-12 text-center text-sm text-muted">
                  No hay {sliceType === 'expense' ? 'gastos' : 'ingresos'} en este período.
                </p>
              ) : (
                <>
                  <Suspense fallback={<Spinner />}>
                    <DonutChart
                      data={donutData}
                      centerLabel={sliceType === 'expense' ? 'Gastos' : 'Ingresos'}
                      centerValue={money(sliceTotal)}
                    />
                  </Suspense>
                  <ul className="mt-5 grid gap-1">
                    {slices.map((slice) => {
                      const meta = sliceMeta(slice)
                      return (
                        <li key={slice.categoryId ?? 'none'} className="flex items-center gap-2.5 rounded-xl px-1 py-1.5 text-sm">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
                          <span className="min-w-0 flex-1 truncate text-ink">{meta.name}</span>
                          <span className="fx-num shrink-0 text-muted">{money(slice.amount)}</span>
                          <span className="fx-eyebrow w-10 shrink-0 text-right !text-ink">{percent.format(slice.share)}</span>
                        </li>
                      )
                    })}
                  </ul>
                </>
              )}
            </FxCard>

            <FxCard className="fx-enter" title="Balance acumulado" sub="Saldo al cierre de cada mes">
              <Suspense fallback={<Spinner />}>
                <BalanceChart data={stats.series} />
              </Suspense>
            </FxCard>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <FxCard className="fx-enter" title="Gasto por día" sub="Días de la semana">
              <BarChart
                wide
                height={170}
                data={stats.weekday.map((d) => d.total)}
                labels={stats.weekday.map((d) => `${d.label} · ${d.count} gasto${d.count === 1 ? '' : 's'}`)}
                format={money}
                label="Gasto total por día de la semana"
                initial={peakDay}
              />
              <div className="fx-pairs__axis" aria-hidden="true">
                {stats.weekday.map((d) => (
                  <span key={d.label} className="fx-eyebrow">
                    {d.label}
                  </span>
                ))}
              </div>
            </FxCard>

            <FxCard className="fx-enter" title="Ranking de gastos" sub="Vs período anterior">
              {stats.ranking.length === 0 ? (
                <p className="text-sm text-muted">No hay gastos en este período.</p>
              ) : (
                <List variant="flat">
                  {stats.ranking.map((item) => {
                    const category = item.categoryId ? categoryById.get(item.categoryId) : undefined
                    const up = item.change !== null && item.change > 0.005
                    const down = item.change !== null && item.change < -0.005
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
                        title={category?.name ?? 'Sin categoría'}
                        sub={item.change === null ? 'Sin gasto en el período anterior' : `Antes: ${money(item.previous)}`}
                        amount={money(item.amount)}
                        side={
                          item.change === null ? undefined : (
                            <span className={up ? 'font-semibold text-ink' : down ? 'font-semibold text-positive' : ''}>
                              {up ? '↑' : down ? '↓' : '='} {percent.format(Math.abs(item.change))}
                            </span>
                          )
                        }
                      />
                    )
                  })}
                </List>
              )}
            </FxCard>
          </div>
        </>
      ) : null}
    </>
  )
}
