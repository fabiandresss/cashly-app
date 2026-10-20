import type { ButtonHTMLAttributes } from 'react'
import { FxButton, type ButtonVariant } from '@/components/fx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: ButtonVariant
}

/** Botón principal de formularios: píldora a todo el ancho con el acento de marca. */
export function Button({ loading = false, variant = 'accent', children, type = 'submit', ...rest }: ButtonProps) {
  return (
    <FxButton type={type} variant={variant} size="lg" block loading={loading} {...rest}>
      {children}
    </FxButton>
  )
}
