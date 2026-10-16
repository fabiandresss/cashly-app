import { useMoney } from '@/hooks/useMoney'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'


const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-line)',
  borderRadius: 12,
  color: 'var(--color-ink)',
  boxShadow: 'var(--shadow-lift)',
}
const labelStyle = { color: 'var(--color-heading)', fontWeight: 600 }
const axisTick = { fill: 'var(--color-muted)', fontSize: 12 }

// ---------- Dona ----------

export interface DonutDatum {
  name: string
  value: number
  color: string
}

export function DonutChart({ data, centerLabel, centerValue }: { data: readonly DonutDatum[]; centerLabel: string; centerValue: string }) {
  const { money } = useMoney()
  return (
    <div className="relative h-56 w-full" role="img" aria-label={`Distribución por categoría. ${centerLabel}: ${centerValue}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={[...data]}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [money(Number(value ?? 0)), String(name)]}
            contentStyle={tooltipStyle}
            labelStyle={labelStyle}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs text-muted">{centerLabel}</span>
        <span className="text-lg font-bold text-heading">{centerValue}</span>
      </div>
    </div>
  )
}

// ---------- Balance acumulado ----------

export function BalanceChart({ data }: { data: readonly { label: string; balance: number }[] }) {
  const { money, tick } = useMoney()
  return (
    <div className="h-64 w-full" role="img" aria-label="Evolución del saldo acumulado">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={[...data]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v: number) => tick(v)}
            tick={axisTick}
          />
          <Tooltip
            formatter={(value) => [money(Number(value ?? 0)), 'Saldo']}
            contentStyle={tooltipStyle}
            labelStyle={labelStyle}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#balanceFill)"
            dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ---------- Gasto por día de la semana ----------

export function WeekdayChart({ data }: { data: readonly { label: string; total: number }[] }) {
  const { money, tick } = useMoney()
  const max = Math.max(...data.map((d) => d.total), 0)
  return (
    <div className="h-64 w-full" role="img" aria-label="Gasto total por día de la semana">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={[...data]} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v: number) => tick(v)}
            tick={axisTick}
          />
          <Tooltip
            cursor={{ fill: 'var(--color-brand-50)' }}
            formatter={(value) => [money(Number(value ?? 0)), 'Gastado']}
            contentStyle={tooltipStyle}
            labelStyle={labelStyle}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={36}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.total === max && max > 0 ? '#10b981' : '#6ee7b7'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
