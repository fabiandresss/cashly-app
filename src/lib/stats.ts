import { currentMonth, shiftMonth } from '@/lib/format'
import type { Transaction } from '@/types/db'

export type PeriodKey = 'month' | '3m' | '6m' | '12m' | 'year'

export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'month', label: 'Este mes' },
  { key: '3m', label: '3 meses' },
  { key: '6m', label: '6 meses' },
  { key: '12m', label: '12 meses' },
  { key: 'year', label: 'Este año' },
]

/** Meses (YYYY-MM, ascendente) que cubre un período terminando en el mes actual. */
export function periodMonths(key: PeriodKey, current: string = currentMonth()): string[] {
  let count = 1
  if (key === '3m') count = 3
  else if (key === '6m') count = 6
  else if (key === '12m') count = 12
  else if (key === 'year') count = Number(current.split('-')[1] ?? 1)
  return Array.from({ length: count }, (_, i) => shiftMonth(current, i - (count - 1)))
}

export const OTHERS_ID = '__others__'
const MAX_SLICES = 6
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export interface Slice {
  /** null = sin categoría; OTHERS_ID = categorías menores agrupadas. */
  categoryId: string | null
  amount: number
  share: number
}

export interface SeriesPoint {
  month: string
  label: string
  income: number
  expense: number
  /** Saldo acumulado al cierre del mes. */
  balance: number
}

export interface RankingItem {
  categoryId: string | null
  amount: number
  previous: number
  /** Variación vs. el período anterior; null si no había gasto antes. */
  change: number | null
}

export interface StatsResult {
  hasData: boolean
  months: string[]
  series: SeriesPoint[]
  income: number
  expense: number
  savingsRate: number | null
  avgMonthlyExpense: number
  biggestExpense: Transaction | null
  expenseSlices: Slice[]
  incomeSlices: Slice[]
  weekday: { label: string; total: number; count: number }[]
  ranking: RankingItem[]
}

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(y ?? 2000, (m ?? 1) - 1, 1).toLocaleDateString('es-CL', { month: 'short' }).replace('.', '')
}

function toSlices(totals: Map<string | null, number>, total: number): Slice[] {
  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, MAX_SLICES)
  const rest = sorted.slice(MAX_SLICES)
  const slices: Slice[] = top.map(([categoryId, amount]) => ({
    categoryId,
    amount,
    share: total > 0 ? amount / total : 0,
  }))
  const restAmount = rest.reduce((acc, [, amount]) => acc + amount, 0)
  if (restAmount > 0) {
    slices.push({ categoryId: OTHERS_ID, amount: restAmount, share: total > 0 ? restAmount / total : 0 })
  }
  return slices
}

/** weekday de una fecha YYYY-MM-DD con lunes = 0. */
function weekdayIndex(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  const jsDay = new Date(y ?? 2000, (m ?? 1) - 1, d ?? 1).getDay()
  return (jsDay + 6) % 7
}

export function computeStats(transactions: readonly Transaction[], months: readonly string[]): StatsResult {
  const first = months[0] ?? currentMonth()
  const current = new Set(months)
  const previous = new Set(months.map((m) => shiftMonth(m, -months.length)))

  const perMonth = new Map(months.map((m) => [m, { income: 0, expense: 0 }]))
  const expenseByCat = new Map<string | null, number>()
  const incomeByCat = new Map<string | null, number>()
  const prevExpenseByCat = new Map<string | null, number>()
  const weekday = WEEKDAYS.map((label) => ({ label, total: 0, count: 0 }))

  let openingBalance = 0
  let income = 0
  let expense = 0
  let periodCount = 0
  let biggest: Transaction | null = null

  for (const t of transactions) {
    const key = t.occurred_on.slice(0, 7)
    const signed = t.type === 'income' ? t.amount : -t.amount

    if (key < first) openingBalance += signed

    if (current.has(key)) {
      periodCount++
      const bucket = perMonth.get(key)
      if (t.type === 'income') {
        income += t.amount
        if (bucket) bucket.income += t.amount
        incomeByCat.set(t.category_id, (incomeByCat.get(t.category_id) ?? 0) + t.amount)
      } else {
        expense += t.amount
        if (bucket) bucket.expense += t.amount
        expenseByCat.set(t.category_id, (expenseByCat.get(t.category_id) ?? 0) + t.amount)
        const w = weekday[weekdayIndex(t.occurred_on)]
        if (w) {
          w.total += t.amount
          w.count += 1
        }
        if (!biggest || t.amount > biggest.amount) biggest = t
      }
    } else if (previous.has(key) && t.type === 'expense') {
      prevExpenseByCat.set(t.category_id, (prevExpenseByCat.get(t.category_id) ?? 0) + t.amount)
    }
  }

  let running = openingBalance
  const series: SeriesPoint[] = months.map((month) => {
    const b = perMonth.get(month) ?? { income: 0, expense: 0 }
    running += b.income - b.expense
    return { month, label: monthLabel(month), income: b.income, expense: b.expense, balance: running }
  })

  const ranking: RankingItem[] = [...expenseByCat.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([categoryId, amount]) => {
      const prev = prevExpenseByCat.get(categoryId) ?? 0
      return { categoryId, amount, previous: prev, change: prev > 0 ? (amount - prev) / prev : null }
    })

  return {
    hasData: periodCount > 0,
    months: [...months],
    series,
    income,
    expense,
    savingsRate: income > 0 ? (income - expense) / income : null,
    avgMonthlyExpense: months.length > 0 ? expense / months.length : 0,
    biggestExpense: biggest,
    expenseSlices: toSlices(expenseByCat, expense),
    incomeSlices: toSlices(incomeByCat, income),
    weekday,
    ranking,
  }
}
