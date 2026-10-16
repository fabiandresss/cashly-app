import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { MoneyField } from '@/components/ui/MoneyField'
import { TextField } from '@/components/ui/TextField'
import { useMoney } from '@/hooks/useMoney'
import { amountToInput, parseAmount, todayISO } from '@/lib/format'

interface PayDebtFormProps {
  debtName: string
  /** Lo que falta por pagar. */
  remaining: number
  onSubmit: (amount: number, paidOn: string) => Promise<void>
}

export function PayDebtForm({ debtName, remaining, onSubmit }: PayDebtFormProps) {
  const { money } = useMoney()
  const [amount, setAmount] = useState(amountToInput(remaining))
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
    if (parsed > remaining) {
      setError(`No puedes pagar más de lo que falta (${money(remaining)}).`)
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setFormError('Selecciona una fecha válida.')
      return
    }
    setError(undefined)

    setLoading(true)
    try {
      await onSubmit(parsed, date)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo registrar el pago.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <Alert tone="error">{formError}</Alert>}
      <div className="rounded-xl bg-canvas px-4 py-3">
        <p className="text-xs text-muted">{debtName}</p>
        <p className="text-sm font-semibold text-heading">Falta por pagar: {money(remaining)}</p>
      </div>
      <MoneyField label="Monto a pagar" name="pay-amount" value={amount} onChange={setAmount} error={error} />
      <button
        type="button"
        onClick={() => setAmount(amountToInput(remaining))}
        className="-mt-2 text-sm font-semibold text-link hover:text-link-hover"
      >
        Pagar el total pendiente
      </button>
      <TextField label="Fecha del pago" name="pay-date" type="date" value={date} onChange={setDate} />
      <p className="text-xs text-muted">
        Al confirmar, se registrará automáticamente un gasto en tus movimientos con este monto y fecha.
      </p>
      <Button type="submit" loading={loading}>
        Registrar pago y generar gasto
      </Button>
    </form>
  )
}
