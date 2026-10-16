export interface NavItem {
  to: string
  label: string
  /** Path del ícono SVG (viewBox 24x24, trazo). */
  icon: string
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10' },
  { to: '/movimientos', label: 'Movimientos', icon: 'M7 7h13M7 7l3-3M7 7l3 3M17 17H4M17 17l-3-3M17 17l-3 3' },
  { to: '/presupuestos', label: 'Presupuestos', icon: 'M12 3a9 9 0 109 9h-9V3z' },
  { to: '/estadisticas', label: 'Estadísticas', icon: 'M4 20V10M10 20V4M16 20v-8M22 20H2' },
  { to: '/asistente', label: 'Asistente', icon: 'M21 12a8 8 0 01-11.5 7.2L4 20l1-4.5A8 8 0 1121 12z' },
] as const
