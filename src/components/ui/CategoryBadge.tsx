import { Icon } from '@/components/ui/Icon'
import { iconPath } from '@/lib/categoryIcons'

interface CategoryBadgeProps {
  /** Clave del ícono; undefined para "Sin categoría". */
  icon?: string | undefined
  color?: string | undefined
  className?: string
  iconClassName?: string
}

export function CategoryBadge({
  icon,
  color = '#64748b',
  className = 'h-10 w-10',
  iconClassName = 'h-5 w-5',
}: CategoryBadgeProps) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${className}`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      <Icon path={iconPath(icon ?? 'tag')} className={iconClassName} />
    </span>
  )
}
