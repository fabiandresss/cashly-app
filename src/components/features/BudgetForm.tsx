import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { MoneyField } from '@/components/ui/MoneyField'
import { Select, type SelectOption } from '@/components/ui/Select'
import { iconPath } from '@/lib/categoryIcons'
import { amountToInput, parseAmount } from '@/lib/format'
import type { Budget, Category } from '@/types/db'

interface BudgetFormProps {
  /** Categorías de gasto que aún no tienen presupuesto en el mes. */
  availableCategories: readonly Category[]
  /** Si el presupuesto total del mes aún no existe, se ofrece como opción. */
  canCreateTotal: boolean
  initial?: Budget | undefined
  /** Nombre a mostrar al editar (categoría o "Presupuesto total"). */
  initialLabel?: string | undefined
  onSubmit: (input: { category_id: string | null; amount: number }) => Promise<void>
}

const TOTAL = 'total'

export function BudgetForm({ availableCategories, canCreateTotal, initial, initialLabel, onSubmit }: BudgetFormProps) {
  const options: SelectOption[] = [
    ...(canCreateTotal
      ? [{ value: TOTAL, label: 'Presupuesto total del mes', icon: iconPath('wallet'), color: '#10b981' }]
      : []),
    ...availableCategories.map((c) => ({ value: c.id, label: c.name, icon: iconPath(c.icon), color: c.color })),
  ]

  const [target, setTarget] = useState(options[0]?.value ?? '')
  const [amount, setAmount] = useState(initial ? amountToInput(initial.amount) : '')
  const [error, setError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const editing = Boolean(initial)
  const noTargets = !editing && options.length === 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    const parsed = parseAmount(amount)
    if (parsed === null || parsed <= 0) {
      setError('Ingresa un monto mayor a 0.')
      return
    }
    if (parsed > 999_999_999_999) {
      setError('El monto es demasiado grande.')
      return
    }
    setError(undefined)

    setLoading(true)
    try {
      await onSubmit({
        category_id: editing ? (initial?.category_id ?? null) : target === TOTAL ? null : target,
        amount: parsed,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el presupuesto.')
      setLoading(false)
    }
  }

  if (noTargets) {
    return (
      <Alert tone="success">
        Ya definiste un presupuesto para todas tus categorías de gasto este mes. Puedes editar los existentes
        o crear nuevas categorías.
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <Alert tone="error">{formError}</Alert>}
      {editing ? (
        <div>
          <p className="mb-1.5 text-sm font-medium text-heading">Categoría</p>
          <p className="rounded-xl border border-line bg-canvas px-3.5 py-3 text-sm text-ink">
            {initialLabel ?? 'Presupuesto'}
          </p>
        </div>
      ) : (
        <Select label="Categoría" value={target} onChange={setTarget} options={options} />
      )}
      <MoneyField label="Límite mensual" name="amount" value={amount} onChange={setAmount} error={error} />
      <Button type="submit" loading={loading}>
        {editing ? 'Guardar cambios' : 'Crear presupuesto'}
      </Button>
    </form>
  )
}
