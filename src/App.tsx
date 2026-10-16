import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RedirectIfAuthed, RequireAuth } from '@/components/layout/RouteGuards'
import { AuthProvider } from '@/lib/auth-context'
import { SettingsProvider } from '@/lib/settings'
import { AjustesPage } from '@/pages/Ajustes'
import { AsistentePage } from '@/pages/Asistente'
import { DashboardPage } from '@/pages/Dashboard'
import { DeudasPage } from '@/pages/Deudas'
import { EstadisticasPage } from '@/pages/Estadisticas'
import { LoginPage } from '@/pages/Login'
import { MetasPage } from '@/pages/Metas'
import { MovimientosPage } from '@/pages/Movimientos'
import { PresupuestosPage } from '@/pages/Presupuestos'
import { RecuperarPage } from '@/pages/Recuperar'

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route index element={<DashboardPage />} />
                <Route path="movimientos" element={<MovimientosPage />} />
                <Route path="presupuestos" element={<PresupuestosPage />} />
                <Route path="estadisticas" element={<EstadisticasPage />} />
                <Route path="deudas" element={<DeudasPage />} />
                <Route path="metas" element={<MetasPage />} />
                <Route path="asistente" element={<AsistentePage />} />
                <Route path="configuracion" element={<AjustesPage />} />
              </Route>
            </Route>
            <Route element={<RedirectIfAuthed />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="recuperar" element={<RecuperarPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  )
}
