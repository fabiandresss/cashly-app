import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark'

interface SettingsValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  /** Modo privacidad: oculta los montos en pantalla. */
  privacy: boolean
  setPrivacy: (value: boolean) => void
}

const THEME_KEY = 'cashly-theme'
const PRIVACY_KEY = 'cashly-privacy'

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
  const [privacy, setPrivacyState] = useState<boolean>(() => readStorage(PRIVACY_KEY) === '1')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    writeStorage(THEME_KEY, next)
  }, [])

  const setPrivacy = useCallback((next: boolean) => {
    setPrivacyState(next)
    writeStorage(PRIVACY_KEY, next ? '1' : '0')
  }, [])

  const value = useMemo(
    () => ({ theme, setTheme, privacy, setPrivacy }),
    [theme, setTheme, privacy, setPrivacy],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings debe usarse dentro de SettingsProvider')
  return ctx
}
