import { useId, type SelectHTMLAttributes } from 'react'

interface Option {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly Option[]
}

export function Select({ label, value, onChange, options, ...rest }: SelectProps) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-heading">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-sm text-ink shadow-sm outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
