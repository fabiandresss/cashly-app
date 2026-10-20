import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Eyebrow } from '@/components/fx/primitives'
import { cx, splitMoney } from '@/components/fx/utils'

/* ---------- Segmented ---------- */

export interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
}

interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  /** "tabs" (por defecto) usa role=tab; "radio" para elegir un valor de formulario. */
  role?: 'tabs' | 'radio'
  variant?: 'default' | 'plain' | 'glass'
  inline?: boolean
  className?: string
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  role = 'tabs',
  variant = 'default',
  inline,
  className,
}: SegmentedProps<T>) {
  const isRadio = role === 'radio'
  return (
    <div
      role={isRadio ? 'radiogroup' : 'tablist'}
      aria-label={label}
      className={cx(
        'fx-segmented',
        variant === 'plain' && 'fx-segmented--plain',
        variant === 'glass' && 'fx-segmented--glass',
        inline && 'fx-segmented--inline',
        className,
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role={isRadio ? 'radio' : 'tab'}
          aria-selected={isRadio ? undefined : value === o.value}
          aria-checked={isRadio ? value === o.value : undefined}
          className="fx-segmented__item"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- Balance: "$8.848.340" + ",00" en gris ---------- */

interface BalanceProps {
  amount: number
  /** Modo privacidad: oculta la cifra. */
  hidden?: boolean
  size?: 'md' | 'xl'
  showCents?: boolean
  className?: string
}

export function Balance({ amount, hidden, size, showCents = true, className }: BalanceProps) {
  const m = splitMoney(amount)
  return (
    <p className={cx('fx-balance', size && `fx-balance--${size}`, className)}>
      {hidden ? (
        <>$ ••••••</>
      ) : (
        <>
          {m.sign}${m.int}
          {showCents && <span className="fx-balance__cents">,{m.cents}</span>}
        </>
      )}
    </p>
  )
}

/* ---------- StatCard ---------- */

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone,
  className,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon?: string
  tone?: 'positive'
  className?: string
}) {
  return (
    <div className={cx('fx-stat', className)}>
      <div className="fx-stat__top">
        <Eyebrow>{label}</Eyebrow>
        {icon && (
          <span className="fx-stat__icon">
            <Icon path={icon} className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div>
        <p className="fx-stat__value" data-tone={tone}>
          {value}
        </p>
        {sub && <p className="fx-stat__sub">{sub}</p>}
      </div>
    </div>
  )
}

/* ---------- Gráfico de barras con cursor y tooltip ---------- */

function useBarCursor(count: number, initial: number | null) {
  const [index, setIndex] = useState<number | null>(initial)
  const ref = useRef<HTMLDivElement>(null)
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect || count === 0) return
    const x = e.clientX - rect.left
    setIndex(Math.min(count - 1, Math.max(0, Math.floor((x / rect.width) * count))))
  }
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') setIndex((v) => Math.min(count - 1, (v ?? -1) + 1))
    if (e.key === 'ArrowLeft') setIndex((v) => Math.max(0, (v ?? 1) - 1))
  }
  return { index, ref, onPointerMove, onKeyDown }
}

/** Posición horizontal del tooltip sin salirse del gráfico. */
function tipStyle(index: number, count: number) {
  const pct = ((index + 0.5) / count) * 100
  if (pct > 62) return { right: `${100 - pct}%`, transform: 'translateX(-6px)' }
  return { left: `${pct}%`, transform: 'translateX(6px)' }
}

interface BarChartProps {
  data: readonly number[]
  labels?: readonly string[]
  format: (value: number) => string
  /** Texto accesible que resume el gráfico. */
  label: string
  startLabel?: string
  endLabel?: string
  height?: number
  initial?: number | null
  /** Barras anchas (pocas categorías) en vez de textura densa. */
  wide?: boolean
}

export function BarChart({ data, labels = [], format, label, startLabel, endLabel, height = 140, initial = null, wide }: BarChartProps) {
  const max = Math.max(...data, 1)
  const peak = data.indexOf(Math.max(...data))
  const { index, ref, onPointerMove, onKeyDown } = useBarCursor(data.length, initial)
  const value = index === null ? undefined : data[index]
  return (
    <div>
      <div
        ref={ref}
        className={cx('fx-bars', wide && 'fx-bars--wide')}
        style={{ height }}
        role="img"
        aria-label={label}
        tabIndex={0}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerMove}
        onKeyDown={onKeyDown}
      >
        {data.map((v, k) => (
          <span
            key={k}
            className="fx-bars__bar"
            data-on={k === index}
            data-peak={k === peak && v > 0}
            style={{ height: `${Math.max(3, (v / max) * 100)}%` }}
          />
        ))}
        {index !== null && value !== undefined && (
          <>
            <span className="fx-bars__cursor" style={{ left: `${((index + 0.5) / data.length) * 100}%` }} />
            <span className="fx-bars__tip" style={tipStyle(index, data.length)}>
              {format(value)}
              {labels[index] && <small>{labels[index]}</small>}
            </span>
          </>
        )}
      </div>
      {(startLabel || endLabel) && (
        <div className="fx-bars__axis">
          <Eyebrow>{startLabel}</Eyebrow>
          <Eyebrow>{endLabel}</Eyebrow>
        </div>
      )}
    </div>
  )
}

