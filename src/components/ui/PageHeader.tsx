import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description: string
  /** Versión con menos margen, para pantallas de altura ajustada. */
  compact?: boolean
  /** Etiqueta mono sobre el título. */
  eyebrow?: ReactNode
}

/** Titular de dos tonos: título en tinta y bajada en gris. */
export function PageHeader({ title, description, compact = false, eyebrow }: PageHeaderProps) {
  return (
    <header className={`fx-enter min-w-0 ${compact ? 'mb-4' : 'mb-5 sm:mb-7'}`}>
      {eyebrow && <p className="fx-eyebrow mb-2">{eyebrow}</p>}
      <h1 className={compact ? 'fx-h2' : 'fx-h1'}>{title}</h1>
      <p className="fx-lead mt-2 max-w-xl">{description}</p>
    </header>
  )
}
