import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { UserMenu } from '@/components/layout/UserMenu'
import { Dock, FxButton, IconButton, SideRail, TopNav } from '@/components/fx'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { LogoMark } from '@/components/ui/Logo'
import { NAV_ITEMS } from '@/lib/navigation'
import { signOut } from '@/lib/auth'
import { generateMyRecurring } from '@/lib/data'
import { useSettings } from '@/lib/settings'

const EYE = 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z'
const EYE_OFF =
  'M3 3l18 18M10.6 6.2A9.8 9.8 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.2 3.9M6.1 7.6A17 17 0 002 12s4 7 10 7a9.6 9.6 0 004-.9'
const LOGOUT = 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9'
const MORE = 'M5 12h.01M12 12h.01M19 12h.01'

/** Secciones de la barra superior en escritorio (el riel lateral las tiene todas). */
const TOP_ITEMS = NAV_ITEMS.filter((item) =>
  ['/', '/movimientos', '/presupuestos', '/estadisticas', '/asistente'].includes(item.to),
)

function PrivacyToggle() {
  const { privacy, setPrivacy } = useSettings()
  return (
    <IconButton
      icon={privacy ? EYE_OFF : EYE}
      label={privacy ? 'Mostrar montos' : 'Ocultar montos'}
      variant="white"
      aria-pressed={privacy}
      onClick={() => setPrivacy(!privacy)}
    />
  )
}

function useSignOut() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function run() {
    setLoading(true)
    setError(null)
    try {
      await signOut()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar la sesión.')
      setLoading(false)
    }
  }
  return { loading, error, run }
}

function RailSignOut() {
  const { loading, run } = useSignOut()
  return (
    <button
      type="button"
      onClick={() => void run()}
      disabled={loading}
      aria-label="Cerrar sesión"
      className="fx-rail__item disabled:opacity-60"
    >
      <Icon path={LOGOUT} className="h-5 w-5" />
      <span className="fx-rail__tip" aria-hidden="true">
        Cerrar sesión
      </span>
    </button>
  )
}

function MoreSheet({ onClose }: { onClose: () => void }) {
  const { loading, error, run } = useSignOut()
  const more = NAV_ITEMS.filter((item) => item.mobile === false)
  return (
    <Modal title="Más opciones" onClose={onClose}>
      <div className="fx-grid-2">
        {more.map((item) => (
          <NavLink key={item.to} to={item.to} onClick={onClose} className="fx-stat min-h-24 no-underline">
            {({ isActive }) => (
              <>
                <span
                  className="fx-stat__icon"
                  style={isActive ? { background: 'var(--accent)', color: 'var(--accent-ink)' } : undefined}
                >
                  <Icon path={item.icon} className="h-3.5 w-3.5" />
                </span>
                <span className="text-[15px] font-semibold tracking-tight text-ink">
                  {item.label}
                  {isActive && <span className="sr-only"> (actual)</span>}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      <FxButton variant="soft" block className="mt-4" icon={LOGOUT} loading={loading} onClick={() => void run()}>
        Cerrar sesión
      </FxButton>
      {error && <p className="fx-error mt-2">{error}</p>}
    </Modal>
  )
}

function MobileDock() {
  const [moreOpen, setMoreOpen] = useState(false)
  const { pathname } = useLocation()
  const main = NAV_ITEMS.filter((item) => item.mobile !== false).map((item) => ({
    ...item,
    label: item.short ?? item.label,
  }))
  const moreActive = NAV_ITEMS.some((item) => item.mobile === false && pathname.startsWith(item.to))

  return (
    <>
      <Dock
        items={main}
        trailing={
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-label="Más opciones"
            aria-current={moreActive ? 'page' : undefined}
            className="fx-dock__item"
          >
            <Icon path={MORE} className="h-[19px] w-[19px]" />
            {moreActive && <span className="fx-dock__label">Más</span>}
          </button>
        }
      />
      {moreOpen && <MoreSheet onClose={() => setMoreOpen(false)} />}
    </>
  )
}

export function AppShell() {
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
      {/* Escritorio: riel de íconos circulares */}
      <aside className="hidden w-[92px] shrink-0 flex-col items-center gap-6 overflow-y-auto py-6 [scrollbar-width:none] md:flex">
        <NavLink to="/" aria-label="Cashly, ir al inicio" className="shrink-0">
          <LogoMark className="h-12 w-12" />
        </NavLink>
        <SideRail items={NAV_ITEMS} />
        <div className="mt-auto">
          <RailSignOut />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-10 flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-3 sm:px-6 md:px-8 md:pt-6">
          <NavLink to="/" className="fx-logo md:hidden" aria-label="Cashly, ir al inicio">
            <LogoMark className="h-9 w-9" />
            Cashly
          </NavLink>
          <TopNav items={TOP_ITEMS} className="hidden lg:inline-flex" />
          <span className="fx-logo hidden md:inline-flex lg:hidden">Cashly</span>
          <div className="flex items-center gap-2">
            <PrivacyToggle />
            <UserMenu />
          </div>
        </header>
        {/* El asistente ocupa exactamente el espacio disponible; el resto de páginas se desplaza. */}
        <div className={`min-h-0 flex-1 ${fixedHeight ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <div
            className={`mx-auto max-w-6xl px-4 pt-3 sm:px-6 md:px-8 md:pt-5 ${
              fixedHeight ? 'h-full pb-24 md:pb-6' : 'pb-28 md:pb-12'
            }`}
          >
            {ready ? (
              <Outlet />
            ) : (
              <div className="flex justify-center py-24">
                <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-mute border-t-ink" />
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileDock />
    </div>
  )
}
