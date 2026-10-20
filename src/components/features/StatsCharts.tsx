import { useMoney } from '@/hooks/useMoney'
import {
  Area,
  AreaChart,
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
  background: 'var(--surface)',
  border: 'none',
  borderRadius: 14,
  color: 'var(--ink)',
  boxShadow: 'var(--shadow-2)',
  fontSize: 13,
}
const labelStyle = { color: 'var(--ink-2)', fontFamily: 'var(--font-mono)', fontSize: 10.5, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }
const axisTick = { fill: 'var(--ink-3)', fontSize: 10.5, fontFamily: 'var(--font-mono)' }

// ---------- Dona ----------

export interface DonutDatum {
  name: string
  value: number
  color: string
}

export function DonutChart({ data, centerLabel, centerValue }: { data: readonly DonutDatum[]; centerLabel: string; centerValue: string }) {
  const { money } = useMoney()
  return (
    <div className="relative h-56 w-full min-w-0" role="img" aria-label={`Distribución por categoría. ${centerLabel}: ${centerValue}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={[...data]}
            dataKey="value"
            nameKey="name"
            innerRadius="70%"
            outerRadius="94%"
            paddingAngle={2}
            cornerRadius={6}
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
        <span className="fx-eyebrow">{centerLabel}</span>
        <span className="fx-num mt-1 text-xl font-semibold tracking-tight text-ink">{centerValue}</span>
      </div>
    </div>
  )
}

// ---------- Balance acumulado ----------

export function BalanceChart({ data }: { data: readonly { label: string; balance: number }[] }) {
  const { money, tick } = useMoney()
  return (
    <div className="h-64 w-full min-w-0" role="img" aria-label="Evolución del saldo acumulado">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={[...data]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#00bb77" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#00bb77" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v: number) => tick(v)}
            tick={axisTick}
          />
          <Tooltip
            cursor={{ stroke: 'var(--ink)', strokeWidth: 1.5 }}
            formatter={(value) => [money(Number(value ?? 0)), 'Saldo']}
            contentStyle={tooltipStyle}
            labelStyle={labelStyle}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="var(--ink)"
            strokeWidth={2}
            fill="url(#balanceFill)"
            dot={false}
            activeDot={{ r: 5, fill: 'var(--accent)', stroke: 'var(--surface)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
