import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'

export function MovimientosPage() {
  return (
    <>
      <PageHeader title="Movimientos" description="Registra y gestiona tus ingresos y gastos." />
      <Card delay={100}>
        <EmptyState
          icon="M7 7h13M7 7l3-3M7 7l3 3M17 17H4M17 17l-3-3M17 17l-3 3"
          title="Disponible en la fase 3"
          description="Esta sección se activará cuando se conecte con los datos reales de tu cuenta."
        />
      </Card>
    </>
  )
}
