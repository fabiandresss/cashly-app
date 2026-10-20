import type { CSSProperties, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  /** Retraso de entrada en ms, para animaciones escalonadas. */
  delay?: number
  interactive?: boolean
  soft?: boolean
}

export function Card({ children, className = '', delay = 0, soft = false }: CardProps) {
  const style: CSSProperties = { animationDelay: `${delay}ms` }
  return (
    <div style={style} className={`fx-card fx-enter ${soft ? 'fx-card--soft' : ''} ${className}`}>
      {children}
    </div>
  )
}
