import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AsistentePage } from '@/pages/Asistente'
import { DashboardPage } from '@/pages/Dashboard'
import { EstadisticasPage } from '@/pages/Estadisticas'
import { MovimientosPage } from '@/pages/Movimientos'
import { PresupuestosPage } from '@/pages/Presupuestos'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="movimientos" element={<MovimientosPage />} />
          <Route path="presupuestos" element={<PresupuestosPage />} />
          <Route path="estadisticas" element={<EstadisticasPage />} />
          <Route path="asistente" element={<AsistentePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
