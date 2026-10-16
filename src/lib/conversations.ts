import type { ChatMessage } from '@/lib/assistant'
import { supabase } from '@/lib/supabase'

export interface ConversationSummary {
  id: string
  title: string
  /** ISO timestamp de la última actividad. */
  updated_at: string
}

const SAVE_ERROR = 'No se pudo guardar la conversación en tu historial.'
const LOAD_ERROR = 'No se pudo cargar el historial. Verifica que la migración 0005 esté aplicada.'

function db() {
  if (!supabase) {
    throw new Error('Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env.')
  }
  return supabase
}

/** Título de la conversación a partir del primer mensaje. */
export function titleFrom(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > 60 ? `${clean.slice(0, 57)}…` : clean
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const { data, error } = await db()
    .from('assistant_conversations')
    .select('id, title, updated_at')
    .order('updated_at', { ascending: false })
    .limit(50)
  if (error) throw new Error(LOAD_ERROR)
  return (data ?? []) as ConversationSummary[]
}

export async function createConversation(title: string): Promise<string> {
  const { data, error } = await db().from('assistant_conversations').insert({ title }).select('id').single()
  if (error || !data) throw new Error(SAVE_ERROR)
  return String((data as { id: string }).id)
}

export async function addMessage(conversationId: string, role: ChatMessage['role'], content: string): Promise<void> {
  const { error } = await db()
    .from('assistant_messages')
    .insert({ conversation_id: conversationId, role, content })
  if (error) throw new Error(SAVE_ERROR)
}

export async function listMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await db()
    .from('assistant_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200)
  if (error) throw new Error('No se pudo cargar la conversación.')
  return (data ?? []) as ChatMessage[]
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await db().from('assistant_conversations').delete().eq('id', id)
  if (error) throw new Error('No se pudo eliminar la conversación.')
}
