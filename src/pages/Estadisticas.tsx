import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'

export function EstadisticasPage() {
  return (
    <>
      <PageHeader title="Estadísticas" description="Analiza tus hábitos financieros." />
      <Card delay={100}>
        <EmptyState
          icon="M4 20V10M10 20V4M16 20v-8M22 20H2"
          title="Disponible en la fase 6"
          description="Esta sección se activará cuando se conecte con los datos reales de tu cuenta."
        />
      </Card>
    </>
  )
}
