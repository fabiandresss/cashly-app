const CURRENCY = 'CLP'

const money = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatMoney(value: number): string {
  return money.format(value)
}

/** Formatea una fecha YYYY-MM-DD sin desfases de zona horaria. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function todayISO(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function currentMonth(): string {
  return todayISO().slice(0, 7)
}

/** Desplaza un mes YYYY-MM en `delta` meses (puede ser negativo). */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const index = (y ?? 0) * 12 + ((m ?? 1) - 1) + delta
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`
}

/** "octubre de 2026" para un mes YYYY-MM. */
export function monthTitle(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(y ?? 2000, (m ?? 1) - 1, 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
}

/** Rango [from, to) de fechas ISO para un mes YYYY-MM. */
export function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split('-').map(Number)
  const year = y ?? new Date().getFullYear()
  const mon = m ?? 1
  const nextYear = mon === 12 ? year + 1 : year
  const nextMonth = mon === 12 ? 1 : mon + 1
  return { from: `${year}-${pad(mon)}-01`, to: `${nextYear}-${pad(nextMonth)}-01` }
}

/**
 * Da formato es-CL a un monto mientras se escribe: "1400000" → "1.400.000".
 * Solo conserva dígitos y una coma decimal (máximo 2 decimales).
 */
export function formatMoneyInput(raw: string): string {
  const cleaned = raw.replace(/[^\d,]/g, '')
  const commaIndex = cleaned.indexOf(',')
  const hasComma = commaIndex !== -1
  const integerRaw = (hasComma ? cleaned.slice(0, commaIndex) : cleaned).replace(/^0+(?=\d)/, '').slice(0, 12)
  const decimals = hasComma ? cleaned.slice(commaIndex + 1).replace(/,/g, '').slice(0, 2) : ''
  const integer = integerRaw.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return hasComma ? `${integer || '0'},${decimals}` : integer
}

/** Número → texto editable con formato es-CL (sin símbolo de moneda). */
export function amountToInput(value: number): string {
  const [integer = '0', decimals] = value.toFixed(2).split('.')
  const trimmed = decimals && decimals !== '00' ? `${integer},${decimals.replace(/0$/, '')}` : integer
  return formatMoneyInput(trimmed)
}

/** Convierte el texto con formato es-CL ("1.250,50") a número, o null si no es válido. */
export function parseAmount(text: string): number | null {
  const cleaned = text.trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  if (!cleaned) return null
  const value = Number(cleaned)
  if (!Number.isFinite(value)) return null
  return Math.round(value * 100) / 100
}
