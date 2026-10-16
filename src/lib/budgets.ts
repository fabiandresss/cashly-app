import type { BudgetStatus, Transaction } from '@/types/db'

/** Suma los gastos por categoría (null = sin categoría) y el total. */
export function sumExpenses(expenses: readonly Transaction[]): {
  byCategory: Map<string, number>
  total: number
} {
  const byCategory = new Map<string, number>()
  let total = 0
  for (const t of expenses) {
    total += t.amount
    if (t.category_id) byCategory.set(t.category_id, (byCategory.get(t.category_id) ?? 0) + t.amount)
  }
  return { byCategory, total }
}

/** ok: bajo el umbral · warning: desde el umbral hasta el 100% · exceeded: sobre el 100%. */
export function budgetStatus(spent: number, limit: number, thresholdPercent: number): BudgetStatus {
  if (limit <= 0) return 'ok'
  const ratio = spent / limit
  if (ratio > 1) return 'exceeded'
  if (ratio >= thresholdPercent / 100) return 'warning'
  return 'ok'
}

export const STATUS_STYLES: Record<BudgetStatus, { bar: string; text: string; label: string }> = {
  ok: { bar: 'bg-brand-500', text: 'text-link', label: 'Dentro del presupuesto' },
  warning: { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', label: 'Cerca del límite' },
  exceeded: { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400', label: 'Presupuesto excedido' },
}
