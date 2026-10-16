import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { MoneyField } from '@/components/ui/MoneyField'
import { Select, type SelectOption } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { TypeToggle } from '@/components/ui/TypeToggle'
import { iconPath } from '@/lib/categoryIcons'
import { amountToInput, parseAmount, todayISO } from '@/lib/format'
import type { Category, Transaction, TransactionInput, TransactionType } from '@/types/db'

/** Valores iniciales sin ser una edición (por ejemplo, desde una plantilla o una propuesta de Cashly AI). */
export type TransactionSeed = Partial<
  Pick<TransactionInput, 'type' | 'amount' | 'occurred_on' | 'category_id' | 'name' | 'description'>
>

interface TransactionFormProps {
  categories: readonly Category[]
  /** Si viene, el formulario edita ese movimiento. */
  initial?: Transaction | undefined
  /** Valores precargados para un movimiento nuevo. */
  seed?: TransactionSeed | undefined
  /** "template": guarda una plantilla (sin fecha, con nombre obligatorio). */
  mode?: 'transaction' | 'template'
  onSubmit: (input: TransactionInput) => Promise<void>
}

interface FieldErrors {
  amount?: string
  date?: string
  name?: string
  description?: string
}

const NO_CATEGORY = 'none'

export function TransactionForm({ categories, initial, seed, mode = 'transaction', onSubmit }: TransactionFormProps) {
  const base: TransactionSeed = initial ?? seed ?? {}
  const isTemplate = mode === 'template'

  const [type, setType] = useState<TransactionType>(base.type ?? 'expense')
  const [amount, setAmount] = useState(base.amount !== undefined ? amountToInput(base.amount) : '')
  const [date, setDate] = useState(base.occurred_on ?? todayISO())
  const [categoryId, setCategoryId] = useState(base.category_id ?? NO_CATEGORY)
  const [name, setName] = useState(base.name ?? '')
  const [description, setDescription] = useState(base.description ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const available = categories.filter((c) => c.type === type)
  const options: SelectOption[] = [
    { value: NO_CATEGORY, label: 'Sin categoría', icon: iconPath('tag'), color: '#64748b' },
    ...available.map((c) => ({ value: c.id, label: c.name, icon: iconPath(c.icon), color: c.color })),
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
    if (!isTemplate && !/^\d{4}-\d{2}-\d{2}$/.test(date)) next.date = 'Selecciona una fecha válida.'
    if (isTemplate && name.trim().length === 0) next.name = 'La plantilla necesita un nombre.'
    if (name.length > 100) next.name = 'Máximo 100 caracteres.'
    if (description.length > 200) next.description = 'Máximo 200 caracteres.'
    setErrors(next)
    if (Object.keys(next).length > 0 || parsed === null) return

    setLoading(true)
    try {
      await onSubmit({
        type,
        amount: parsed,
        occurred_on: isTemplate ? todayISO() : date,
        category_id: categoryId === NO_CATEGORY ? null : categoryId,
        name: name.trim() || null,
        description: description.trim() || null,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <Alert tone="error">{formError}</Alert>}
      <TypeToggle value={type} onChange={changeType} />
      <TextField
        label="Nombre"
        name="name"
        placeholder="Ej: Supermercado Jumbo"
        maxLength={100}
        value={name}
        onChange={setName}
        error={errors.name}
      />
      <MoneyField label="Monto" name="amount" value={amount} onChange={setAmount} error={errors.amount} />
      {!isTemplate && (
        <TextField
          label="Fecha"
          name="date"
          type="date"
          value={date}
          onChange={setDate}
          error={errors.date}
        />
      )}
      <Select label="Categoría" value={categoryId} onChange={setCategoryId} options={options} />
      <TextField
        label="Descripción (opcional)"
        name="description"
        placeholder="Ej: Compra mensual de la casa"
        maxLength={200}
        value={description}
        onChange={setDescription}
        error={errors.description}
      />
      <Button type="submit" loading={loading}>
        {isTemplate ? 'Guardar plantilla' : initial ? 'Guardar cambios' : 'Agregar movimiento'}
      </Button>
    </form>
  )
}
