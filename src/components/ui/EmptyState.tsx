import { Icon } from '@/components/ui/Icon'

interface EmptyStateProps {
  icon: string
  title: string
  description: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-5 flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-glow">
        <Icon path={icon} className="h-8 w-8" />
      </span>
      <h2 className="text-lg font-semibold text-brand-900">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
    </div>
  )
}
