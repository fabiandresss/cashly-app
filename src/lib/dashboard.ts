import { currentMonth } from '@/lib/format'
import type { Transaction } from '@/types/db'

export interface MonthPoint {
  month: string
  label: string
  income: number
  expense: number
}

export interface CategoryShare {
  categoryId: string | null
  amount: number
  /** Fracción 0..1 del gasto total del mes. */
  share: number
}

export interface DashboardSummary {
  hasData: boolean
  balance: number
  monthIncome: number
  monthExpense: number
  monthSavings: number
  /** Ahorro / ingresos del mes, o null si no hubo ingresos. */
  savingsRate: number | null
  /** Variación porcentual vs. mes anterior (null si no hay base de comparación). */
  incomeChange: number | null
  expenseChange: number | null
  series: MonthPoint[]
  topCategories: CategoryShare[]
  recent: Transaction[]
}

const SERIES_MONTHS = 6
const TOP_CATEGORIES = 5
const RECENT_COUNT = 5

function addMonths(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const index = (y ?? 0) * 12 + ((m ?? 1) - 1) + delta
  const year = Math.floor(index / 12)
  const mon = (index % 12) + 1
  return `${year}-${String(mon).padStart(2, '0')}`
}

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const label = new Date(y ?? 2000, (m ?? 1) - 1, 1).toLocaleDateString('es-CL', { month: 'short' })
  return label.replace('.', '')
}

function change(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return (current - previous) / previous
}

/** Calcula los indicadores del dashboard a partir de la lista de movimientos (ordenada de más reciente a más antigua). */
export function summarize(transactions: readonly Transaction[], month: string = currentMonth()): DashboardSummary {
  const previousMonth = addMonths(month, -1)
  const months = Array.from({ length: SERIES_MONTHS }, (_, i) => addMonths(month, i - (SERIES_MONTHS - 1)))
  const byMonth = new Map<string, { income: number; expense: number }>(
    months.map((m) => [m, { income: 0, expense: 0 }]),
  )

  let balance = 0
  const expenseByCategory = new Map<string | null, number>()

  for (const t of transactions) {
    const signed = t.type === 'income' ? t.amount : -t.amount
    balance += signed

    const key = t.occurred_on.slice(0, 7)
    const bucket = byMonth.get(key)
    if (bucket) {
      if (t.type === 'income') bucket.income += t.amount
      else bucket.expense += t.amount
    }

    if (key === month && t.type === 'expense') {
      expenseByCategory.set(t.category_id, (expenseByCategory.get(t.category_id) ?? 0) + t.amount)
    }
  }

  const current = byMonth.get(month) ?? { income: 0, expense: 0 }
  const previous = byMonth.get(previousMonth) ?? { income: 0, expense: 0 }
  const monthSavings = current.income - current.expense

  const topCategories = [...expenseByCategory.entries()]
    .map(([categoryId, amount]) => ({
      categoryId,
      amount,
      share: current.expense > 0 ? amount / current.expense : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, TOP_CATEGORIES)

  return {
    hasData: transactions.length > 0,
    balance,
    monthIncome: current.income,
    monthExpense: current.expense,
    monthSavings,
    savingsRate: current.income > 0 ? monthSavings / current.income : null,
    incomeChange: change(current.income, previous.income),
    expenseChange: change(current.expense, previous.expense),
    series: months.map((m) => ({
      month: m,
      label: monthLabel(m),
      income: byMonth.get(m)?.income ?? 0,
      expense: byMonth.get(m)?.expense ?? 0,
    })),
    topCategories,
    recent: transactions.slice(0, RECENT_COUNT),
  }
}
