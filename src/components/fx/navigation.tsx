import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { cx } from '@/components/fx/utils'

export interface FxNavItem {
  to: string
  label: string
  icon: string
}

/** Dock flotante en píldora (móvil): el ítem activo se expande con etiqueta mono + punto. */
export function Dock({ items, trailing }: { items: readonly FxNavItem[]; trailing?: ReactNode }) {
  return (
    <nav className="fx-dock md:hidden" aria-label="Principal">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.to === '/'} className="fx-dock__item" aria-label={it.label}>
          {({ isActive }) => (
            <>
              <Icon path={it.icon} className="h-[19px] w-[19px]" />
              {isActive && <span className="fx-dock__label">{it.label}</span>}
            </>
          )}
        </NavLink>
      ))}
      {trailing}
    </nav>
  )
}

/** Navegación superior en píldora (escritorio). */
export function TopNav({ items, className }: { items: readonly FxNavItem[]; className?: string }) {
  return (
    <nav className={cx('fx-topnav', className)} aria-label="Secciones">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.to === '/'}>
          {it.label}
        </NavLink>
      ))}
    </nav>
  )
}

/** Riel lateral de íconos circulares (escritorio), con nombre visible al pasar o enfocar. */
export function SideRail({ items, footer }: { items: readonly FxNavItem[]; footer?: ReactNode }) {
  return (
    <nav className="fx-rail" aria-label="Menú lateral">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.to === '/'} className="fx-rail__item" aria-label={it.label}>
          <Icon path={it.icon} className="h-5 w-5" />
          <span className="fx-rail__tip" aria-hidden="true">
            {it.label}
          </span>
        </NavLink>
      ))}
      {footer}
    </nav>
  )
}
