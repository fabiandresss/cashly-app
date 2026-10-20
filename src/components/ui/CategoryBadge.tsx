import { Icon } from '@/components/ui/Icon'
import { iconPath } from '@/lib/categoryIcons'

interface CategoryBadgeProps {
  /** Clave del ícono; undefined para "Sin categoría". */
  icon?: string | undefined
  color?: string | undefined
  className?: string
  iconClassName?: string
}

/** Chip blanco con el ícono de la categoría en su color (monocromo salvo el glifo). */
export function CategoryBadge({ icon, color, className = 'h-10 w-10', iconClassName = 'h-5 w-5' }: CategoryBadgeProps) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl bg-[var(--chip)] shadow-card ${className}`}
      style={color ? { color } : { color: 'var(--ink-2)' }}
      aria-hidden="true"
    >
      <Icon path={iconPath(icon ?? 'tag')} className={iconClassName} />
    </span>
  )
}
