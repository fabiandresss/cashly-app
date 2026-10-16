import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { MoneyField } from '@/components/ui/MoneyField'
import { TextField } from '@/components/ui/TextField'
import { parseAmount, todayISO } from '@/lib/format'

interface ContributionFormProps {
  /** Monto máximo que se puede retirar (lo ahorrado hasta ahora). */
  available: number
  onSubmit: (amount: number, note: string | null, date: string) => Promise<void>
}

export function ContributionForm({ available, onSubmit }: ContributionFormProps) {
  const [mode, setMode] = useState<'add' | 'withdraw'>('add')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayISO())
  const [error, setError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    const parsed = parseAmount(amount)
    if (parsed === null || parsed <= 0) {
      setError('Ingresa un monto mayor a 0.')
      return
    }
    if (mode === 'withdraw' && parsed > available) {
      setError('No puedes retirar más de lo que has ahorrado en esta meta.')
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setFormError('Selecciona una fecha válida.')
      return
    }
    setError(undefined)

    setLoading(true)
    try {
      await onSubmit(mode === 'add' ? parsed : -parsed, note.trim() || null, date)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el movimiento.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <Alert tone="error">{formError}</Alert>}
      <div role="radiogroup" aria-label="Operación" className="grid grid-cols-2 gap-1 rounded-xl bg-canvas p-1">
        {(
          [
            ['add', 'Aportar'],
            ['withdraw', 'Retirar'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => setMode(value)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              mode === value ? 'bg-surface text-heading shadow-card' : 'text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <MoneyField label="Monto" name="amount" value={amount} onChange={setAmount} error={error} />
      <TextField label="Fecha" name="date" type="date" value={date} onChange={setDate} />
      <TextField
        label="Nota (opcional)"
        name="note"
        placeholder="Ej: Aporte de octubre"
        maxLength={100}
        value={note}
        onChange={setNote}
      />
      <Button type="submit" loading={loading}>
        {mode === 'add' ? 'Registrar aporte' : 'Registrar retiro'}
      </Button>
    </form>
  )
}
