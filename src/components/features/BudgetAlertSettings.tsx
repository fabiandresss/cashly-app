import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAsyncData } from '@/hooks/useAsyncData'
import { DEFAULT_ALERT_THRESHOLD, getAlertThreshold, saveAlertThreshold } from '@/lib/data'

export function BudgetAlertSettings() {
  const query = useAsyncData(getAlertThreshold, [])
  const [draft, setDraft] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const value = draft ?? query.data ?? DEFAULT_ALERT_THRESHOLD

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await saveAlertThreshold(value)
      setSaved(true)
      query.reload()
      setDraft(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el umbral.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="lg:col-span-2" delay={280}>
      <h2 className="text-base font-semibold text-heading">Alertas de presupuesto</h2>
      <p className="mt-0.5 text-xs text-muted">
        Un presupuesto pasa a “cerca del límite” cuando alcanzas este porcentaje de gasto.
      </p>

      <div className="mt-5 space-y-4">
        {query.error && <Alert tone="error">{query.error}</Alert>}
        {error && <Alert tone="error">{error}</Alert>}
        {saved && <Alert tone="success">Umbral actualizado.</Alert>}

        <div className="flex items-center gap-4">
          <input
            type="range"
            min={50}
            max={100}
            step={5}
            value={value}
            onChange={(e) => {
              setDraft(Number(e.target.value))
              setSaved(false)
            }}
            aria-label="Umbral de alerta de presupuesto"
            className="h-2 flex-1 cursor-pointer accent-brand-600"
          />
          <span className="w-16 rounded-xl border border-line bg-canvas py-2 text-center text-sm font-semibold tabular-nums text-heading">
            {value}%
          </span>
        </div>
        <div className="sm:max-w-xs">
          <Button type="button" onClick={handleSave} loading={saving} disabled={draft === null}>
            Guardar umbral
          </Button>
        </div>
      </div>
    </Card>
  )
}
