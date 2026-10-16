import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'

export function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Resumen de tu situación financiera." />
      <Card>
        <p className="text-sm text-muted">Esta sección se implementará en la fase 4.</p>
      </Card>
    </>
  )
}
