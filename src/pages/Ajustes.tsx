import { useState, type FormEvent } from 'react'
import { BudgetAlertSettings } from '@/components/features/BudgetAlertSettings'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import { TextField } from '@/components/ui/TextField'
import { updateName, validators } from '@/lib/auth'
import { useAuth } from '@/lib/auth-context'
import { useSettings, type Theme } from '@/lib/settings'

const SUN = 'M12 16a4 4 0 100-8 4 4 0 000 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'
const MOON = 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z'

const THEMES: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'Claro', icon: SUN },
  { value: 'dark', label: 'Oscuro', icon: MOON },
]

export function AjustesPage() {
  const { theme, setTheme } = useSettings()
  const { displayName, user } = useAuth()
  const [draft, setDraft] = useState(displayName)
  const [error, setError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaved(false)
    setFormError(null)
    const nameError = validators.name(draft)
    setError(nameError)
    if (nameError) return

    setLoading(true)
    try {
      await updateName(draft.trim())
      setSaved(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo actualizar el nombre.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader title="Configuración" description="Personaliza la apariencia y tu perfil." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card delay={100}>
          <h2 className="text-base font-semibold text-heading">Apariencia</h2>
          <p className="mt-0.5 text-xs text-muted">Elige cómo quieres ver Cashly.</p>
          <div role="radiogroup" aria-label="Tema" className="mt-5 grid grid-cols-2 gap-3">
            {THEMES.map((option) => {
              const active = theme === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTheme(option.value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-5 text-sm font-medium transition-all ${
                    active
                      ? 'border-brand-500 bg-brand-50 text-heading ring-4 ring-brand-500/15'
                      : 'border-line text-muted hover:border-brand-200 hover:text-ink'
                  }`}
                >
                  <Icon path={option.icon} className="h-6 w-6" />
                  {option.label}
                </button>
              )
            })}
          </div>
        </Card>

        <Card delay={190}>
          <h2 className="text-base font-semibold text-heading">Perfil</h2>
          <p className="mt-0.5 truncate text-xs text-muted">{user?.email}</p>
          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            {saved && <Alert tone="success">Nombre actualizado.</Alert>}
            {formError && <Alert tone="error">{formError}</Alert>}
            <TextField
              label="Nombre"
              name="name"
              autoComplete="name"
              value={draft}
              onChange={(v) => {
                setDraft(v)
                setSaved(false)
              }}
              error={error}
            />
            <Button type="submit" loading={loading}>
              Guardar cambios
            </Button>
          </form>
        </Card>

        <BudgetAlertSettings />
      </div>
    </>
  )
}
