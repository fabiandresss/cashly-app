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
  name: string | null
  description: string | null
  /** Presente cuando el movimiento lo generó un programado. */
  recurring_id?: string | null
}

export interface TransactionTemplate {
  id: string
  type: TransactionType
  amount: number
  category_id: string | null
  name: string
  description: string | null
}

export interface TransactionInput {
  type: TransactionType
  amount: number
  occurred_on: string
  category_id: string | null
  name: string | null
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

export interface Debt {
  id: string
  name: string
  total_amount: number
  due_date: string | null
  category_id: string | null
  notes: string | null
  /** Suma de los pagos registrados. */
  paid: number
}

export interface DebtInput {
  name: string
  total_amount: number
  due_date: string | null
  category_id: string | null
  notes: string | null
}

export interface DebtPayment {
  id: string
  amount: number
  paid_on: string
  transaction_id: string | null
}

export type RecurringFrequency = 'monthly' | 'weekly' | 'yearly'

export interface RecurringRule {
  id: string
  category_id: string | null
  type: TransactionType
  amount: number
  name: string | null
  description: string | null
  frequency: RecurringFrequency
  day_of_month: number | null
  start_date: string
  end_date: string | null
  active: boolean
}

export interface RecurringInput {
  category_id: string | null
  type: TransactionType
  amount: number
  name: string | null
  description: string | null
  frequency: RecurringFrequency
  day_of_month: number | null
  start_date: string
  end_date: string | null
}

export interface SavingsGoal {
  id: string
  name: string
  target_amount: number
  target_date: string | null
  color: string
  icon: string
  /** Suma de aportes menos retiros. */
  saved: number
}

export interface GoalInput {
  name: string
  target_amount: number
  target_date: string | null
  color: string
  icon: string
}

export interface GoalContribution {
  id: string
  amount: number
  note: string | null
  contributed_on: string
}

export type PeriodMode = 'month' | 'range' | 'all'

export interface TransactionFilters {
  period: PeriodMode
  /** Mes en formato YYYY-MM (cuando period = 'month'). */
  month: string
  /** Rango YYYY-MM-DD (cuando period = 'range'); vacío = sin límite. */
  from: string
  to: string
  type: TransactionType | 'all'
  categoryId: string | 'all' | 'none'
  /** Texto a buscar en nombre y descripción. */
  query: string
  /** Montos mínimo y máximo como texto con formato; vacío = sin límite. */
  minAmount: string
  maxAmount: string
}
