// Utilidades del kit (fuera de los archivos de componentes para no romper Fast Refresh).

/** Une clases ignorando valores vacíos. */
export const cx = (...classes: (string | false | null | undefined)[]): string => classes.filter(Boolean).join(' ')

export type ButtonVariant = 'primary' | 'accent' | 'soft' | 'white' | 'ghost' | 'danger' | 'link' | 'glass'

/** Clases de botón píldora del kit, para usar también en <Link>. */
export function buttonClass({
  variant = 'accent',
  size,
  block,
  mono,
}: { variant?: ButtonVariant; size?: 'sm' | 'lg' | undefined; block?: boolean | undefined; mono?: boolean | undefined } = {}): string {
  return cx('fx-btn', `fx-btn--${variant}`, size && `fx-btn--${size}`, block && 'fx-btn--block', mono && 'fx-btn--mono')
}

const integerFormat = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 })

export function splitMoney(amount: number): { sign: string; int: string; cents: string } {
  const abs = Math.abs(amount)
  const [int = '0', cents = '00'] = abs.toFixed(2).split('.')
  return { sign: amount < 0 ? '−' : '', int: integerFormat.format(Number(int)), cents }
}

