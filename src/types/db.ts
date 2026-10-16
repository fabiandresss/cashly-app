export type TransactionType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  type: TransactionType
  color: string
  /** Clave del ícono (ver lib/categoryIcons). */
  icon: string
}

export interface Transaction {
  id: string
  category_id: string | null
  type: TransactionType
  amount: number
  /** Fecha en formato YYYY-MM-DD. */
  occurred_on: string
  description: string | null
}

export interface TransactionInput {
  type: TransactionType
  amount: number
  occurred_on: string
  category_id: string | null
  description: string | null
}

export interface CategoryInput {
  name: string
  type: TransactionType
  color: string
  icon: string
}

export interface Budget {
  id: string
  /** null = presupuesto total del mes. */
  category_id: string | null
  /** Primer día del mes en formato YYYY-MM-01. */
  month: string
  amount: number
}

export interface BudgetInput {
  category_id: string | null
  month: string
  amount: number
}

export type BudgetStatus = 'ok' | 'warning' | 'exceeded'

export interface TransactionFilters {
  /** Mes en formato YYYY-MM. */
  month: string
  type: TransactionType | 'all'
  categoryId: string | 'all' | 'none'
}
