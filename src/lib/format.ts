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

/** Rango [from, to) de fechas ISO para un mes YYYY-MM. */
export function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split('-').map(Number)
  const year = y ?? new Date().getFullYear()
  const mon = m ?? 1
  const nextYear = mon === 12 ? year + 1 : year
  const nextMonth = mon === 12 ? 1 : mon + 1
  return { from: `${year}-${pad(mon)}-01`, to: `${nextYear}-${pad(nextMonth)}-01` }
}

/** Convierte texto del usuario ("1.250,50" o "1250.5") a número, o null si no es válido. */
export function parseAmount(text: string): number | null {
  const cleaned = text.trim().replace(/\s/g, '')
  if (!cleaned) return null
  let normalized = cleaned
  if (cleaned.includes(',')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else if ((cleaned.match(/\./g) ?? []).length > 1) {
    normalized = cleaned.replace(/\./g, '')
  }
  const value = Number(normalized)
  if (!Number.isFinite(value)) return null
  return Math.round(value * 100) / 100
}
