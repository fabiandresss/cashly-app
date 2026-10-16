import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { UserMenu } from '@/components/layout/UserMenu'
import { Icon } from '@/components/ui/Icon'
import { LogoFull, LogoMark } from '@/components/ui/Logo'
import { NAV_ITEMS } from '@/lib/navigation'
import { useAuth } from '@/lib/auth-context'

export function AppShell() {
  const { displayName: name } = useAuth()
  const fixedHeight = useLocation().pathname === '/asistente'
  return (
    <div className="flex h-full">
      <aside className="relative hidden w-72 shrink-0 flex-col overflow-hidden bg-gradient-to-b from-brand-900 via-brand-900 to-brand-950 p-5 text-white md:flex">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-brand-400/10 blur-3xl" />

        <div className="relative mb-10 px-2 pt-2">
          <LogoFull variant="dark" className="h-14" />
        </div>

        <nav aria-label="Principal" className="relative flex flex-col gap-1.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]'
                    : 'text-white/90 hover:translate-x-1 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      isActive ? 'bg-brand-500 text-white shadow-glow' : 'bg-white/10 group-hover:bg-white/15'
                    }`}
                  >
                    <Icon path={item.icon} className="h-[18px] w-[18px]" />
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="relative mt-auto rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse-ring rounded-full bg-brand-400" />
            <p className="text-sm font-medium">Modo desarrollo</p>
          </div>
          <p className="mt-1 text-xs text-white/90">
            Backend y autenticación se conectan en la fase 2.
          </p>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden pb-28 md:pb-0">
        <div className="z-10 flex shrink-0 items-center justify-between border-b border-line bg-canvas/80 px-5 py-3 backdrop-blur md:px-10">
          <div className="flex items-center gap-2.5 md:hidden">
            <LogoMark className="h-8 w-8 rounded-[10px]" />
            <span className="text-lg font-semibold tracking-tight text-heading">Cashly</span>
          </div>
          <p className="hidden text-sm text-muted md:block">
            Hola, <span className="font-semibold text-heading">{name}</span>
          </p>
          <UserMenu />
        </div>
        {/* El asistente ocupa exactamente el espacio disponible; el resto de páginas se desplaza. */}
        <div className={`min-h-0 flex-1 ${fixedHeight ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <div className={`mx-auto max-w-6xl p-5 md:p-10 ${fixedHeight ? 'h-full' : ''}`}>
            <Outlet />
          </div>
        </div>
      </main>

      <nav
        aria-label="Principal"
        className="fixed inset-x-3 bottom-3 z-10 flex justify-around rounded-2xl border border-white/10 bg-brand-900/95 px-2 py-2 shadow-lift backdrop-blur md:hidden"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium transition-colors ${
                isActive ? 'bg-brand-500/20 text-brand-300' : 'text-white/85'
              }`
            }
          >
            <Icon path={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
