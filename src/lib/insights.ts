import type { Transaction } from '@/types/db'

export type InsightKind = 'anomaly' | 'small_spend' | 'subscription'

export interface Insight {
  id: string
  kind: InsightKind
  severity: 'info' | 'warning'
  title: string
  detail: string
  /** Monto asociado, si aplica. */
  amount?: number
}

/** Un gasto se considera "hormiga" si es igual o menor a este monto (CLP). */
export const SMALL_SPEND_LIMIT = 10_000
const MIN_SMALL_COUNT = 8
const ANOMALY_MIN_AMOUNT = 20_000
const ANOMALY_MIN_SAMPLES = 5
const HISTORY_MONTHS = 6

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const index = (y ?? 0) * 12 + ((m ?? 1) - 1) + delta
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function labelOf(t: Transaction, categoryName: (id: string | null) => string): string {
  return t.name || t.description || categoryName(t.category_id)
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length
}

function stdev(values: number[], avg: number): number {
  return Math.sqrt(values.reduce((acc, v) => acc + (v - avg) ** 2, 0) / values.length)
}

/**
 * Hallazgos deterministas sobre tus movimientos (sin IA): gastos inusuales,
 * gastos hormiga y cobros repetidos que podrían ser suscripciones.
 */
export function computeInsights(
  transactions: readonly Transaction[],
  month: string,
  categoryName: (id: string | null) => string,
  fmt: (value: number) => string,
): Insight[] {
  const insights: Insight[] = []
  const expenses = transactions.filter((t) => t.type === 'expense')

  // ---- 1. Gastos inusuales del mes, respecto del historial de su categoría ----
  const firstHistory = shiftMonth(month, -HISTORY_MONTHS)
  const historyByCategory = new Map<string, number[]>()
  for (const t of expenses) {
    const key = t.occurred_on.slice(0, 7)
    if (t.category_id && key >= firstHistory && key < month) {
      const list = historyByCategory.get(t.category_id) ?? []
      list.push(t.amount)
      historyByCategory.set(t.category_id, list)
    }
  }

  const anomalies = expenses
    .filter((t) => t.occurred_on.startsWith(month) && t.category_id && t.amount >= ANOMALY_MIN_AMOUNT)
    .map((t) => {
      const history = historyByCategory.get(t.category_id ?? '') ?? []
      if (history.length < ANOMALY_MIN_SAMPLES) return null
      const avg = mean(history)
      const sd = stdev(history, avg)
      if (t.amount > avg + 3 * sd && t.amount >= 2 * avg) return { t, avg }
      return null
    })
    .filter((x): x is { t: Transaction; avg: number } => x !== null)
    .sort((a, b) => b.t.amount - a.t.amount)
    .slice(0, 3)

  for (const { t, avg } of anomalies) {
    insights.push({
      id: `anomaly-${t.id}`,
      kind: 'anomaly',
      severity: 'warning',
      title: `Gasto inusual: ${labelOf(t, categoryName)}`,
      detail: `${fmt(t.amount)} en ${categoryName(t.category_id)}, cuando lo habitual es ${fmt(avg)}.`,
      amount: t.amount,
    })
  }

  // ---- 2. Gastos hormiga del mes ----
  const monthExpenses = expenses.filter((t) => t.occurred_on.startsWith(month))
  const small = monthExpenses.filter((t) => t.amount <= SMALL_SPEND_LIMIT)
  if (small.length >= MIN_SMALL_COUNT) {
    const total = small.reduce((acc, t) => acc + t.amount, 0)
    const monthTotal = monthExpenses.reduce((acc, t) => acc + t.amount, 0)
    const share = monthTotal > 0 ? Math.round((total / monthTotal) * 100) : 0

    const byLabel = new Map<string, { label: string; count: number; sum: number }>()
    for (const t of small) {
      const label = labelOf(t, categoryName)
      const key = normalizeName(label)
      const entry = byLabel.get(key) ?? { label, count: 0, sum: 0 }
      entry.count += 1
      entry.sum += t.amount
      byLabel.set(key, entry)
    }
    const top = [...byLabel.values()].sort((a, b) => b.sum - a.sum).slice(0, 3)

    insights.push({
      id: 'small-spend',
      kind: 'small_spend',
      severity: 'info',
      title: `${small.length} gastos hormiga este mes`,
      detail: `Suman ${fmt(total)} (${share}% de tus gastos). Los que más pesan: ${top
        .map((x) => `${x.label} (${x.count}×, ${fmt(x.sum)})`)
        .join(', ')}.`,
      amount: total,
    })
  }

  // ---- 3. Cobros repetidos que podrían ser suscripciones ----
  const recentMonths = new Set([0, 1, 2, 3].map((i) => shiftMonth(month, -i)))
  const groups = new Map<string, { label: string; months: Set<string>; amounts: number[] }>()
  for (const t of expenses) {
    const key = t.occurred_on.slice(0, 7)
    const raw = t.name || t.description
    if (!raw || t.recurring_id || !recentMonths.has(key)) continue
    const norm = normalizeName(raw)
    if (norm.length < 3) continue
    const g = groups.get(norm) ?? { label: raw, months: new Set<string>(), amounts: [] }
    g.months.add(key)
    g.amounts.push(t.amount)
    groups.set(norm, g)
  }

  for (const [norm, g] of groups) {
    if (g.months.size < 3) continue
    const avg = mean(g.amounts)
    const similar = g.amounts.every((a) => Math.abs(a - avg) <= avg * 0.1)
    if (!similar) continue
    insights.push({
      id: `subscription-${norm}`,
      kind: 'subscription',
      severity: 'info',
      title: `Posible suscripción: ${g.label}`,
      detail: `Se repite hace ${g.months.size} meses por unos ${fmt(avg)}. Puedes programarlo en Movimientos → Programados.`,
      amount: avg,
    })
    if (insights.filter((i) => i.kind === 'subscription').length >= 3) break
  }

  return insights
}
