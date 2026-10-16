export interface NavItem {
  to: string
  label: string
  /** false = en móvil no va en la barra inferior: se muestra dentro del panel "Más". */
  mobile?: boolean
  /** Etiqueta abreviada para la barra inferior móvil. */
  short?: string
  /** Path del ícono SVG (viewBox 24x24, trazo). */
  icon: string
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10' },
  { to: '/movimientos', label: 'Movimientos', icon: 'M7 7h13M7 7l3-3M7 7l3 3M17 17H4M17 17l-3-3M17 17l-3 3' },
  { to: '/presupuestos', label: 'Presupuestos', short: 'Presup.', icon: 'M12 3a9 9 0 109 9h-9V3z' },
  { to: '/estadisticas', label: 'Estadísticas', mobile: false, icon: 'M4 20V10M10 20V4M16 20v-8M22 20H2' },
  {
    to: '/deudas',
    label: 'Deudas',
    mobile: false,
    icon: 'M3 6h18v12H3zM3 10h18M7 15h4M16 15h1',
  },
  {
    to: '/metas',
    label: 'Metas',
    mobile: false,
    icon: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 17a5 5 0 100-10 5 5 0 000 10zM12 13a1 1 0 100-2 1 1 0 000 2z',
  },
  {
    to: '/asistente',
    label: 'Cashly AI',
    icon: 'M10 3l1.9 5.6L17.5 10.5l-5.6 1.9L10 18l-1.9-5.6L2.5 10.5l5.6-1.9zM19 3l.7 2.3L22 6l-2.3.7L19 9l-.7-2.3L16 6l2.3-.7zM19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z',
  },
  {
    to: '/configuracion',
    label: 'Ajustes',
    mobile: false,
    icon: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  },
] as const
