import { useMemo, useState } from 'react'
import { MoneyField } from '@/components/ui/MoneyField'
import { TextField } from '@/components/ui/TextField'
import { useMoney } from '@/hooks/useMoney'
import { amountToInput, parseAmount, todayISO } from '@/lib/format'
import { addMonthsISO, simulateSavings } from '@/lib/simulator'

interface SavingsSimulatorProps {
  initialTarget?: number
  initialSaved?: number
  /** Fecha objetivo (YYYY-MM-DD) para comparar contra la proyección. */
  targetDate?: string | null
  initialMonthly?: number
}

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return `${MONTH_NAMES[(m ?? 1) - 1] ?? ''} de ${y ?? ''}`
}

function monthsBetween(fromISO: string, toISO: string): number {
  const [fy, fm] = fromISO.split('-').map(Number)
  const [ty, tm] = toISO.split('-').map(Number)
  return ((ty ?? 0) - (fy ?? 0)) * 12 + ((tm ?? 1) - (fm ?? 1))
}

function duration(months: number): string {
  const years = Math.floor(months / 12)
  const rest = months % 12
  const parts: string[] = []
  if (years > 0) parts.push(`${years} año${years === 1 ? '' : 's'}`)
  if (rest > 0 || years === 0) parts.push(`${rest} mes${rest === 1 ? '' : 'es'}`)
  return parts.join(' y ')
}

function parsePercent(text: string): number {
  const value = Number(text.replace(',', '.'))
  return Number.isFinite(value) && value >= 0 ? Math.min(value, 50) : 0
}

export function SavingsSimulator({
  initialTarget,
  initialSaved,
  targetDate,
  initialMonthly,
}: SavingsSimulatorProps) {
  const { money } = useMoney()
  const [target, setTarget] = useState(initialTarget ? amountToInput(initialTarget) : '')
  const [saved, setSaved] = useState(initialSaved ? amountToInput(initialSaved) : '')
  const [monthly, setMonthly] = useState(initialMonthly ? amountToInput(Math.round(initialMonthly)) : '')
  const [returnPct, setReturnPct] = useState('0')

  const result = useMemo(() => {
    const t = parseAmount(target)
    const m = parseAmount(monthly)
    if (t === null || t <= 0 || m === null || m < 0) return null
    return {
      target: t,
      sim: simulateSavings({
        target: t,
        saved: parseAmount(saved) ?? 0,
        monthly: m,
        annualReturnPercent: parsePercent(returnPct),
      }),
    }
  }, [target, saved, monthly, returnPct])

  const today = todayISO()
  const arrival = result?.sim.months != null ? addMonthsISO(today, result.sim.months) : null
  const deadlineMonths = targetDate ? monthsBetween(today, targetDate) : null
  const diff = result?.sim.months != null && deadlineMonths !== null ? deadlineMonths - result.sim.months : null

  const path = result?.sim.path ?? []
  const maxY = Math.max(result?.target ?? 1, ...path, 1)
  const points = path
    .map((v, i) => {
      const x = path.length > 1 ? (i / (path.length - 1)) * 100 : 0
      const y = 40 - (Math.min(v, maxY) / maxY) * 38
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  const targetY = result ? 40 - (result.target / maxY) * 38 : 0

  return (
    <div className="space-y-4">
      <MoneyField label="Monto objetivo" name="sim-target" value={target} onChange={setTarget} />
      <MoneyField label="Lo que ya llevas ahorrado" name="sim-saved" value={saved} onChange={setSaved} />
      <MoneyField label="Aporte mensual" name="sim-monthly" value={monthly} onChange={setMonthly} />
      <TextField
        label="Rentabilidad anual esperada (%)"
        name="sim-return"
        inputMode="decimal"
        placeholder="0"
        value={returnPct}
        onChange={setReturnPct}
      />
      <p className="-mt-2 text-xs text-muted">
        Déjalo en 0 si guardas el dinero sin invertirlo. Es una estimación, no una promesa de rentabilidad.
      </p>

      <div className="rounded-2xl border border-line bg-canvas p-4" aria-live="polite">
        {!result ? (
          <p className="text-sm text-muted">Completa el monto objetivo y tu aporte mensual para ver la proyección.</p>
        ) : result.sim.months === null ? (
          <p className="text-sm font-medium text-danger">
            Con ese aporte no se alcanza el objetivo en 50 años. Prueba aumentando el aporte mensual.
          </p>
        ) : result.sim.months === 0 ? (
          <p className="text-sm font-semibold text-heading">¡Ya alcanzaste este objetivo!</p>
        ) : (
          <>
            <p className="text-sm text-muted">Llegarías a tu objetivo en</p>
            <p className="text-2xl font-bold text-heading">{duration(result.sim.months)}</p>
            {arrival && <p className="text-sm text-muted">Aproximadamente en {monthLabel(arrival)}</p>}

            {diff !== null && (
              <p
                className={`mt-2 text-sm font-medium ${
                  diff >= 0 ? 'text-link' : 'text-danger'
                }`}
              >
                {diff >= 0
                  ? `Llegas ${diff === 0 ? 'justo a tiempo' : `${diff} mes${diff === 1 ? '' : 'es'} antes`} de tu fecha objetivo.`
                  : `Llegas ${-diff} mes${diff === -1 ? '' : 'es'} después de tu fecha objetivo.`}
              </p>
            )}

            <svg viewBox="0 0 100 42" preserveAspectRatio="none" className="mt-3 h-20 w-full" aria-hidden="true">
              <line
                x1="0"
                x2="100"
                y1={targetY}
                y2={targetY}
                stroke="var(--color-muted)"
                strokeDasharray="2 2"
                strokeWidth="0.6"
              />
              <polyline
                points={points}
                fill="none"
                stroke="#10b981"
                strokeWidth="1.6"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <dt className="text-[11px] text-muted">Aportado</dt>
                <dd className="text-sm font-semibold text-ink">{money(result.sim.contributed)}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted">Rentabilidad</dt>
                <dd className="text-sm font-semibold text-ink">{money(result.sim.interest)}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted">Saldo final</dt>
                <dd className="text-sm font-semibold text-ink">{money(result.sim.finalBalance)}</dd>
              </div>
            </dl>
          </>
        )}
      </div>
    </div>
  )
}
