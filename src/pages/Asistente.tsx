import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ConversationHistory } from '@/components/features/ConversationHistory'
import { ProposalCard, type ProposalStatus } from '@/components/features/ProposalCard'
import { TransactionForm } from '@/components/features/TransactionForm'
import { Alert } from '@/components/ui/Alert'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Icon } from '@/components/ui/Icon'
import { AiAvatar } from '@/components/ui/AiAvatar'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { RichText } from '@/components/ui/RichText'
import { useAsyncData } from '@/hooks/useAsyncData'
import { askAssistant, MAX_MESSAGE_CHARS, type ChatMessage, type TransactionProposal } from '@/lib/assistant'
import { createTransaction, listCategories } from '@/lib/data'
import {
  addMessage,
  createConversation,
  deleteConversation,
  listConversations,
  listMessages,
  titleFrom,
  type ConversationSummary,
} from '@/lib/conversations'

const SUGGESTIONS = [
  '¿En qué gasté más este mes?',
  '¿Cómo voy con mis presupuestos?',
  '¿Llego a mi meta de ahorro?',
  'Anota un gasto de 5 mil en café',
  'Compara mis gastos con el mes anterior',
]

interface ProposalState {
  proposal: TransactionProposal
  status: ProposalStatus
  error: string | null
}

const SEND = 'M22 2L11 13M22 2l-7 20-4-9-9-4z'
const CLOCK = 'M12 8v4l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
const SAVE_WARNING = 'Esta conversación no se pudo guardar en tu historial. Puedes seguir usándola.'

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5" aria-live="polite" aria-label="El asistente está escribiendo">
      <AiAvatar className="h-9 w-9"/>
      <div className="flex gap-1.5 rounded-2xl rounded-bl-md border border-line bg-surface px-4 py-3.5 shadow-card">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-2 w-2 animate-bounce rounded-full bg-brand-500"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

