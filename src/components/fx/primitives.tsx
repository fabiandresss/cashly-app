import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'
import { buttonClass, cx, type ButtonVariant } from '@/components/fx/utils'

interface FxButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'lg' | undefined
  block?: boolean
  mono?: boolean
  /** Path SVG del ícono (24x24). */
  icon?: string | undefined
  loading?: boolean
}

export function FxButton({
  variant = 'accent',
  size,
  block,
  mono,
  icon,
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: FxButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cx(buttonClass({ variant, size, block, mono }), className)}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
      ) : (
        icon && <Icon path={icon} className="h-[18px] w-[18px]" />
      )}
      {children}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string
  /** Texto accesible obligatorio: el botón no tiene texto visible. */
  label: string
  variant?: 'glass' | 'white' | 'ghost' | 'accent' | undefined
  size?: 'sm' | undefined
}

export function IconButton({ icon, label, variant, size, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx('fx-iconbtn', variant && `fx-iconbtn--${variant}`, size && `fx-iconbtn--${size}`, className)}
      {...rest}
    >
      <Icon path={icon} className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
    </button>
  )
}

export function Eyebrow({
  as: Tag = 'span',
  faint,
  className,
  children,
  ...rest
}: { as?: 'span' | 'p' | 'h2' | 'h3' | 'div'; faint?: boolean; className?: string; children: ReactNode } & HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={cx('fx-eyebrow', faint && 'fx-eyebrow--faint', className)} {...rest}>
      {children}
    </Tag>
  )
}

export function Chip({
  icon,
  variant,
  size,
  className,
  children,
}: {
  icon?: string | undefined
  variant?: 'accent' | 'warning' | 'danger' | undefined
  size?: 'sm' | undefined
  className?: string | undefined
  children: ReactNode
}) {
  return (
    <span className={cx('fx-chip', variant && `fx-chip--${variant}`, size && `fx-chip--${size}`, className)}>
      {icon && <Icon path={icon} className="h-3.5 w-3.5" />}
      {children}
    </span>
  )
}

/** Titular de dos tonos: primera parte en tinta, segunda en gris. */
export function MixedTitle({
  as: Tag = 'h1',
  strong,
  muted,
  className,
}: {
  as?: 'h1' | 'h2' | 'h3'
  strong: ReactNode
  muted?: ReactNode
  className?: string
}) {
  return (
    <Tag className={cx(Tag === 'h1' ? 'fx-h1' : 'fx-h2', 'fx-title-mixed', className)}>
      {strong} {muted && <span className="fx-muted">{muted}</span>}
    </Tag>
  )
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const letters =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0] ?? '')
      .join('')
      .toUpperCase() || 'U'
  return (
    <span className={cx('fx-avatar', className)} aria-hidden="true">
      {letters}
    </span>
  )
}

interface FxCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  as?: 'section' | 'article' | 'div'
  soft?: boolean
  raised?: boolean
  xl?: boolean
  title?: ReactNode
  sub?: ReactNode
  action?: ReactNode
}

export function FxCard({ as: Tag = 'section', soft, raised, xl, title, sub, action, className, children, ...rest }: FxCardProps) {
  return (
    <Tag className={cx('fx-card', soft && 'fx-card--soft', raised && 'fx-card--raised', xl && 'fx-card--xl', className)} {...rest}>
      {(title || action) && (
        <header className="fx-card__head">
          <div className="min-w-0">
            {title && <h2 className="fx-card__title">{title}</h2>}
            {sub && <p className="fx-eyebrow fx-card__sub">{sub}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </Tag>
  )
}
