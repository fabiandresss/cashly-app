import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'

export function PresupuestosPage() {
  return (
    <>
      <PageHeader title="Presupuestos" description="Define límites de gasto y sigue su cumplimiento." />
      <Card delay={100}>
        <EmptyState
          icon="M12 3a9 9 0 109 9h-9V3z"
          title="Disponible en la fase 5"
          description="Esta sección se activará cuando se conecte con los datos reales de tu cuenta."
        />
      </Card>
    </>
  )
}
