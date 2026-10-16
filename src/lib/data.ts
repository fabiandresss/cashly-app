import { resolveIcon } from '@/lib/categoryIcons'
import { monthRange } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import type {
  Budget,
  BudgetInput,
  Category,
  CategoryInput,
  Transaction,
  TransactionFilters,
  TransactionInput,
} from '@/types/db'

const ERROR_BY_CODE: Record<string, string> = {
  '23505': 'Ya existe una categoría con ese nombre y tipo.',
  '23503': 'La categoría seleccionada no es válida para este movimiento.',
  '23514': 'Alguno de los valores ingresados no es válido.',
  '42501': 'No tienes permiso para realizar esta operación.',
}

function db() {
  if (!supabase) {
    throw new Error('Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env.')
  }
  return supabase
}

function fail(error: { code?: string; message?: string }): never {
  const known = error.code ? ERROR_BY_CODE[error.code] : undefined
  throw new Error(known ?? 'No se pudo completar la operación. Inténtalo de nuevo.')
}

const TRANSACTION_COLUMNS = 'id, category_id, type, amount, occurred_on, description'

// ---------- Categorías ----------

export async function listCategories(): Promise<Category[]> {
  // select('*') tolera que la columna `icon` aún no exista (migración 0002 pendiente).
  const { data, error } = await db().from('categories').select('*').order('name', { ascending: true })
  if (error) fail(error)
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const name = String(r.name)
    return {
      id: String(r.id),
      name,
      type: r.type as Category['type'],
      color: String(r.color),
      icon: resolveIcon(name, r.icon),
    }
  })
}

export async function createCategory(input: CategoryInput): Promise<void> {
  const { error } = await db().from('categories').insert(input)
  if (error) fail(error)
}

export async function updateCategory(
  id: string,
  input: Pick<CategoryInput, 'name' | 'color' | 'icon'>,
): Promise<void> {
  const { error } = await db().from('categories').update(input).eq('id', id)
  if (error) fail(error)
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await db().from('categories').delete().eq('id', id)
  if (error) fail(error)
}

// ---------- Movimientos ----------

function normalize(row: Record<string, unknown>): Transaction {
  return { ...(row as unknown as Transaction), amount: Number(row.amount) }
}

export async function listTransactions(filters: TransactionFilters): Promise<Transaction[]> {
  const { from, to } = monthRange(filters.month)
  let query = db()
    .from('transactions')
    .select(TRANSACTION_COLUMNS)
    .gte('occurred_on', from)
    .lt('occurred_on', to)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(500)

  if (filters.type !== 'all') query = query.eq('type', filters.type)
  if (filters.categoryId === 'none') query = query.is('category_id', null)
  else if (filters.categoryId !== 'all') query = query.eq('category_id', filters.categoryId)

  const { data, error } = await query
  if (error) fail(error)
  return (data ?? []).map((row) => normalize(row as Record<string, unknown>))
}

/** Trae todos los movimientos paginando (PostgREST limita 1000 filas por consulta). */
export async function listAllTransactions(): Promise<Transaction[]> {
  const pageSize = 1000
  const maxRows = 20000
  const rows: Transaction[] = []

  for (let from = 0; from < maxRows; from += pageSize) {
    const { data, error } = await db()
      .from('transactions')
      .select(TRANSACTION_COLUMNS)
      .order('occurred_on', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)
    if (error) fail(error)
    const page = data ?? []
    rows.push(...page.map((row) => normalize(row as Record<string, unknown>)))
    if (page.length < pageSize) break
  }
  return rows
}

// ---------- Presupuestos ----------

export const DEFAULT_ALERT_THRESHOLD = 80

function budgetRow(row: Record<string, unknown>): Budget {
  return {
    id: String(row.id),
    category_id: row.category_id ? String(row.category_id) : null,
    month: String(row.month),
    amount: Number(row.amount),
  }
}

export async function listBudgets(month: string): Promise<Budget[]> {
  const { from } = monthRange(month)
  const { data, error } = await db()
    .from('budgets')
    .select('id, category_id, month, amount')
    .eq('month', from)
  if (error) fail(error)
  return (data ?? []).map((row) => budgetRow(row as Record<string, unknown>))
}

export async function createBudget(input: BudgetInput): Promise<void> {
  const { error } = await db().from('budgets').insert(input)
  if (error) fail(error)
}

export async function updateBudget(id: string, amount: number): Promise<void> {
  const { error } = await db().from('budgets').update({ amount }).eq('id', id)
  if (error) fail(error)
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await db().from('budgets').delete().eq('id', id)
  if (error) fail(error)
}

/** Copia los presupuestos de un mes a otro, omitiendo los que ya existen. Devuelve cuántos copió. */
export async function copyBudgets(fromMonth: string, toMonth: string): Promise<number> {
  const [source, target] = await Promise.all([listBudgets(fromMonth), listBudgets(toMonth)])
  const existing = new Set(target.map((b) => b.category_id ?? 'total'))
  const { from: toDate } = monthRange(toMonth)
  const rows = source
    .filter((b) => !existing.has(b.category_id ?? 'total'))
    .map((b) => ({ category_id: b.category_id, month: toDate, amount: b.amount }))
  if (rows.length === 0) return 0
  const { error } = await db().from('budgets').insert(rows)
  if (error) fail(error)
  return rows.length
}

/** Gastos de un mes (paginado), para calcular el avance de los presupuestos. */
export async function listMonthExpenses(month: string): Promise<Transaction[]> {
  const { from, to } = monthRange(month)
  const pageSize = 1000
  const rows: Transaction[] = []
  for (let start = 0; start < 20000; start += pageSize) {
    const { data, error } = await db()
      .from('transactions')
      .select(TRANSACTION_COLUMNS)
      .eq('type', 'expense')
      .gte('occurred_on', from)
      .lt('occurred_on', to)
      .order('id', { ascending: true })
      .range(start, start + pageSize - 1)
    if (error) fail(error)
    const page = data ?? []
    rows.push(...page.map((row) => normalize(row as Record<string, unknown>)))
    if (page.length < pageSize) break
  }
  return rows
}

// ---------- Ajustes del usuario ----------

export async function getAlertThreshold(): Promise<number> {
  const { data, error } = await db().from('user_settings').select('budget_alert_threshold').maybeSingle()
  if (error) fail(error)
  return data ? Number(data.budget_alert_threshold) : DEFAULT_ALERT_THRESHOLD
}

export async function saveAlertThreshold(value: number): Promise<void> {
  const { error } = await db().from('user_settings').upsert({ budget_alert_threshold: value })
  if (error) fail(error)
}

export async function createTransaction(input: TransactionInput): Promise<void> {
  const { error } = await db().from('transactions').insert(input)
  if (error) fail(error)
}

export async function updateTransaction(id: string, input: TransactionInput): Promise<void> {
  const { error } = await db().from('transactions').update(input).eq('id', id)
  if (error) fail(error)
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await db().from('transactions').delete().eq('id', id)
  if (error) fail(error)
}
