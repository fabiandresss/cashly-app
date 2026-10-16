import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'

export function AsistentePage() {
  return (
    <>
      <PageHeader title="Asistente" description="Consulta tus finanzas con inteligencia artificial." />
      <Card delay={100}>
        <EmptyState
          icon="M21 12a8 8 0 01-11.5 7.2L4 20l1-4.5A8 8 0 1121 12z"
          title="Disponible en la fase 7"
          description="Esta sección se activará cuando se conecte con los datos reales de tu cuenta."
        />
      </Card>
    </>
  )
}
