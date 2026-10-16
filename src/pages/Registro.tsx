import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { signUp, validators } from '@/lib/auth'

interface FieldErrors {
  name?: string | undefined
  email?: string | undefined
  password?: string | undefined
  confirm?: string | undefined
}

export function RegistroPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next: FieldErrors = {
      name: validators.name(name),
      email: validators.email(email),
      password: validators.password(password),
      confirm: confirm === password ? undefined : 'Las contraseñas no coinciden.',
    }
    setErrors(next)
    setFormError(null)
    if (Object.values(next).some(Boolean)) return

    setLoading(true)
    try {
      const result = await signUp({ name: name.trim(), email: email.trim(), password })
      setConfirmationSent(result.needsConfirmation)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo crear la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="Empieza a tomar el control de tu dinero."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-link hover:text-link-hover">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && <Alert tone="error">{formError}</Alert>}
        {confirmationSent && (
          <Alert tone="success">
            Cuenta creada. Revisa tu correo para confirmar tu cuenta y luego inicia sesión.
          </Alert>
        )}
        <TextField
          label="Nombre"
          name="name"
          autoComplete="name"
          placeholder="Tu nombre"
          value={name}
          onChange={setName}
          error={errors.name}
        />
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
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={setPassword}
          error={errors.password}
        />
        <TextField
          label="Confirmar contraseña"
          type="password"
          name="confirm"
          autoComplete="new-password"
          placeholder="Repite tu contraseña"
          value={confirm}
          onChange={setConfirm}
          error={errors.confirm}
        />
        <Button type="submit" loading={loading}>
          Crear cuenta
        </Button>
      </form>
    </AuthLayout>
  )
}
