import type { ReactNode } from 'react'
import { LogoFull } from '@/components/ui/Logo'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

const HIGHLIGHTS = [
  'Registra ingresos y gastos en segundos',
  'Presupuestos con alertas de cumplimiento',
  'Un asistente que entiende tus finanzas',
]

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-full lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand-400/10 blur-3xl" />

        <div className="relative">
          <LogoFull variant="dark" className="h-14" />
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Tus finanzas, claras y bajo control.
          </h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((text) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/90">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/25 text-brand-300">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/80">© Cashly</p>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 lg:hidden">
            <LogoFull className="h-14" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-heading">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-8 text-center text-sm text-muted">{footer}</div>
        </div>
      </main>
    </div>
  )
}
