import { Icon } from '@/components/ui/Icon'
import type { ConversationSummary } from '@/lib/conversations'

const TRASH = 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6'
const PLUS = 'M12 5v14M5 12h14'

function dayLabel(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startOf(now) - startOf(date)) / 86_400_000)
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface ConversationHistoryProps {
  conversations: readonly ConversationSummary[]
  activeId: string | null
  loading: boolean
  error: string | null
  onSelect: (id: string) => void
  onDelete: (conversation: ConversationSummary) => void
  onNew: () => void
}

export function ConversationHistory({
  conversations,
  activeId,
  loading,
  error,
  onSelect,
  onDelete,
  onNew,
}: ConversationHistoryProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <button
        type="button"
        onClick={onNew}
        className="mb-3 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-all hover:bg-brand-600 hover:shadow-lift"
      >
        <Icon path={PLUS} className="h-4 w-4" />
        Nueva conversación
      </button>

      <p className="mb-2 shrink-0 px-1 text-xs font-semibold uppercase tracking-wide text-muted">Historial</p>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : loading && conversations.length === 0 ? (
          <div className="flex justify-center py-6">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-1 text-sm text-muted">Aún no tienes conversaciones guardadas.</p>
        ) : (
          <ul className="space-y-1.5">
            {conversations.map((c) => {
              const active = c.id === activeId
              return (
                <li key={c.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    aria-current={active ? 'true' : undefined}
                    className={`w-full rounded-xl border px-3 py-2.5 pr-10 text-left transition-all ${
                      active
                        ? 'border-brand-500 bg-brand-50 shadow-card'
                        : 'border-line bg-surface hover:border-brand-200 hover:bg-brand-50/60'
                    }`}
                  >
                    <span className="block truncate text-sm font-medium text-ink">{c.title}</span>
                    <span className="block text-xs text-muted">{dayLabel(c.updated_at)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(c)}
                    aria-label={`Eliminar conversación ${c.title}`}
                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted opacity-100 transition-colors hover:bg-red-500/10 hover:text-red-600 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                  >
                    <Icon path={TRASH} className="h-4 w-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
