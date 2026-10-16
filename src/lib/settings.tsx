import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark'

interface SettingsValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  /** Nombre visible del usuario. Se guarda en este dispositivo hasta conectar la cuenta. */
  name: string
  setName: (name: string) => void
}

const THEME_KEY = 'cashly-theme'
const NAME_KEY = 'cashly-name'
const DEFAULT_NAME = 'Usuario'

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* almacenamiento no disponible: el valor vive solo en memoria */
  }
}

function initialTheme(): Theme {
  const stored = readStorage(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const SettingsContext = createContext<SettingsValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme)
  const [name, setNameState] = useState<string>(() => readStorage(NAME_KEY) || DEFAULT_NAME)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    writeStorage(THEME_KEY, next)
  }, [])

  const setName = useCallback((next: string) => {
    const clean = next.trim() || DEFAULT_NAME
    setNameState(clean)
    writeStorage(NAME_KEY, clean)
  }, [])

  const value = useMemo(() => ({ theme, setTheme, name, setName }), [theme, setTheme, name, setName])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings debe usarse dentro de SettingsProvider')
  return ctx
}
