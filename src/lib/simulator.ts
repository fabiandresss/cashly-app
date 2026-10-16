export interface SimulationInput {
  /** Monto objetivo. */
  target: number
  /** Lo que ya está ahorrado. */
  saved: number
  /** Aporte mensual. */
  monthly: number
  /** Rentabilidad anual esperada en porcentaje (0 = sin rentabilidad). */
  annualReturnPercent: number
}

export interface SimulationResult {
  /** Meses hasta llegar a la meta; null si no se llega en el plazo máximo. */
  months: number | null
  /** Saldo final al terminar la simulación. */
  finalBalance: number
  /** Total aportado durante el período. */
  contributed: number
  /** Ganancia estimada por rentabilidad. */
  interest: number
  /** Trayectoria mensual del saldo (para mostrar un gráfico simple). */
  path: number[]
}

const MAX_MONTHS = 600

export function simulateSavings({ target, saved, monthly, annualReturnPercent }: SimulationInput): SimulationResult {
  const monthlyRate = annualReturnPercent > 0 ? (1 + annualReturnPercent / 100) ** (1 / 12) - 1 : 0
  let balance = saved
  const path: number[] = [balance]

  if (balance >= target) {
    return { months: 0, finalBalance: balance, contributed: 0, interest: 0, path }
  }
  if (monthly <= 0 && monthlyRate <= 0) {
    return { months: null, finalBalance: balance, contributed: 0, interest: 0, path }
  }

  let months = 0
  while (balance < target && months < MAX_MONTHS) {
    balance = balance * (1 + monthlyRate) + monthly
    months += 1
    path.push(balance)
  }

  const reached = balance >= target
  const contributed = monthly * months
  return {
    months: reached ? months : null,
    finalBalance: balance,
    contributed,
    interest: Math.max(0, balance - saved - contributed),
    path,
  }
}

/** Fecha estimada (YYYY-MM) sumando `months` meses al mes de `fromISO`. */
export function addMonthsISO(fromISO: string, months: number): string {
  const [y, m] = fromISO.split('-').map(Number)
  const index = (y ?? 0) * 12 + ((m ?? 1) - 1) + months
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}
