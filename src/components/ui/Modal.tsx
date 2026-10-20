import { useEffect, useRef, type ReactNode } from 'react'
import { IconButton } from '@/components/fx'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

const CLOSE = 'M6 6l12 12M18 6L6 18'

/** Diálogo: hoja que sube desde abajo en móvil y tarjeta centrada en escritorio. */
export function Modal({ title, onClose, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus()
    }
  }, [onClose])

  return (
    <div className="fx-modal">
      <div className="fx-modal__overlay" onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={title} className="fx-modal__panel">
        <div className="fx-modal__grip" aria-hidden="true" />
        <div className="fx-modal__head">
          <h2 className="fx-h3">{title}</h2>
          <IconButton icon={CLOSE} label="Cerrar" size="sm" onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  )
}
