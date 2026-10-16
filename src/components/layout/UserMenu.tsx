import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { signOut } from '@/lib/auth'
import { useSettings } from '@/lib/settings'

const LOGOUT_ICON = 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.slice(0, 2).map((p) => p[0] ?? '')
  return letters.join('').toUpperCase() || 'U'
}

export function UserMenu() {
  const { name } = useSettings()
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
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={loading}
            className="mt-2 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-brand-50 disabled:opacity-60"
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
