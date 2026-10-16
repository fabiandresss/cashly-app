import type { ReactNode } from 'react'

interface AlertProps {
  tone: 'error' | 'success'
  children: ReactNode
}

export function Alert({ tone, children }: AlertProps) {
  const styles =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200'
      : 'border-brand-200 bg-brand-50 text-heading'
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-3.5 py-3 text-sm ${styles}`}>
      {children}
    </div>
  )
}
