import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'

interface StatCardProps {
  label: string
  value: string
  hint: string
  icon: string
  delay?: number
}

export function StatCard({ label, value, hint, icon, delay }: StatCardProps) {
  return (
    <Card interactive delay={delay}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow">
          <Icon path={icon} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-heading">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </Card>
  )
}
