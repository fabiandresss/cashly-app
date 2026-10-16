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
        <p className="pr-3 text-sm font-medium text-muted">{label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center sm:h-10 sm:w-10 justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow">
          <Icon path={icon} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-heading sm:mt-4 sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </Card>
  )
}
