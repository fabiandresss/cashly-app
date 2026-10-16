import { useState } from 'react'
import { RecurringForm } from '@/components/features/RecurringForm'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useMoney } from '@/hooks/useMoney'
import {
  createRecurring,
  deleteRecurring,
  generateMyRecurring,
  listRecurring,
  setRecurringActive,
  updateRecurring,
} from '@/lib/data'
import { describeSchedule, formatNext } from '@/lib/recurring'
import type { Category, RecurringInput, RecurringRule } from '@/types/db'

const PLUS = 'M12 5v14M5 12h14'
const EDIT = 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z'
const TRASH = 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6'
const CALENDAR = 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18'

interface RecurringManagerProps {
  categories: readonly Category[]
  /** Se llama cuando se generaron movimientos nuevos, para refrescar las listas. */
  onGenerated: () => void
}

export function RecurringManager({ categories, onGenerated }: RecurringManagerProps) {
  const { money } = useMoney()
  const query = useAsyncData(listRecurring, [])
  const [form, setForm] = useState<{ open: boolean; editing?: RecurringRule | undefined }>({ open: false })
  const [toDelete, setToDelete] = useState<RecurringRule | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rules = query.data ?? []
  const categoryById = new Map(categories.map((c) => [c.id, c]))

  async function runGeneration() {
    try {
      const created = await generateMyRecurring()
      if (created > 0) {
        setNotice(`Se registraron ${created} movimiento${created === 1 ? '' : 's'} programado${created === 1 ? '' : 's'}.`)
        onGenerated()
      }
    } catch {
      /* si la función aún no existe, no es crítico */
    }
  }

  async function handleSave(input: RecurringInput) {
    if (form.editing) await updateRecurring(form.editing.id, input)
    else await createRecurring(input)
    setForm({ open: false })
    query.reload()
    await runGeneration()
  }

  async function toggle(rule: RecurringRule) {
    setError(null)
    try {
      await setRecurringActive(rule.id, !rule.active)
      query.reload()
      if (!rule.active) await runGeneration()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado.')
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted">
          Define movimientos que se repiten (arriendo, sueldo, suscripciones) y Cashly los registra solo, cada vez
          que corresponde.
        </p>
        <button
          type="button"
          onClick={() => setForm({ open: true })}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-all hover:bg-brand-600 hover:shadow-lift"
        >
          <Icon path={PLUS} className="h-4 w-4" />
          Programar movimiento
        </button>
      </div>

      {notice && (
        <div className="mb-4">
          <Alert tone="success">{notice}</Alert>
        </div>
      )}
      {(query.error || error) && (
        <div className="mb-4">
          <Alert tone="error">{query.error ?? error}</Alert>
        </div>
      )}

      <Card delay={80}>
        {query.loading && !query.data ? (
          <div className="flex justify-center py-10">
            <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-500" />
          </div>
        ) : rules.length === 0 ? (
          <EmptyState
            icon={CALENDAR}
            title="Sin movimientos programados"
            description="Por ejemplo: arriendo de $350.000 el día 1 de cada mes."
          />
        ) : (
          <ul className="divide-y divide-line">
            {rules.map((rule) => {
              const category = rule.category_id ? categoryById.get(rule.category_id) : undefined
              const isIncome = rule.type === 'income'
              return (
                <li key={rule.id} className={`flex items-center gap-3 py-3 ${rule.active ? '' : 'opacity-60'}`}>
                  <CategoryBadge icon={category?.icon} color={category?.color} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {rule.name || rule.description || category?.name || 'Sin categoría'}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {describeSchedule(rule)} · {formatNext(rule)}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-sm font-semibold ${
                      isIncome ? 'text-link' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {isIncome ? '+' : '−'}
                    {money(rule.amount)}
                  </p>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={rule.active}
                    aria-label={rule.active ? 'Pausar' : 'Activar'}
                    onClick={() => void toggle(rule)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                      rule.active ? 'bg-brand-600' : 'bg-line'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        rule.active ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ open: true, editing: rule })}
                    aria-label="Editar movimiento programado"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-brand-50 hover:text-ink"
                  >
                    <Icon path={EDIT} className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(rule)}
                    aria-label="Eliminar movimiento programado"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-500/10 hover:text-red-600"
                  >
                    <Icon path={TRASH} className="h-4 w-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {form.open && (
        <Modal
          title={form.editing ? 'Editar programado' : 'Programar movimiento'}
          onClose={() => setForm({ open: false })}
        >
          <RecurringForm categories={categories} initial={form.editing} onSubmit={handleSave} />
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Eliminar programado"
          message="Dejará de generar movimientos nuevos. Los que ya se registraron se mantienen."
          confirmLabel="Eliminar"
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            await deleteRecurring(toDelete.id)
            setToDelete(null)
            query.reload()
          }}
        />
      )}
    </>
  )
}
