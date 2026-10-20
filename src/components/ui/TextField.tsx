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
    <div className="fx-field">
      <label htmlFor={id} className="fx-label">
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
          className={`fx-input ${isPassword ? 'pr-12' : ''}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute inset-y-0 right-1 my-auto flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-mute hover:text-ink"
          >
            <Icon path={visible ? EYE_OFF : EYE} className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="fx-error">
          {error}
        </p>
      )}
    </div>
  )
}
