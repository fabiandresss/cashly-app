import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatMoney } from '@/lib/format'
import type { MonthPoint } from '@/lib/dashboard'

const INCOME_COLOR = '#10b981'
const EXPENSE_COLOR = '#f59e0b'

const compact = new Intl.NumberFormat('es-CL', { notation: 'compact', maximumFractionDigits: 1 })

interface EvolutionChartProps {
  data: readonly MonthPoint[]
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

export function EvolutionChart({ data }: EvolutionChartProps) {
  return (
    <div>
      <div className="mb-3 flex gap-4">
        <LegendItem color={INCOME_COLOR} label="Ingresos" />
        <LegendItem color={EXPENSE_COLOR} label="Gastos" />
      </div>
      <div className="h-64 w-full" role="img" aria-label="Gráfico de ingresos y gastos de los últimos 6 meses">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[...data]} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid vertical={false} stroke="var(--color-line)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--color-muted)', fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(value: number) => compact.format(value)}
              tick={{ fill: 'var(--color-muted)', fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: 'var(--color-brand-50)' }}
              formatter={(value, name) => [formatMoney(Number(value ?? 0)), name === 'income' ? 'Ingresos' : 'Gastos']}
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-line)',
                borderRadius: 12,
                color: 'var(--color-ink)',
                boxShadow: 'var(--shadow-lift)',
              }}
              labelStyle={{ color: 'var(--color-heading)', fontWeight: 600 }}
            />
            <Bar dataKey="income" fill={INCOME_COLOR} radius={[6, 6, 0, 0]} maxBarSize={28} />
            <Bar dataKey="expense" fill={EXPENSE_COLOR} radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
