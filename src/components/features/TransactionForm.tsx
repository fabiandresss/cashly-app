import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { TypeToggle } from '@/components/ui/TypeToggle'
import { parseAmount, todayISO } from '@/lib/format'
import type { Category, Transaction, TransactionInput, TransactionType } from '@/types/db'

interface TransactionFormProps {
  categories: readonly Category[]
  initial?: Transaction | undefined
  onSubmit: (input: TransactionInput) => Promise<void>
}

interface FieldErrors {
  amount?: string
  date?: string
  description?: string
}

const NO_CATEGORY = 'none'

export function TransactionForm({ categories, initial, onSubmit }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [date, setDate] = useState(initial?.occurred_on ?? todayISO())
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? NO_CATEGORY)
  const [description, setDescription] = useState(initial?.description ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const available = categories.filter((c) => c.type === type)
  const options = [
    { value: NO_CATEGORY, label: 'Sin categoría' },
    ...available.map((c) => ({ value: c.id, label: c.name })),
  ]

  function changeType(next: TransactionType) {
    setType(next)
    const current = categories.find((c) => c.id === categoryId)
    if (current && current.type !== next) setCategoryId(NO_CATEGORY)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    const parsed = parseAmount(amount)
    const next: FieldErrors = {}
    if (parsed === null || parsed <= 0) next.amount = 'Ingresa un monto mayor a 0.'
    else if (parsed > 999_999_999_999) next.amount = 'El monto es demasiado grande.'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) next.date = 'Selecciona una fecha válida.'
    if (description.length > 200) next.description = 'Máximo 200 caracteres.'
    setErrors(next)
    if (Object.keys(next).length > 0 || parsed === null) return

    setLoading(true)
    try {
      await onSubmit({
        type,
        amount: parsed,
        occurred_on: date,
        category_id: categoryId === NO_CATEGORY ? null : categoryId,
        description: description.trim() || null,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el movimiento.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <Alert tone="error">{formError}</Alert>}
      <TypeToggle value={type} onChange={changeType} />
      <TextField
        label="Monto"
        name="amount"
        inputMode="decimal"
        placeholder="0"
        value={amount}
        onChange={setAmount}
        error={errors.amount}
      />
      <TextField
        label="Fecha"
        name="date"
        type="date"
        value={date}
        onChange={setDate}
        error={errors.date}
      />
      <Select label="Categoría" value={categoryId} onChange={setCategoryId} options={options} />
      <TextField
        label="Descripción (opcional)"
        name="description"
        placeholder="Ej: Supermercado"
        maxLength={200}
        value={description}
        onChange={setDescription}
        error={errors.description}
      />
      <Button type="submit" loading={loading}>
        {initial ? 'Guardar cambios' : 'Agregar movimiento'}
      </Button>
    </form>
  )
}
