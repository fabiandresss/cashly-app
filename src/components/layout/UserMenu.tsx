import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { signOut } from '@/lib/auth'
import { useAuth } from '@/lib/auth-context'

const SETTINGS = 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z'
const LOGOUT_ICON = 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.slice(0, 2).map((p) => p[0] ?? '')
  return letters.join('').toUpperCase() || 'U'
}

export function UserMenu() {
  const { displayName: name, user } = useAuth()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function handleSignOut() {
    setLoading(true)
    setError(null)
    try {
      await signOut()
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar la sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          setError(null)
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menú de usuario"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-sm font-semibold text-white shadow-card ring-2 ring-surface transition-transform hover:scale-105"
      >
        {initials(name)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-20 w-64 animate-fade-up rounded-2xl border border-line bg-surface p-2 shadow-lift"
        >
          <div className="border-b border-line px-3 pb-2 pt-1.5">
            <p className="truncate text-sm font-semibold text-heading">{name}</p>
            {user?.email && <p className="truncate text-xs text-muted">{user.email}</p>}
          </div>
          <Link
            to="/configuracion"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-2 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-brand-50"
          >
            <Icon path={SETTINGS} className="h-[18px] w-[18px]" />
            Configuración
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={loading}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-brand-50 disabled:opacity-60"
          >
            <Icon path={LOGOUT_ICON} className="h-[18px] w-[18px]" />
            Cerrar sesión
          </button>
          {error && <p className="px-3 pb-2 pt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
      )}
    </div>
  )
}
