export type TransactionType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  type: TransactionType
  color: string
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
}

export interface TransactionFilters {
  /** Mes en formato YYYY-MM. */
  month: string
  type: TransactionType | 'all'
  categoryId: string | 'all' | 'none'
}
