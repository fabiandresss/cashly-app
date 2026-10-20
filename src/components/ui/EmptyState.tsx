import { Icon } from '@/components/ui/Icon'

interface EmptyStateProps {
  icon: string
  title: string
  description: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="fx-stat__icon mb-5 !h-14 !w-14" aria-hidden="true">
        <Icon path={icon} className="h-6 w-6" />
      </span>
      <h2 className="fx-h3">{title}</h2>
      <p className="fx-lead mt-1.5 max-w-sm text-sm">{description}</p>
    </div>
  )
}