/* ---------- Barras pareadas (ingresos vs. gastos) ---------- */

export interface PairPoint {
  label: string
  income: number
  expense: number
}

export function PairBars({
  data,
  format,
  label,
  height = 190,
}: {
  data: readonly PairPoint[]
  format: (value: number) => string
  label: string
  height?: number
}) {
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1)
  const { index, ref, onPointerMove, onKeyDown } = useBarCursor(data.length, data.length - 1)
  const current = index === null ? undefined : data[index]
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="fx-legend">
          <span className="fx-legend__item">
            <span className="fx-legend__dot fx-legend__dot--in" />
            <Eyebrow>Ingresos</Eyebrow>
          </span>
          <span className="fx-legend__item">
            <span className="fx-legend__dot" />
            <Eyebrow>Gastos</Eyebrow>
          </span>
        </div>
        {current && (
          <div className="text-right" aria-live="polite">
            <Eyebrow faint>{current.label}</Eyebrow>
            <p className="fx-num text-sm font-semibold text-positive">+{format(current.income)}</p>
            <p className="fx-num text-sm font-semibold text-ink">−{format(current.expense)}</p>
          </div>
        )}
      </div>
      <div
        ref={ref}
        className="fx-pairs"
        style={{ height }}
        role="img"
        aria-label={label}
        tabIndex={0}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerMove}
        onKeyDown={onKeyDown}
      >
        {data.map((d, k) => (
          <div key={d.label} className="fx-pairs__group" data-on={k === index}>
            <span className="fx-pairs__bar fx-pairs__bar--in" style={{ height: `${Math.max(3, (d.income / max) * 100)}%` }} />
            <span className="fx-pairs__bar fx-pairs__bar--out" style={{ height: `${Math.max(3, (d.expense / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="fx-pairs__axis" aria-hidden="true">
        {data.map((d) => (
          <span key={d.label} className="fx-eyebrow">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------- Progreso ---------- */

export function Progress({
  value,
  tone = 'ink',
  label,
}: {
  /** Fracción 0–1 (se recorta). */
  value: number
  tone?: 'ink' | 'accent' | 'warning' | 'danger'
  label: string
}) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100)
  return (
    <div className="fx-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div className="fx-progress__fill" data-tone={tone} style={{ width: `${pct}%` }} />
    </div>
  )
}

/* ---------- Listas ---------- */

export function List({
  variant = 'soft',
  className,
  children,
}: {
  variant?: 'soft' | 'flat' | 'rounded'
  className?: string
  children: ReactNode
}) {
  return <ul className={cx('fx-list', variant !== 'soft' && `fx-list--${variant}`, className)}>{children}</ul>
}

interface ListRowProps {
  /** Contenido del cuadro de la izquierda (ícono de categoría, avatar…). */
  media: ReactNode
  title: ReactNode
  sub?: ReactNode
  extra?: ReactNode
  /** Monto ya formateado; el signo "+" lo pinta como ingreso. */
  amount?: string
  sign?: '+' | '-'
  side?: ReactNode
  actions?: ReactNode
  circle?: boolean
}

export function ListRow({ media, title, sub, extra, amount, sign, side, actions, circle }: ListRowProps) {
  return (
    <li className="fx-row">
      <span className={cx('fx-row__icon', circle && 'fx-row__icon--circle')}>{media}</span>
      <div className="fx-row__body">
        <div className="fx-row__title">{title}</div>
        {sub && <div className="fx-row__sub">{sub}</div>}
        {extra && <div className="fx-row__sub">{extra}</div>}
      </div>
      {(amount || side) && (
        <div className="fx-row__side">
          {amount && (
            <div className="fx-row__amount" data-sign={sign}>
              {sign === '+' ? '+' : sign === '-' ? '−' : ''}
              {amount}
            </div>
          )}
          {side && <div className="fx-row__sub">{side}</div>}
        </div>
      )}
      {actions && <div className="fx-row__actions">{actions}</div>}
    </li>
  )
}

export function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div className="fx-group-label">
      <Eyebrow>{children}</Eyebrow>
    </div>
  )
}
