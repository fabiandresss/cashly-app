import { useId, useState, type InputHTMLAttributes } from 'react'
import { Icon } from '@/components/ui/Icon'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string | undefined
}

const EYE = 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z'
const EYE_OFF = 'M3 3l18 18M10.6 6.2A9.8 9.8 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.2 3.9M6.1 7.6A17 17 0 002 12s4 7 10 7a9.6 9.6 0 004-.9'

export function TextField({ label, value, onChange, error, type = 'text', ...rest }: TextFieldProps) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-heading">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-xl border bg-surface px-3.5 py-3 text-sm text-ink shadow-sm outline-none transition-all placeholder:text-muted/75 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 ${
            error ? 'border-red-400' : 'border-line'
          } ${isPassword ? 'pr-11' : ''}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted transition-colors hover:text-link"
          >
            <Icon path={visible ? EYE_OFF : EYE} className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
