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
  creditcard: { label: 'Tarjeta', path: 'M3 6h18v12H3zM3 10h18M7 15h3' },
  receipt: { label: 'Boleta', path: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6' },
  coins: { label: 'Monedas', path: 'M12 8c3.3 0 6-1.3 6-3s-2.7-3-6-3-6 1.3-6 3 2.7 3 6 3zM6 5v4c0 1.7 2.7 3 6 3s6-1.3 6-3V5M6 11v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4' },
  piggy: { label: 'Ahorro', path: 'M5 11a7 6 0 0114 0v3a4 4 0 01-4 4H9a4 4 0 01-4-4zM9 18v2M15 18v2M15 8h.01M2 11h3' },
  target: { label: 'Meta', path: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 17a5 5 0 100-10 5 5 0 000 10zM12 13a1 1 0 100-2 1 1 0 000 2z' },
  trophy: { label: 'Logro', path: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3' },
  rocket: { label: 'Proyecto', path: 'M5 15c-1 1-1.5 4-1.5 4s3-.5 4-1.5M12 15l-3-3a22 22 0 012-4 12 12 0 019-5c0 3-1 7-5 9a22 22 0 01-4 2zM9 12H4s.5-3 2-4c1.6-1 5 0 5 0M12 15v5s3-.5 4-2c1-1.6 0-5 0-5' },
  shirt: { label: 'Ropa', path: 'M8 3L3 6l2 4 3-1v11h8V9l3 1 2-4-5-3a4 4 0 01-8 0z' },
  scissors: { label: 'Peluquería', path: 'M6 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12' },
  pill: { label: 'Farmacia', path: 'M10.5 20.5l-7-7a5 5 0 017-7l7 7a5 5 0 01-7 7zM8.5 8.5l7 7' },
  pulse: { label: 'Salud', path: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  users: { label: 'Familia', path: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8' },
  user: { label: 'Personal', path: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z' },
  smile: { label: 'Ocio', path: 'M12 21a9 9 0 100-18 9 9 0 000 18zM8 14a5 5 0 008 0M9 9h.01M15 9h.01' },
  music: { label: 'Música', path: 'M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z' },
  camera: { label: 'Fotos', path: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z' },
  tv: { label: 'Streaming', path: 'M3 7h18v13H3zM8 2l4 5 4-5' },
  wifi: { label: 'Internet', path: 'M5 12.5a10 10 0 0114 0M8.5 16a5 5 0 017 0M12 20h.01M1.5 9a15 15 0 0121 0' },
  water: { label: 'Agua', path: 'M12 2.7l5.7 5.6a8 8 0 11-11.4 0z' },
  flame: { label: 'Gas', path: 'M12 22a7 7 0 007-7c0-3-2-5-3-8-2 1-3 3-3 5-1-1-3-3-2-7-4 3-6 7-6 10a7 7 0 007 7z' },
  wrench: { label: 'Mantención', path: 'M14.7 6.3a4 4 0 005 5l-9.4 9.4a2.1 2.1 0 01-3-3zM14.7 6.3a4 4 0 00-5.4-5.4l2.6 2.6-1.8 1.8-2.6-2.6a4 4 0 005.4 5.4' },
  bed: { label: 'Hogar', path: 'M3 18v-8a2 2 0 012-2h14a2 2 0 012 2v8M3 14h18M3 20v-2M21 20v-2M7 11h4' },
  beer: { label: 'Bar', path: 'M5 8h10v12H5zM15 10h3a2 2 0 012 2v3a2 2 0 01-2 2h-3M8 3v2M12 3v2' },
  wine: { label: 'Vino', path: 'M8 22h8M12 15v7M7 3h10l-.5 6a4.5 4.5 0 01-9 0z' },
  cake: { label: 'Celebración', path: 'M4 20h16v-7a2 2 0 00-2-2H6a2 2 0 00-2 2zM4 16c2 1.5 3 1.5 5 0s3-1.5 5 0 3 1.5 6 0M12 11V7M12 4v.01' },
  school: { label: 'Estudios', path: 'M2 9l10-5 10 5-10 5zM6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v6' },
  umbrella: { label: 'Vacaciones', path: 'M12 3a9 9 0 019 9H3a9 9 0 019-9zM12 12v6a2 2 0 004 0' },
  leaf: { label: 'Naturaleza', path: 'M11 20A7 7 0 019.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.5 2 8 0 5.5-4.8 10-10 10zM2 21c0-3 1.9-5.5 6-7' },
  sun: { label: 'Sol', path: 'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4' },
  key: { label: 'Arriendo', path: 'M21 2l-2 2M15.5 7.5l3 3L22 7l-3-3M11.4 11.6a5.5 5.5 0 11-7.8 7.8 5.5 5.5 0 017.8-7.8zM11.4 11.6L15.5 7.5' },
  lock: { label: 'Seguridad', path: 'M5 11h14v10H5zM8 11V7a4 4 0 018 0v4' },
  calendar: { label: 'Calendario', path: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18' },
  clock: { label: 'Tiempo', path: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2' },
  mail: { label: 'Correo', path: 'M3 5h18v14H3zM3 7l9 6 9-6' },
  package: { label: 'Envíos', path: 'M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v9' },
  truck: { label: 'Delivery', path: 'M1 4h13v12H1zM14 8h5l3 4v4h-8zM6 19a2 2 0 100-4 2 2 0 000 4zM18 19a2 2 0 100-4 2 2 0 000 4z' },
  globe: { label: 'Mundo', path: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18' },
  bike: { label: 'Bicicleta', path: 'M5.5 20a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM18.5 20a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM12 17.5l-3-6 3-3h4M15 8.5l3.5 8' },
  bus: { label: 'Bus', path: 'M4 4h16v13H4zM4 11h16M8 21v-4M16 21v-4M8 14h.01M16 14h.01' },
  fuel: { label: 'Bencina', path: 'M4 21V4a1 1 0 011-1h7a1 1 0 011 1v17M3 21h11M13 9h3a2 2 0 012 2v6a1.5 1.5 0 003 0V9l-3-3M6 8h5' },
  percent: { label: 'Impuestos', path: 'M19 5L5 19M6.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM17.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z' },
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
