export interface SignInInput {
  email: string
  password: string
}

export interface SignUpInput extends SignInInput {
  name: string
}

/** Se lanza mientras el backend (Supabase) no esté conectado. */
export class AuthNotConnectedError extends Error {
  constructor() {
    super('La autenticación aún no está conectada al servidor. Se activará en la fase 2.')
    this.name = 'AuthNotConnectedError'
  }
}

/**
 * Contrato de autenticación que consume la interfaz.
 * Cuando se conecte Supabase, solo cambia la implementación de estas funciones.
 */
export async function signIn(_input: SignInInput): Promise<void> {
  throw new AuthNotConnectedError()
}

export async function signUp(_input: SignUpInput): Promise<void> {
  throw new AuthNotConnectedError()
}

export async function signOut(): Promise<void> {
  throw new AuthNotConnectedError()
}

export async function requestPasswordReset(_email: string): Promise<void> {
  throw new AuthNotConnectedError()
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
