import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { signIn, validators } from '@/lib/auth'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string | undefined; password?: string | undefined }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next = {
      email: validators.email(email),
      password: password ? undefined : 'Ingresa tu contraseña.',
    }
    setErrors(next)
    setFormError(null)
    if (next.email || next.password) return

    setLoading(true)
    try {
      await signIn({ email: email.trim(), password })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Bienvenido de nuevo"
      subtitle="Ingresa a tu cuenta para continuar."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && <Alert tone="error">{formError}</Alert>}
        <TextField
          label="Correo electrónico"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={setEmail}
          error={errors.email}
        />
        <TextField
          label="Contraseña"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Tu contraseña"
          value={password}
          onChange={setPassword}
          error={errors.password}
        />
        <div className="flex justify-end">
          <Link to="/recuperar" className="text-sm font-medium text-link hover:text-link-hover">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Button type="submit" loading={loading}>
          Iniciar sesión
        </Button>
      </form>
    </AuthLayout>
  )
}
