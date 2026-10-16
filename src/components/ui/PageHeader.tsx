interface PageHeaderProps {
  title: string
  description: string
  /** Versión con menos margen y título más pequeño, para pantallas de altura ajustada. */
  compact?: boolean
}

export function PageHeader({ title, description, compact = false }: PageHeaderProps) {
  return (
    <header className={`animate-fade-up ${compact ? 'mb-4' : 'mb-8'}`}>
      <h1
        className={`bg-gradient-to-r from-heading to-brand-500 bg-clip-text font-bold tracking-tight text-transparent ${
          compact ? 'text-2xl' : 'text-3xl'
        }`}
      >
        {title}
      </h1>
      <p className="mt-1.5 text-sm text-muted">{description}</p>
    </header>
  )
}
