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
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-heading">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-sm font-medium text-muted">
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
          className={`w-full rounded-xl border bg-surface py-3 pl-9 pr-3.5 text-lg font-semibold tabular-nums text-ink shadow-sm outline-none transition-all placeholder:text-muted/60 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 ${
            error ? 'border-red-400' : 'border-line'
          }`}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
