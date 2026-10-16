import { resolveIcon } from '@/lib/categoryIcons'
import { monthRange, parseAmount } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import type {
  Budget,
  BudgetInput,
  Category,
  CategoryInput,
  Debt,
  DebtInput,
  DebtPayment,
  GoalContribution,
  GoalInput,
  RecurringInput,
  RecurringRule,
  SavingsGoal,
  Transaction,
  TransactionFilters,
  TransactionInput,
  TransactionTemplate,
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

// select('*') tolera que la columna `name` aún no exista (migración 0007 pendiente).
const TRANSACTION_COLUMNS = '*'

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

/** Máximo de filas que devuelve una búsqueda (se avisa en pantalla si se alcanza). */
export const SEARCH_LIMIT = 3000

/** Quita caracteres que tienen significado especial en los filtros de PostgREST/LIKE. */
function sanitizeSearch(text: string): string {
  return text
    .replace(/[%_,()*]/g, ' ')
    .replace(/\\/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
}

export async function listTransactions(filters: TransactionFilters): Promise<Transaction[]> {
  const pageSize = 1000
  const rows: Transaction[] = []
  const search = sanitizeSearch(filters.query)
  const min = filters.minAmount ? parseAmount(filters.minAmount) : null
  const max = filters.maxAmount ? parseAmount(filters.maxAmount) : null

  for (let start = 0; start < SEARCH_LIMIT; start += pageSize) {
    let query = db()
      .from('transactions')
      .select(TRANSACTION_COLUMNS)
      .order('occurred_on', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(start, Math.min(start + pageSize, SEARCH_LIMIT) - 1)

    if (filters.period === 'month') {
      const { from, to } = monthRange(filters.month)
      query = query.gte('occurred_on', from).lt('occurred_on', to)
    } else if (filters.period === 'range') {
      if (filters.from) query = query.gte('occurred_on', filters.from)
      if (filters.to) query = query.lte('occurred_on', filters.to)
    }

    if (filters.type !== 'all') query = query.eq('type', filters.type)
    if (filters.categoryId === 'none') query = query.is('category_id', null)
    else if (filters.categoryId !== 'all') query = query.eq('category_id', filters.categoryId)
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    if (min !== null) query = query.gte('amount', min)
    if (max !== null) query = query.lte('amount', max)

    const { data, error } = await query
    if (error) fail(error)
    const page = data ?? []
    rows.push(...page.map((row) => normalize(row as Record<string, unknown>)))
    if (page.length < pageSize) break
  }
  return rows
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

// ---------- Plantillas ----------

export async function listTemplates(): Promise<TransactionTemplate[]> {
  const { data, error } = await db()
    .from('transaction_templates')
    .select('id, type, amount, category_id, name, description')
    .order('created_at', { ascending: false })
  if (error) fail(error)
  return ((data ?? []) as Array<Record<string, unknown>>).map((t) => ({
    id: String(t.id),
    type: t.type as TransactionTemplate['type'],
    amount: Number(t.amount),
    category_id: t.category_id ? String(t.category_id) : null,
    name: String(t.name),
    description: (t.description as string | null) ?? null,
  }))
}

export async function createTemplate(input: Omit<TransactionTemplate, 'id'>): Promise<void> {
  const { error } = await db().from('transaction_templates').insert(input)
  if (error) fail(error)
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await db().from('transaction_templates').delete().eq('id', id)
  if (error) fail(error)
}

// ---------- Movimientos programados ----------

const RECURRING_COLUMNS = '*'

function recurringRow(row: Record<string, unknown>): RecurringRule {
  return {
    id: String(row.id),
    category_id: row.category_id ? String(row.category_id) : null,
    type: row.type as RecurringRule['type'],
    amount: Number(row.amount),
    name: (row.name as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    frequency: row.frequency as RecurringRule['frequency'],
    day_of_month: row.day_of_month === null ? null : Number(row.day_of_month),
    start_date: String(row.start_date),
    end_date: (row.end_date as string | null) ?? null,
    active: Boolean(row.active),
  }
}

export async function listRecurring(): Promise<RecurringRule[]> {
  const { data, error } = await db()
    .from('recurring_transactions')
    .select(RECURRING_COLUMNS)
    .order('created_at', { ascending: false })
  if (error) fail(error)
  return (data ?? []).map((row) => recurringRow(row as Record<string, unknown>))
}

export async function createRecurring(input: RecurringInput): Promise<void> {
  const { error } = await db().from('recurring_transactions').insert(input)
  if (error) fail(error)
}

export async function updateRecurring(id: string, input: RecurringInput): Promise<void> {
  const { error } = await db().from('recurring_transactions').update(input).eq('id', id)
  if (error) fail(error)
}

export async function setRecurringActive(id: string, active: boolean): Promise<void> {
  const { error } = await db().from('recurring_transactions').update({ active }).eq('id', id)
  if (error) fail(error)
}

export async function deleteRecurring(id: string): Promise<void> {
  const { error } = await db().from('recurring_transactions').delete().eq('id', id)
  if (error) fail(error)
}

/** Genera los movimientos programados pendientes. Devuelve cuántos creó. */
export async function generateMyRecurring(): Promise<number> {
  const { data, error } = await db().rpc('generate_my_recurring')
  if (error) fail(error)
  return Number(data ?? 0)
}

// ---------- Metas de ahorro ----------

export async function listGoals(): Promise<SavingsGoal[]> {
  const [goalsRes, contribRes] = await Promise.all([
    db()
      .from('savings_goals')
      .select('id, name, target_amount, target_date, color, icon')
      .order('created_at', { ascending: true }),
    db().from('goal_contributions').select('goal_id, amount'),
  ])
  if (goalsRes.error) fail(goalsRes.error)
  if (contribRes.error) fail(contribRes.error)

  const saved = new Map<string, number>()
  for (const c of (contribRes.data ?? []) as Array<{ goal_id: string; amount: number }>) {
    saved.set(c.goal_id, (saved.get(c.goal_id) ?? 0) + Number(c.amount))
  }

  return ((goalsRes.data ?? []) as Array<Record<string, unknown>>).map((g) => ({
    id: String(g.id),
    name: String(g.name),
    target_amount: Number(g.target_amount),
    target_date: (g.target_date as string | null) ?? null,
    color: String(g.color),
    icon: resolveIcon(String(g.name), g.icon),
    saved: saved.get(String(g.id)) ?? 0,
  }))
}

export async function createGoal(input: GoalInput): Promise<void> {
  const { error } = await db().from('savings_goals').insert(input)
  if (error) fail(error)
}

export async function updateGoal(id: string, input: GoalInput): Promise<void> {
  const { error } = await db().from('savings_goals').update(input).eq('id', id)
  if (error) fail(error)
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await db().from('savings_goals').delete().eq('id', id)
  if (error) fail(error)
}

export async function addContribution(
  goalId: string,
  amount: number,
  note: string | null,
  contributedOn: string,
): Promise<void> {
  const { error } = await db()
    .from('goal_contributions')
    .insert({ goal_id: goalId, amount, note, contributed_on: contributedOn })
  if (error) fail(error)
}

export async function listContributions(goalId: string): Promise<GoalContribution[]> {
  const { data, error } = await db()
    .from('goal_contributions')
    .select('id, amount, note, contributed_on')
    .eq('goal_id', goalId)
    .order('contributed_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) fail(error)
  return ((data ?? []) as Array<Record<string, unknown>>).map((c) => ({
    id: String(c.id),
    amount: Number(c.amount),
    note: (c.note as string | null) ?? null,
    contributed_on: String(c.contributed_on),
  }))
}

export async function deleteContribution(id: string): Promise<void> {
  const { error } = await db().from('goal_contributions').delete().eq('id', id)
  if (error) fail(error)
}

// ---------- Deudas ----------

const DEBT_ERRORS: Record<string, string> = {
  exceeds_remaining: 'El pago supera lo que falta por pagar de esta deuda.',
  invalid_amount: 'Ingresa un monto mayor a 0.',
  debt_not_found: 'No se encontró la deuda.',
  payment_not_found: 'No se encontró el pago.',
}

function debtFail(error: { code?: string; message?: string }): never {
  const known = Object.entries(DEBT_ERRORS).find(([key]) => error.message?.includes(key))
  if (known) throw new Error(known[1])
  fail(error)
}

export async function listDebts(): Promise<Debt[]> {
  const [debtsRes, paymentsRes] = await Promise.all([
    db()
      .from('debts')
      .select('id, name, total_amount, due_date, category_id, notes')
      .order('created_at', { ascending: false }),
    db().from('debt_payments').select('debt_id, amount'),
  ])
  if (debtsRes.error) fail(debtsRes.error)
  if (paymentsRes.error) fail(paymentsRes.error)

  const paid = new Map<string, number>()
  for (const p of (paymentsRes.data ?? []) as Array<{ debt_id: string; amount: number }>) {
    paid.set(p.debt_id, (paid.get(p.debt_id) ?? 0) + Number(p.amount))
  }

  return ((debtsRes.data ?? []) as Array<Record<string, unknown>>).map((d) => ({
    id: String(d.id),
    name: String(d.name),
    total_amount: Number(d.total_amount),
    due_date: (d.due_date as string | null) ?? null,
    category_id: d.category_id ? String(d.category_id) : null,
    notes: (d.notes as string | null) ?? null,
    paid: paid.get(String(d.id)) ?? 0,
  }))
}

export async function createDebt(input: DebtInput): Promise<void> {
  const { error } = await db().from('debts').insert(input)
  if (error) fail(error)
}

export async function updateDebt(id: string, input: DebtInput): Promise<void> {
  const { error } = await db().from('debts').update(input).eq('id', id)
  if (error) fail(error)
}

export async function deleteDebt(id: string): Promise<void> {
  const { error } = await db().from('debts').delete().eq('id', id)
  if (error) fail(error)
}

/** Registra un pago y genera el movimiento de gasto correspondiente. */
export async function payDebt(debtId: string, amount: number, paidOn: string): Promise<void> {
  const { error } = await db().rpc('pay_debt', { p_debt_id: debtId, p_amount: amount, p_paid_on: paidOn })
  if (error) debtFail(error)
}

export async function listDebtPayments(debtId: string): Promise<DebtPayment[]> {
  const { data, error } = await db()
    .from('debt_payments')
    .select('id, amount, paid_on, transaction_id')
    .eq('debt_id', debtId)
    .order('paid_on', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) fail(error)
  return ((data ?? []) as Array<Record<string, unknown>>).map((p) => ({
    id: String(p.id),
    amount: Number(p.amount),
    paid_on: String(p.paid_on),
    transaction_id: p.transaction_id ? String(p.transaction_id) : null,
  }))
}

/** Elimina un pago y el gasto que había generado. */
export async function undoDebtPayment(paymentId: string): Promise<void> {
  const { error } = await db().rpc('undo_debt_payment', { p_payment_id: paymentId })
  if (error) debtFail(error)
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
