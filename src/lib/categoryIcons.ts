export interface CategoryIconDef {
  label: string
  /** Path SVG (viewBox 24x24, trazo). */
  path: string
}

export const CATEGORY_ICONS: Record<string, CategoryIconDef> = {
  tag: { label: 'Etiqueta', path: 'M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8zM7.5 7.5h.01' },
  cart: { label: 'Carrito', path: 'M3 4h2l2.4 11.2a2 2 0 002 1.6h7.7a2 2 0 002-1.5L21 8H6M10 21h.01M18 21h.01' },
  food: { label: 'Comida', path: 'M5 3v8a2 2 0 002 2 2 2 0 002-2V3M7 3v18M17 21V3c-2 1-3 4-3 8h3' },
  coffee: { label: 'Café', path: 'M17 8h1a3 3 0 010 6h-1M3 8h14v7a4 4 0 01-4 4H7a4 4 0 01-4-4zM6 1v3M10 1v3M14 1v3' },
  car: { label: 'Auto', path: 'M3 13l2-6a2 2 0 012-1.5h10A2 2 0 0119 7l2 6v5h-3v-2H6v2H3zM7 13h.01M17 13h.01' },
  plane: { label: 'Viajes', path: 'M17.8 19.2L16 11l3.5-3.5A2.1 2.1 0 0016.5 4.5L13 8 4.8 6.2 3.4 7.6l6.3 3.2-3.1 3.1-2.9-.4L2.5 14.9l4.1 1.5 1.5 4.1 1.4-1.2-.4-2.9 3.1-3.1 3.2 6.3z' },
  home: { label: 'Hogar', path: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10' },
  bolt: { label: 'Servicios', path: 'M13 2L4 14h7l-1 8 9-12h-7z' },
  phone: { label: 'Teléfono', path: 'M7 2h10v20H7zM11 18h2' },
  heart: { label: 'Salud', path: 'M20.8 5.6a5.5 5.5 0 00-7.8 0L12 6.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z' },
  gym: { label: 'Deporte', path: 'M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12' },
  book: { label: 'Educación', path: 'M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5zM4 19.5A2.5 2.5 0 006.5 22H20v-5' },
  film: { label: 'Cine', path: 'M4 4h16v16H4zM4 9h16M4 15h16M9 4v16M15 4v16' },
  gamepad: { label: 'Juegos', path: 'M6 11h4M8 9v4M15 12h.01M18 10h.01M17.3 5H6.7a4 4 0 00-3.9 3.2L2 14a3 3 0 005.3 2l1.2-2h7l1.2 2a3 3 0 005.3-2l-.8-5.8A4 4 0 0017.3 5z' },
  bag: { label: 'Compras', path: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0' },
  gift: { label: 'Regalos', path: 'M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 110-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 100-5C13 2 12 7 12 7z' },
  paw: { label: 'Mascotas', path: 'M12 17c-2.5 0-4.5-1.5-4.5-3.5S10 10 12 10s4.5 1.5 4.5 3.5S14.5 17 12 17zM5 9.5h.01M9 5.5h.01M15 5.5h.01M19 9.5h.01' },
  shield: { label: 'Seguros', path: 'M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z' },
  wallet: { label: 'Billetera', path: 'M3 7a2 2 0 012-2h13v4M3 7v10a2 2 0 002 2h15V9H5a2 2 0 01-2-2zM16 14h.01' },
  briefcase: { label: 'Trabajo', path: 'M3 8h18v12H3zM8 8V5a1 1 0 011-1h6a1 1 0 011 1v3M3 13h18' },
  laptop: { label: 'Freelance', path: 'M4 5h16v11H4zM2 20h20' },
  trending: { label: 'Inversión', path: 'M3 17l6-6 4 4 8-8M15 7h6v6' },
  bank: { label: 'Banco', path: 'M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18' },
  star: { label: 'Favorito', path: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3 1.2-6.8-5-4.9 6.9-1z' },
  dots: { label: 'Otros', path: 'M5 12h.01M12 12h.01M19 12h.01' },
}

export const ICON_KEYS: readonly string[] = Object.keys(CATEGORY_ICONS)

const DEFAULT_BY_NAME: Record<string, string> = {
  alimentación: 'food',
  transporte: 'car',
  vivienda: 'home',
  servicios: 'bolt',
  salud: 'heart',
  educación: 'book',
  entretenimiento: 'film',
  compras: 'bag',
  'otros gastos': 'dots',
  sueldo: 'wallet',
  freelance: 'laptop',
  inversiones: 'trending',
  'otros ingresos': 'gift',
}

/** Devuelve una clave de ícono válida; si no hay, deduce una por el nombre. */
export function resolveIcon(name: string, icon?: unknown): string {
  if (typeof icon === 'string' && icon in CATEGORY_ICONS) return icon
  return DEFAULT_BY_NAME[name.trim().toLowerCase()] ?? 'tag'
}

export function iconPath(key: string): string {
  return (CATEGORY_ICONS[key] ?? CATEGORY_ICONS.tag)!.path
}
