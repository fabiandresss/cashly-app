import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { MoneyField } from '@/components/ui/MoneyField'
import { Select, type SelectOption } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { TypeToggle } from '@/components/ui/TypeToggle'
import { iconPath } from '@/lib/categoryIcons'
import { amountToInput, parseAmount, todayISO } from '@/lib/format'
import type {
  Category,
  RecurringFrequency,
  RecurringInput,
  RecurringRule,
  TransactionType,
} from '@/types/db'

interface RecurringFormProps {
  categories: readonly Category[]
  initial?: RecurringRule | undefined
  onSubmit: (input: RecurringInput) => Promise<void>
}

const NO_CATEGORY = 'none'

const FREQUENCIES: SelectOption[] = [
  { value: 'monthly', label: 'Cada mes' },
  { value: 'weekly', label: 'Cada semana' },
  { value: 'yearly', label: 'Cada año' },
]

const DAYS: SelectOption[] = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: i === 30 ? 'Día 31 (o el último del mes)' : `Día ${i + 1}`,
}))

interface FieldErrors {
  amount?: string
  start?: string
  end?: string
}

export function RecurringForm({ categories, initial, onSubmit }: RecurringFormProps) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense')
  const [amount, setAmount] = useState(initial ? amountToInput(initial.amount) : '')
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? NO_CATEGORY)
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [frequency, setFrequency] = useState<RecurringFrequency>(initial?.frequency ?? 'monthly')
  const [day, setDay] = useState(String(initial?.day_of_month ?? 1))
  const [startDate, setStartDate] = useState(initial?.start_date ?? todayISO())
  const [endDate, setEndDate] = useState(initial?.end_date ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const options: SelectOption[] = [
    { value: NO_CATEGORY, label: 'Sin categoría', icon: iconPath('tag'), color: '#64748b' },
    ...categories
      .filter((c) => c.type === type)
      .map((c) => ({ value: c.id, label: c.name, icon: iconPath(c.icon), color: c.color })),
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) next.start = 'Selecciona una fecha de inicio válida.'
    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) next.end = 'Fecha de término inválida.'
    else if (endDate && endDate < startDate) next.end = 'Debe ser posterior al inicio.'
    setErrors(next)
    if (Object.keys(next).length > 0 || parsed === null) return

    setLoading(true)
    try {
      await onSubmit({
        type,
        amount: parsed,
        category_id: categoryId === NO_CATEGORY ? null : categoryId,
        name: name.trim() || null,
        description: description.trim() || null,
        frequency,
        day_of_month: frequency === 'monthly' ? Number(day) : null,
        start_date: startDate,
        end_date: endDate || null,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el movimiento programado.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <Alert tone="error">{formError}</Alert>}
      <TypeToggle value={type} onChange={changeType} />
      <MoneyField label="Monto" name="amount" value={amount} onChange={setAmount} error={errors.amount} />
      <Select label="Categoría" value={categoryId} onChange={setCategoryId} options={options} />
      <TextField
        label="Nombre"
        name="name"
        placeholder="Ej: Arriendo departamento"
        maxLength={100}
        value={name}
        onChange={setName}
      />
      <TextField
        label="Descripción (opcional)"
        name="description"
        placeholder="Ej: Transferencia a la administración"
        maxLength={200}
        value={description}
        onChange={setDescription}
      />
      <Select
        label="Frecuencia"
        value={frequency}
        onChange={(v) => setFrequency(v as RecurringFrequency)}
        options={FREQUENCIES}
      />
      {frequency === 'monthly' && <Select label="Día del mes" value={day} onChange={setDay} options={DAYS} />}
      <TextField
        label={frequency === 'monthly' ? 'Empieza desde' : 'Primera fecha'}
        name="start"
        type="date"
        value={startDate}
        onChange={setStartDate}
        error={errors.start}
      />
      {frequency !== 'monthly' && (
        <p className="-mt-2 text-xs text-muted">
          {frequency === 'weekly'
            ? 'Se repetirá el mismo día de la semana que la primera fecha.'
            : 'Se repetirá cada año el mismo día y mes que la primera fecha.'}
        </p>
      )}
      <TextField
        label="Termina (opcional)"
        name="end"
        type="date"
        value={endDate}
        onChange={setEndDate}
        error={errors.end}
      />
      <Button type="submit" loading={loading}>
        {initial ? 'Guardar cambios' : 'Programar movimiento'}
      </Button>
    </form>
  )
}
