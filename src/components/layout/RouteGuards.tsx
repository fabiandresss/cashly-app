import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'

function FullScreenSpinner() {
  return (
    <div className="flex h-full items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-500" />
    </div>
  )
}

/** Solo permite el paso con sesión iniciada. */
export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenSpinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

/** Para login, registro y recuperación: si ya hay sesión, redirige al inicio. */
export function RedirectIfAuthed() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  if (loading) return <FullScreenSpinner />
  if (user) return <Navigate to={from ?? '/'} replace />
  return <Outlet />
}
