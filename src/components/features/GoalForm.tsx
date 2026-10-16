import { useState, type FormEvent } from 'react'
import { ColorPicker, IconPicker } from '@/components/features/CategoryManager'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { MoneyField } from '@/components/ui/MoneyField'
import { TextField } from '@/components/ui/TextField'
import { amountToInput, parseAmount, todayISO } from '@/lib/format'
import type { GoalInput, SavingsGoal } from '@/types/db'

interface GoalFormProps {
  initial?: SavingsGoal | undefined
  onSubmit: (input: GoalInput) => Promise<void>
}

interface FieldErrors {
  name?: string
  target?: string
  date?: string
}

export function GoalForm({ initial, onSubmit }: GoalFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [target, setTarget] = useState(initial ? amountToInput(initial.target_amount) : '')
  const [date, setDate] = useState(initial?.target_date ?? '')
  const [color, setColor] = useState(initial?.color ?? '#10b981')
  const [icon, setIcon] = useState(initial?.icon ?? 'target')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    const parsed = parseAmount(target)
    const next: FieldErrors = {}
    const trimmed = name.trim()
    if (trimmed.length < 1 || trimmed.length > 60) next.name = 'El nombre debe tener entre 1 y 60 caracteres.'
    if (parsed === null || parsed <= 0) next.target = 'Ingresa un monto mayor a 0.'
    else if (parsed > 999_999_999_999) next.target = 'El monto es demasiado grande.'
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) next.date = 'Fecha inválida.'
    else if (date && date < todayISO() && !initial) next.date = 'La fecha debe ser futura.'
    setErrors(next)
    if (Object.keys(next).length > 0 || parsed === null) return

    setLoading(true)
    try {
      await onSubmit({ name: trimmed, target_amount: parsed, target_date: date || null, color, icon })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar la meta.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <Alert tone="error">{formError}</Alert>}
      <TextField
        label="Nombre de la meta"
        name="goal-name"
        placeholder="Ej: Vacaciones, Fondo de emergencia"
        maxLength={60}
        value={name}
        onChange={setName}
        error={errors.name}
      />
      <MoneyField label="Monto objetivo" name="target" value={target} onChange={setTarget} error={errors.target} />
      <TextField
        label="Fecha objetivo (opcional)"
        name="goal-date"
        type="date"
        value={date}
        onChange={setDate}
        error={errors.date}
      />
      <div>
        <p className="mb-1.5 text-sm font-medium text-heading">Color</p>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <div>
        <p className="mb-1.5 text-sm font-medium text-heading">Ícono</p>
        <IconPicker value={icon} color={color} onChange={setIcon} />
      </div>
      <Button type="submit" loading={loading}>
        {initial ? 'Guardar cambios' : 'Crear meta'}
      </Button>
    </form>
  )
}
