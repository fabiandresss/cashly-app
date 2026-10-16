import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { SettingsProvider } from '@/lib/settings'
import { AjustesPage } from '@/pages/Ajustes'
import { AsistentePage } from '@/pages/Asistente'
import { DashboardPage } from '@/pages/Dashboard'
import { EstadisticasPage } from '@/pages/Estadisticas'
import { LoginPage } from '@/pages/Login'
import { MovimientosPage } from '@/pages/Movimientos'
import { PresupuestosPage } from '@/pages/Presupuestos'
import { RecuperarPage } from '@/pages/Recuperar'
import { RegistroPage } from '@/pages/Registro'

export default function App() {
  return (
    <SettingsProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="movimientos" element={<MovimientosPage />} />
          <Route path="presupuestos" element={<PresupuestosPage />} />
          <Route path="estadisticas" element={<EstadisticasPage />} />
          <Route path="asistente" element={<AsistentePage />} />
          <Route path="configuracion" element={<AjustesPage />} />
        </Route>
        <Route path="login" element={<LoginPage />} />
        <Route path="registro" element={<RegistroPage />} />
        <Route path="recuperar" element={<RecuperarPage />} />
      </Routes>
    </BrowserRouter>
    </SettingsProvider>
  )
}
