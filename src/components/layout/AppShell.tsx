import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { UserMenu } from '@/components/layout/UserMenu'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { LogoFull, LogoMark } from '@/components/ui/Logo'
import { NAV_ITEMS } from '@/lib/navigation'
import { signOut } from '@/lib/auth'
import { useAuth } from '@/lib/auth-context'
import { generateMyRecurring } from '@/lib/data'
import { useSettings } from '@/lib/settings'

const EYE = 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z'
const EYE_OFF =
  'M3 3l18 18M10.6 6.2A9.8 9.8 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.2 3.9M6.1 7.6A17 17 0 002 12s4 7 10 7a9.6 9.6 0 004-.9'

function PrivacyToggle() {
  const { privacy, setPrivacy } = useSettings()
  return (
    <button
      type="button"
      onClick={() => setPrivacy(!privacy)}
      aria-pressed={privacy}
      aria-label={privacy ? 'Mostrar montos' : 'Ocultar montos'}
      title={privacy ? 'Mostrar montos' : 'Modo privacidad: ocultar montos'}
      className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
        privacy
          ? 'border-brand-500 bg-brand-50 text-link'
          : 'border-line bg-surface text-muted hover:text-ink'
      }`}
    >
      <Icon path={privacy ? EYE_OFF : EYE} className="h-[18px] w-[18px]" />
    </button>
  )
}

const LOGOUT = 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9'

function SignOutButton({ light = false }: { light?: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      await signOut()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar la sesión.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={loading}
        className={`flex w-full items-center justify-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${
          light
            ? 'border-line bg-canvas text-ink hover:bg-brand-50'
            : 'border-white/15 bg-white/10 text-white hover:bg-white/15'
        }`}
      >
        <Icon path={LOGOUT} className="h-[18px] w-[18px]" />
        {loading ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </button>
      {error && <p className={`mt-2 text-xs ${light ? 'text-red-600' : 'text-red-300'}`}>{error}</p>}
    </div>
  )
}

const MORE = 'M5 12h.01M12 12h.01M19 12h.01'

function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const { pathname } = useLocation()
  const main = NAV_ITEMS.filter((item) => item.mobile !== false)
  const more = NAV_ITEMS.filter((item) => item.mobile === false)
  const moreActive = more.some((item) => pathname.startsWith(item.to))

  return (
    <>
      <nav
        aria-label="Principal"
        className="fixed inset-x-3 bottom-3 z-10 flex gap-0.5 rounded-2xl border border-white/10 bg-brand-900/95 px-1 py-2 shadow-lift backdrop-blur md:hidden"
      >
        {main.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium transition-colors ${
                isActive ? 'bg-brand-500/20 text-brand-300' : 'text-white/85'
              }`
            }
          >
            <Icon path={item.icon} />
            <span className="max-w-full truncate">{item.short ?? item.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium transition-colors ${
            moreActive ? 'bg-brand-500/20 text-brand-300' : 'text-white/85'
          }`}
        >
          <Icon path={MORE} />
          Más
        </button>
      </nav>

      {moreOpen && (
        <Modal title="Más opciones" onClose={() => setMoreOpen(false)}>
          <div className="grid grid-cols-2 gap-3">
            {more.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-brand-500 bg-brand-50 text-link'
                      : 'border-line bg-canvas text-ink hover:bg-brand-50'
                  }`
                }
              >
                <Icon path={item.icon} className="h-6 w-6" />
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="mt-4">
            <SignOutButton light />
          </div>
        </Modal>
      )}
    </>
  )
}

export function AppShell() {
  const { displayName: name } = useAuth()
  const fixedHeight = useLocation().pathname === '/asistente'

  // Antes de mostrar las pantallas se registran los movimientos programados que ya correspondían.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let active = true
    generateMyRecurring()
      .catch(() => 0)
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="flex h-full">
      <aside className="relative hidden w-72 shrink-0 flex-col overflow-hidden bg-gradient-to-b from-brand-900 via-brand-900 to-brand-950 p-5 text-white md:flex">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-brand-400/10 blur-3xl" />

        <div className="relative mb-6 px-2 pt-1 [@media(max-height:760px)]:mb-4">
          <LogoFull variant="dark" className="h-14" />
        </div>

        <nav aria-label="Principal" className="relative -mx-1 flex min-h-0 flex-col gap-1 overflow-y-auto overflow-x-hidden px-1 [@media(max-height:760px)]:gap-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 [@media(max-height:760px)]:py-1.5 ${
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

        <div className="relative mt-auto shrink-0 pt-6 [@media(max-height:760px)]:pt-4">
          <SignOutButton />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden pb-28 md:pb-0">
        <div className="z-10 flex shrink-0 items-center justify-between border-b border-line bg-canvas/80 px-4 py-2.5 backdrop-blur sm:px-5 md:px-10 md:py-3">
          <div className="flex items-center gap-2.5 md:hidden">
            <LogoMark className="h-8 w-8 rounded-[10px]" />
            <span className="text-lg font-semibold tracking-tight text-heading">Cashly</span>
          </div>
          <p className="hidden text-sm text-muted md:block">
            Hola, <span className="font-semibold text-heading">{name}</span>
          </p>
          <div className="flex items-center gap-2">
            <PrivacyToggle />
            <UserMenu />
          </div>
        </div>
        {/* El asistente ocupa exactamente el espacio disponible; el resto de páginas se desplaza. */}
        <div className={`min-h-0 flex-1 ${fixedHeight ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <div className={`mx-auto max-w-6xl p-4 sm:p-5 md:p-10 ${fixedHeight ? 'h-full' : ''}`}>
            {ready ? (
              <Outlet />
            ) : (
              <div className="flex justify-center py-24">
                <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-500" />
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  )
}
