import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js'
import { todayISO } from '@/lib/format'
import { supabase } from '@/lib/supabase'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** Límites que también valida la Edge Function. */
export const MAX_MESSAGE_CHARS = 1000
export const MAX_HISTORY = 12

const FALLBACK_ERROR = 'El asistente no está disponible en este momento. Inténtalo de nuevo.'

export async function askAssistant(history: readonly ChatMessage[]): Promise<string> {
  if (!supabase) {
    throw new Error('Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env.')
  }

  const messages = history.slice(-MAX_HISTORY).map((m) => ({ role: m.role, content: m.content }))
  const { data, error } = await supabase.functions.invoke<{ reply?: string; error?: string }>('assistant', {
    body: { messages, today: todayISO() },
  })

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = (await error.context.json().catch(() => null)) as { error?: string } | null
      throw new Error(body?.error ?? FALLBACK_ERROR)
    }
    if (error instanceof FunctionsFetchError) {
      throw new Error('No se pudo conectar con el asistente. Revisa tu conexión.')
    }
    throw new Error(FALLBACK_ERROR)
  }

  if (!data?.reply) throw new Error(FALLBACK_ERROR)
  return data.reply
}
