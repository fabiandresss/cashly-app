import { useState } from 'react'
import { FxButton } from '@/components/fx'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      await onConfirm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la operación.')
      setLoading(false)
    }
  }

  return (
    <Modal title={title} onClose={onCancel}>
      <div className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}
        <p className="fx-lead">{message}</p>
        <div className="grid grid-cols-2 gap-3">
          <FxButton variant="soft" onClick={onCancel} disabled={loading}>
            Cancelar
          </FxButton>
          <FxButton variant="primary" onClick={() => void handleConfirm()} loading={loading}>
            {confirmLabel}
          </FxButton>
        </div>
      </div>
    </Modal>
  )
}
