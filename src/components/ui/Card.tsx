import type { CSSProperties, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  /** Retraso de entrada en ms, para animaciones escalonadas. */
  delay?: number
  interactive?: boolean
}

export function Card({ children, className = '', delay = 0, interactive = false }: CardProps) {
  const style: CSSProperties = { animationDelay: `${delay}ms` }
  return (
    <div
      style={style}
      className={`animate-fade-up rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5 ${
        interactive
          ? 'transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
