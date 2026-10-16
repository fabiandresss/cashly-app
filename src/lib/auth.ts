import type { AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface SignInInput {
  email: string
  password: string
}

export interface SignUpInput extends SignInInput {
  name: string
}

export interface SignUpResult {
  /** true si Supabase exige confirmar el correo antes de iniciar sesión. */
  needsConfirmation: boolean
}

const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  email_not_confirmed: 'Debes confirmar tu correo antes de iniciar sesión.',
  user_already_exists: 'Este correo ya está registrado.',
  email_exists: 'Este correo ya está registrado.',
  weak_password: 'La contraseña es demasiado débil. Usa al menos 8 caracteres.',
  over_request_rate_limit: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  over_email_send_rate_limit: 'Se enviaron demasiados correos. Espera un momento e inténtalo de nuevo.',
  signup_disabled: 'El registro de nuevas cuentas está deshabilitado.',
}

function client() {
  if (!supabase) {
    throw new Error('Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env.')
  }
  return supabase
}

function toMessage(error: AuthError): Error {
  const known = error.code ? MESSAGES[error.code] : undefined
  return new Error(known ?? 'Ocurrió un error inesperado. Inténtalo de nuevo.')
}

export async function signIn({ email, password }: SignInInput): Promise<void> {
  const { error } = await client().auth.signInWithPassword({ email, password })
  if (error) throw toMessage(error)
}

export async function signUp({ name, email, password }: SignUpInput): Promise<SignUpResult> {
  const { data, error } = await client().auth.signUp({
    email,
    password,
    options: { data: { name } },
  })
  if (error) throw toMessage(error)
  return { needsConfirmation: data.session === null }
}

export async function signOut(): Promise<void> {
  const { error } = await client().auth.signOut()
  if (error) throw toMessage(error)
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await client().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  })
  if (error) throw toMessage(error)
}

export async function updateName(name: string): Promise<void> {
  const { error } = await client().auth.updateUser({ data: { name } })
  if (error) throw toMessage(error)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const validators = {
  email: (value: string): string | undefined =>
    EMAIL_RE.test(value.trim()) ? undefined : 'Ingresa un correo válido.',
  password: (value: string): string | undefined =>
    value.length >= 8 ? undefined : 'La contraseña debe tener al menos 8 caracteres.',
  name: (value: string): string | undefined =>
    value.trim().length >= 2 ? undefined : 'Ingresa tu nombre.',
}
