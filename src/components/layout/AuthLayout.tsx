import type { ReactNode } from 'react'
import { LogoFull } from '@/components/ui/Logo'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

const HIGHLIGHTS = [
  'Registra ingresos y gastos en segundos',
  'Presupuestos con alertas de cumplimiento',
  'Un asistente que entiende tus finanzas',
]

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-full lg:grid-cols-2">
      <aside className="relative m-4 hidden flex-col justify-between overflow-hidden rounded-[var(--r-xl)] p-12 text-white lg:flex" style={{ background: 'var(--auth-gradient)' }}>
        <div className="relative">
          <LogoFull variant="dark" className="h-14" />
        </div>

        <div className="relative max-w-md">
          <h2 className="fx-h1 !text-white">
            Tus finanzas, <span className="text-white/60">claras y bajo control.</span>
          </h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((text) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/90">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
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
          <h1 className="fx-h1">{title}</h1>
          <p className="fx-lead mt-2">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-muted">{footer}</div>}
        </div>
      </main>
    </div>
  )
}
