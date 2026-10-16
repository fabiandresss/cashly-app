import { formatDate, todayISO } from '@/lib/format'
import type { RecurringRule } from '@/types/db'

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function parse(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number)
  return { y: y ?? 2000, m: m ?? 1, d: d ?? 1 }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function toISO(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Texto legible de la frecuencia: "Cada día 1 de mes", "Cada lunes"… */
export function describeSchedule(rule: RecurringRule): string {
  if (rule.frequency === 'weekly') {
    const { y, m, d } = parse(rule.start_date)
    return `Cada ${WEEKDAYS[new Date(y, m - 1, d).getDay()] ?? 'semana'}`
  }
  if (rule.frequency === 'yearly') {
    const { m, d } = parse(rule.start_date)
    return `Cada año el ${d} de ${MONTHS[m - 1] ?? ''}`
  }
  return `Cada mes, el día ${rule.day_of_month ?? 1}`
}

/** Próxima fecha de ejecución (hoy o posterior) según la regla, o null si ya terminó. */
export function nextOccurrence(rule: RecurringRule, fromISO: string = todayISO()): string | null {
  const start = parse(rule.start_date)
  const from = parse(fromISO)
  const startDate = new Date(start.y, start.m - 1, start.d)
  let cursor = new Date(from.y, from.m - 1, from.d)
  if (cursor < startDate) cursor = startDate

  for (let i = 0; i < 800; i++) {
    const iso = toISO(cursor)
    if (rule.end_date && iso > rule.end_date) return null

    let matches = false
    if (rule.frequency === 'weekly') {
      matches = cursor.getDay() === startDate.getDay()
    } else if (rule.frequency === 'monthly') {
      const target = Math.min(rule.day_of_month ?? 1, daysInMonth(cursor.getFullYear(), cursor.getMonth() + 1))
      matches = cursor.getDate() === target
    } else {
      const target = Math.min(start.d, daysInMonth(cursor.getFullYear(), cursor.getMonth() + 1))
      matches = cursor.getMonth() + 1 === start.m && cursor.getDate() === target
    }
    if (matches) return iso
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
  }
  return null
}

export function formatNext(rule: RecurringRule): string {
  if (!rule.active) return 'Pausado'
  const next = nextOccurrence(rule)
  return next ? `Próximo: ${formatDate(next)}` : 'Finalizado'
}
