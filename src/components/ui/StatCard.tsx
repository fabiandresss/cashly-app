import type { CSSProperties } from 'react'
import { StatCard as FxStatCard } from '@/components/fx'

interface StatCardProps {
  label: string
  value: string
  hint: string
  icon: string
  delay?: number
  tone?: 'positive'
}

/** Resumen (KPI): sub-tarjeta gris con etiqueta mono, ícono en chip y cifra tabular. */
export function StatCard({ label, value, hint, icon, delay = 0, tone }: StatCardProps) {
  const style: CSSProperties = { animationDelay: `${delay}ms` }
  return (
    <div className="fx-enter min-w-0" style={style}>
      <FxStatCard label={label} value={value} sub={hint} icon={icon} className="h-full" {...(tone ? { tone } : {})} />
    </div>
  )
}
