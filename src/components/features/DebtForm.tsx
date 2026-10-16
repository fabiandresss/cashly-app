import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { MoneyField } from '@/components/ui/MoneyField'
import { Select, type SelectOption } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { iconPath } from '@/lib/categoryIcons'
import { amountToInput, parseAmount } from '@/lib/format'
import type { Category, Debt, DebtInput } from '@/types/db'

interface DebtFormProps {
  categories: readonly Category[]
  initial?: Debt | undefined
  onSubmit: (input: DebtInput) => Promise<void>
}

interface FieldErrors {
  name?: string
  total?: string
  date?: string
}

const NO_CATEGORY = 'none'

export function DebtForm({ categories, initial, onSubmit }: DebtFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [total, setTotal] = useState(initial ? amountToInput(initial.total_amount) : '')
  const [dueDate, setDueDate] = useState(initial?.due_date ?? '')
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? NO_CATEGORY)
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const options: SelectOption[] = [
    { value: NO_CATEGORY, label: 'Sin categoría', icon: iconPath('tag'), color: '#64748b' },
    ...categories
      .filter((c) => c.type === 'expense')
      .map((c) => ({ value: c.id, label: c.name, icon: iconPath(c.icon), color: c.color })),
  ]

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    const parsed = parseAmount(total)
    const trimmed = name.trim()
    const next: FieldErrors = {}
    if (trimmed.length < 1 || trimmed.length > 100) next.name = 'El nombre debe tener entre 1 y 100 caracteres.'
    if (parsed === null || parsed <= 0) next.total = 'Ingresa un monto mayor a 0.'
    else if (parsed > 999_999_999_999) next.total = 'El monto es demasiado grande.'
    else if (initial && parsed < initial.paid) next.total = 'No puede ser menor a lo que ya has pagado.'
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) next.date = 'Fecha inválida.'
    setErrors(next)
    if (Object.keys(next).length > 0 || parsed === null) return

    setLoading(true)
    try {
      await onSubmit({
        name: trimmed,
        total_amount: parsed,
        due_date: dueDate || null,
        category_id: categoryId === NO_CATEGORY ? null : categoryId,
        notes: notes.trim() || null,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar la deuda.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <Alert tone="error">{formError}</Alert>}
      <TextField
        label="¿A quién o qué le debes?"
        name="debt-name"
        placeholder="Ej: Préstamo de Juan, Tarjeta de crédito"
        maxLength={100}
        value={name}
        onChange={setName}
        error={errors.name}
      />
      <MoneyField label="Monto total de la deuda" name="total" value={total} onChange={setTotal} error={errors.total} />
      <TextField
        label="Fecha de vencimiento (opcional)"
        name="due"
        type="date"
        value={dueDate}
        onChange={setDueDate}
        error={errors.date}
      />
      <Select label="Categoría del pago" value={categoryId} onChange={setCategoryId} options={options} />
      <p className="-mt-2 text-xs text-muted">Se usará en el gasto que se genere cuando registres un pago.</p>
      <TextField
        label="Notas (opcional)"
        name="notes"
        placeholder="Ej: 12 cuotas, interés 1,5% mensual"
        maxLength={200}
        value={notes}
        onChange={setNotes}
      />
      <Button type="submit" loading={loading}>
        {initial ? 'Guardar cambios' : 'Crear deuda'}
      </Button>
    </form>
  )
}
