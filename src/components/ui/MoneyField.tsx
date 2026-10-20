import { useId, useLayoutEffect, useRef, type ChangeEvent } from 'react'
import { formatMoneyInput } from '@/lib/format'

interface MoneyFieldProps {
  label: string
  /** Texto ya formateado (ej: "1.400.000"). */
  value: string
  onChange: (value: string) => void
  error?: string | undefined
  name?: string
}

/** Posición del cursor en `formatted` tras haber pasado `significant` caracteres (dígitos o coma). */
function caretFor(formatted: string, significant: number): number {
  if (significant <= 0) return 0
  let seen = 0
  for (let i = 0; i < formatted.length; i++) {
    if (/[\d,]/.test(formatted.charAt(i))) seen++
    if (seen === significant) return i + 1
  }
  return formatted.length
}

export function MoneyField({ label, value, onChange, error, name }: MoneyFieldProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const caretRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    if (caretRef.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(caretRef.current, caretRef.current)
      caretRef.current = null
    }
  }, [value])

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    const caret = e.target.selectionStart ?? raw.length
    const significantBeforeCaret = (raw.slice(0, caret).match(/[\d,]/g) ?? []).length
    const formatted = formatMoneyInput(raw)
    caretRef.current = caretFor(formatted, significantBeforeCaret)
    onChange(formatted)
  }

  return (
    <div className="fx-field">
      <label htmlFor={id} className="fx-label">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-end text-base font-medium text-faint">
          $
        </span>
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={value}
          onChange={handleChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="fx-input fx-input--money"
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="fx-error">
          {error}
        </p>
      )}
    </div>
  )
}
