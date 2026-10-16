import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'

const STATS = [
  { label: 'Saldo total', icon: 'M3 7h18v12H3zM3 7l3-3h12l3 3M16 13h2' },
  { label: 'Ingresos del mes', icon: 'M12 19V5M5 12l7-7 7 7' },
  { label: 'Gastos del mes', icon: 'M12 5v14M5 12l7 7 7-7' },
  { label: 'Ahorro', icon: 'M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z' },
] as const

export function DashboardPage() {
  return (
    <>
      <section className="relative mb-8 animate-fade-up overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-7 text-white shadow-lift md:p-10">
        <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-brand-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-32 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl" />
        <p className="relative text-sm font-medium text-brand-100">Bienvenido a Cashly</p>
        <h1 className="relative mt-2 max-w-xl text-3xl font-bold tracking-tight md:text-4xl">
          Tu dinero, claro y bajo control
        </h1>
        <p className="relative mt-3 max-w-lg text-sm text-brand-100/90">
          Cuando registres tus movimientos verás aquí tu saldo, tus gastos y tu evolución.
        </p>
      </section>

      <PageHeader title="Resumen" description="Indicadores principales de tu situación financiera." />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat, i) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value="—"
            hint="Sin datos todavía"
            icon={stat.icon}
            delay={100 + i * 90}
          />
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2" delay={500}>
          <h2 className="text-base font-semibold text-brand-900">Evolución financiera</h2>
          <p className="text-xs text-muted">Ingresos y gastos de los últimos meses</p>
          <div className="relative mt-5 flex h-56 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-brand-50 to-white">
            <svg viewBox="0 0 400 120" className="absolute inset-x-0 bottom-0 w-full" aria-hidden="true">
              <defs>
                <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 90 C60 70 90 100 150 60 S250 70 300 35 S370 45 400 25 V120 H0Z" fill="url(#area)" />
              <path
                d="M0 90 C60 70 90 100 150 60 S250 70 300 35 S370 45 400 25"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="600"
                className="animate-draw"
              />
            </svg>
            <p className="relative rounded-full bg-white/90 px-4 py-1.5 text-xs font-medium text-brand-800 shadow-card">
              El gráfico aparecerá al registrar movimientos
            </p>
          </div>
        </Card>

        <Card delay={590}>
          <h2 className="text-base font-semibold text-brand-900">Últimos movimientos</h2>
          <p className="text-xs text-muted">Tus transacciones recientes</p>
          <div className="mt-5 flex flex-col items-center rounded-xl border border-dashed border-brand-200 bg-brand-50/50 px-4 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Icon path="M12 5v14M5 12h14" />
            </span>
            <p className="mt-3 text-sm font-medium text-brand-900">Aún no hay movimientos</p>
            <p className="mt-1 text-xs text-muted">Podrás agregarlos en la fase 3.</p>
          </div>
        </Card>
      </div>
    </>
  )
}