export function AsistentePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [toDelete, setToDelete] = useState<ConversationSummary | null>(null)
  // Propuestas de movimientos, por posición del mensaje del asistente.
  const [proposals, setProposals] = useState<Record<number, ProposalState>>({})
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const history = useAsyncData(listConversations, [])
  const conversations = history.data ?? []
  const categoriesQuery = useAsyncData(listCategories, [])
  const categories = categoriesQuery.data ?? []

  useEffect(() => {
    if (messages.length === 0 && !loading && !error) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading, error])

  async function request(chat: ChatMessage[], convId: string | null) {
    setLoading(true)
    setError(null)
    try {
      const { reply, proposal } = await askAssistant(chat)
      setMessages([...chat, { role: 'assistant', content: reply }])
      if (proposal) {
        setProposals((prev) => ({ ...prev, [chat.length]: { proposal, status: 'pending', error: null } }))
      }
      if (convId) {
        try {
          await addMessage(convId, 'assistant', reply)
          history.reload()
        } catch {
          setWarning(SAVE_WARNING)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo obtener una respuesta.')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  async function send(text: string) {
    const content = text.trim()
    if (!content || loading) return

    const chat: ChatMessage[] = [...messages, { role: 'user', content }]
    setMessages(chat)
    setInput('')
    setWarning(null)

    let convId = conversationId
    try {
      if (!convId) {
        convId = await createConversation(titleFrom(content))
        setConversationId(convId)
      }
      await addMessage(convId, 'user', content)
    } catch {
      setWarning(SAVE_WARNING)
      convId = null
    }
    await request(chat, convId)
  }

  async function openConversation(id: string) {
    if (loading) return
    setHistoryOpen(false)
    setError(null)
    setWarning(null)
    try {
      const saved = await listMessages(id)
      setMessages(saved)
      setProposals({})
      setConversationId(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la conversación.')
    }
  }

  function patchProposal(index: number, patch: Partial<ProposalState>) {
    setProposals((prev) => {
      const current = prev[index]
      return current ? { ...prev, [index]: { ...current, ...patch } } : prev
    })
  }

  async function confirmProposal(index: number) {
    const entry = proposals[index]
    if (!entry || entry.status === 'saving') return
    patchProposal(index, { status: 'saving', error: null })
    try {
      const p = entry.proposal
      await createTransaction({
        type: p.type,
        amount: p.amount,
        occurred_on: p.occurred_on,
        category_id: p.category_id,
        name: p.name,
        description: p.description,
      })
      patchProposal(index, { status: 'saved' })
    } catch (err) {
      patchProposal(index, {
        status: 'pending',
        error: err instanceof Error ? err.message : 'No se pudo registrar el movimiento.',
      })
    }
  }

  function reset() {
    setProposals({})
    setEditingIndex(null)
    setMessages([])
    setConversationId(null)
    setError(null)
    setWarning(null)
    setInput('')
    setHistoryOpen(false)
    inputRef.current?.focus()
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void send(input)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void send(input)
    }
  }

  const empty = messages.length === 0

  const historyPanel = (
    <ConversationHistory
      conversations={conversations}
      activeId={conversationId}
      loading={history.loading}
      error={history.error}
      onSelect={(id) => void openConversation(id)}
      onDelete={setToDelete}
      onNew={reset}
    />
  )

  return (
    // El contenedor (AppShell) le da altura fija: la página no se desplaza, solo la conversación.
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-start justify-between gap-4">
        <PageHeader compact title="Cashly AI" description="Tu asistente financiero con inteligencia artificial." />
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-semibold text-ink shadow-card transition-colors hover:bg-brand-50 lg:hidden"
        >
          <Icon path={CLOCK} className="h-4 w-4" />
          Historial
        </button>
      </div>

      <div className="flex min-h-0 flex-1 gap-6">
        <aside className="hidden w-64 shrink-0 lg:block">{historyPanel}</aside>

        <section className="flex min-w-0 flex-1 flex-col">
          {/* El scroll aparece solo cuando la conversación supera el espacio disponible. */}
          <div className="min-h-0 flex-1 overflow-y-auto pb-3 pr-1" aria-live="polite">
            <div className="flex min-h-full flex-col justify-end space-y-5">
            {empty && !loading ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <AiAvatar className="mb-3 h-20 w-20" />
                <h2 className="text-lg font-semibold text-heading">Hola, soy Cashly AI</h2>
                <p className="mt-1 max-w-sm text-sm text-muted [@media(max-height:700px)]:hidden">
                  Respondo con tus movimientos y presupuestos reales. Pregúntame lo que quieras sobre tus
                  finanzas.
                </p>
                <div className="mt-5 flex max-w-xl flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void send(suggestion)}
                      className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50 hover:shadow-lift"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) =>
                message.role === 'user' ? (
                  <div key={index} className="flex justify-end">
                    <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-brand-700 px-4 py-3 text-sm text-white shadow-card">
                      {message.content}
                    </p>
                  </div>
                ) : (
                  <div key={index} className="space-y-3">
                    <div className="flex items-end gap-2.5">
                      <AiAvatar className="h-9 w-9" still />
                      <div className="max-w-[85%] break-words rounded-2xl rounded-bl-md border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-ink shadow-card">
                        <RichText text={message.content} />
                      </div>
                    </div>
                    {proposals[index] && (
                      <ProposalCard
                        proposal={proposals[index].proposal}
                        status={proposals[index].status}
                        error={proposals[index].error}
                        category={categories.find((c) => c.id === proposals[index]?.proposal.category_id)}
                        onConfirm={() => void confirmProposal(index)}
                        onEdit={() => setEditingIndex(index)}
                        onDismiss={() => patchProposal(index, { status: 'dismissed' })}
                      />
                    )}
                  </div>
                ),
              )
            )}

            {loading && <TypingIndicator />}

            {error && (
              <div className="space-y-2">
                <Alert tone="error">{error}</Alert>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void request(messages, conversationId)}
                    disabled={loading}
                    className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-brand-50"
                  >
                    Reintentar
                  </button>
                )}
              </div>
            )}
            </div>
            <div ref={bottomRef} />
          </div>

          {warning && (
            <p className="mb-2 shrink-0 text-xs text-amber-700 dark:text-amber-400" role="status">
              {warning}
            </p>
          )}

          <form onSubmit={handleSubmit} className="shrink-0">
            <div className="rounded-2xl border border-line bg-surface p-3 shadow-lift">
              <div className="flex items-end gap-3">
                <label htmlFor="assistant-input" className="sr-only">
                  Escribe tu pregunta
                </label>
                <textarea
                  id="assistant-input"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, MAX_MESSAGE_CHARS))}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  placeholder="Escribe tu pregunta… (Enter para enviar, Shift+Enter para salto de línea)"
                  className="min-h-[3rem] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-ink outline-none placeholder:text-muted/75"
                />
                <button
                  type="submit"
                  disabled={loading || input.trim().length === 0}
                  aria-label="Enviar mensaje"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white shadow-card transition-all hover:bg-brand-600 hover:shadow-lift active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon path={SEND} className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-1 px-2 text-right text-xs text-muted">
                {input.length}/{MAX_MESSAGE_CHARS} · Las respuestas pueden contener errores; verifica tus cifras.
              </p>
            </div>
          </form>
        </section>
      </div>

      {editingIndex !== null && proposals[editingIndex] && (
        <Modal title="Editar antes de registrar" onClose={() => setEditingIndex(null)}>
          <TransactionForm
            categories={categories}
            seed={{
              type: proposals[editingIndex].proposal.type,
              amount: proposals[editingIndex].proposal.amount,
              occurred_on: proposals[editingIndex].proposal.occurred_on,
              category_id: proposals[editingIndex].proposal.category_id,
              name: proposals[editingIndex].proposal.name,
              description: proposals[editingIndex].proposal.description,
            }}
            onSubmit={async (input) => {
              await createTransaction(input)
              patchProposal(editingIndex, { status: 'saved' })
              setEditingIndex(null)
            }}
          />
        </Modal>
      )}

      {historyOpen && (
        <Modal title="Historial" onClose={() => setHistoryOpen(false)}>
          <div className="h-[60vh]">{historyPanel}</div>
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Eliminar conversación"
          message={`Se eliminará "${toDelete.title}" con todos sus mensajes. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            await deleteConversation(toDelete.id)
            if (toDelete.id === conversationId) reset()
            setToDelete(null)
            history.reload()
          }}
        />
      )}
    </div>
  )
}
