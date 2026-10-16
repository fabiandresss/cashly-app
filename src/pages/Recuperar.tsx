import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { requestPasswordReset, validators } from '@/lib/auth'

export function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const emailError = validators.email(email)
    setError(emailError)
    setFormError(null)
    if (emailError) return

    setLoading(true)
    try {
      await requestPasswordReset(email.trim())
      setSent(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo enviar el correo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Recupera tu acceso"
      subtitle="Te enviaremos un enlace para restablecer tu contraseña."
      footer={
        <Link to="/login" className="font-semibold text-link hover:text-link-hover">
          Volver a iniciar sesión
        </Link>
      }
    >
      {sent ? (
        <Alert tone="success">
          Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
        </Alert>
      ) : (
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
            error={error}
          />
          <Button type="submit" loading={loading}>
            Enviar enlace
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
