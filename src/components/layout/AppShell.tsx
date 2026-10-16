import { NavLink, Outlet } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { NAV_ITEMS } from '@/lib/navigation'

export function AppShell() {
  return (
    <div className="flex h-full">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface p-4 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2 pt-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            C
          </span>
          <span className="text-xl font-semibold tracking-tight">Cashly</span>
        </div>
        <nav aria-label="Principal" className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-muted hover:bg-canvas hover:text-ink'
                }`
              }
            >
              <Icon path={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto pb-24 md:pb-0">
        <div className="mx-auto max-w-5xl p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-line bg-surface px-2 py-2 md:hidden"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-[11px] font-medium ${
                isActive ? 'text-brand-600' : 'text-muted'
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
