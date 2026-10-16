import { useState } from 'react'
import { TransactionForm } from '@/components/features/TransactionForm'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { useMoney } from '@/hooks/useMoney'
import { createTemplate, deleteTemplate } from '@/lib/data'
import type { Category, TransactionInput, TransactionTemplate } from '@/types/db'

const PLUS = 'M12 5v14M5 12h14'
const TRASH = 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6'
const STAR = 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3 1.2-6.8-5-4.9 6.9-1z'

interface TemplateManagerProps {
  templates: readonly TransactionTemplate[]
  categories: readonly Category[]
  loading: boolean
  error: string | null
  onChanged: () => void
  /** Usar una plantilla: abre el formulario de movimiento precargado. */
  onUse: (template: TransactionTemplate) => void
}

export function TemplateManager({ templates, categories, loading, error, onChanged, onUse }: TemplateManagerProps) {
  const { money } = useMoney()
  const [formOpen, setFormOpen] = useState(false)
  const [toDelete, setToDelete] = useState<TransactionTemplate | null>(null)
  const categoryById = new Map(categories.map((c) => [c.id, c]))

  async function handleCreate(input: TransactionInput) {
    await createTemplate({
      type: input.type,
      amount: input.amount,
      category_id: input.category_id,
      name: input.name ?? '',
      description: input.description,
    })
    setFormOpen(false)
    onChanged()
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted">
          Guarda los movimientos que repites seguido (café, metro, bencina) y regístralos en dos toques.
        </p>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-all hover:bg-brand-600 hover:shadow-lift"
        >
          <Icon path={PLUS} className="h-4 w-4" />
          Nueva plantilla
        </button>
      </div>

      {error && (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <Card delay={80}>
        {loading && templates.length === 0 ? (
          <div className="flex justify-center py-10">
            <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-500" />
          </div>
        ) : templates.length === 0 ? (
          <EmptyState
            icon={STAR}
            title="Sin plantillas todavía"
            description="Crea una, o usa la estrella en cualquier movimiento para guardarlo como plantilla."
          />
        ) : (
          <ul className="divide-y divide-line">
            {templates.map((t) => {
              const category = t.category_id ? categoryById.get(t.category_id) : undefined
              const isIncome = t.type === 'income'
              return (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <CategoryBadge icon={category?.icon} color={category?.color} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{t.name}</p>
                    <p className="truncate text-xs text-muted">{category?.name ?? 'Sin categoría'}</p>
                  </div>
                  <p
                    className={`shrink-0 text-sm font-semibold ${
                      isIncome ? 'text-link' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {isIncome ? '+' : '−'}
                    {money(t.amount)}
                  </p>
                  <button
                    type="button"
                    onClick={() => onUse(t)}
                    className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-brand-50"
                  >
                    Usar
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(t)}
                    aria-label={`Eliminar plantilla ${t.name}`}
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

      {formOpen && (
        <Modal title="Nueva plantilla" onClose={() => setFormOpen(false)}>
          <TransactionForm categories={categories} mode="template" onSubmit={handleCreate} />
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Eliminar plantilla"
          message={`Se eliminará la plantilla "${toDelete.name}". Los movimientos ya registrados no cambian.`}
          confirmLabel="Eliminar"
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            await deleteTemplate(toDelete.id)
            setToDelete(null)
            onChanged()
          }}
        />
      )}
    </>
  )
}
