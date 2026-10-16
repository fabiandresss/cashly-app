interface PageHeaderProps {
  title: string
  description: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-8 animate-fade-up">
      <h1 className="bg-gradient-to-r from-brand-900 to-brand-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
        {title}
      </h1>
      <p className="mt-1.5 text-sm text-muted">{description}</p>
    </header>
  )
}
