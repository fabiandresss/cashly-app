interface LogoFullProps {
  /**
   * dark: texto blanco, para fondos oscuros.
   * light: texto verde profundo, para fondos claros.
   * auto: cambia según el tema de la app.
   */
  variant?: 'dark' | 'light' | 'auto'
  className?: string
}

const LOGO_ASPECT = { width: 477, height: 223 }

/** Logo completo de Cashly (ícono + nombre). */
export function LogoFull({ variant = 'auto', className = 'h-12' }: LogoFullProps) {
  const dims = { width: LOGO_ASPECT.width, height: LOGO_ASPECT.height }
  if (variant === 'dark') {
    return <img src="/brand/logo-dark.png" alt="Cashly" {...dims} className={`w-auto ${className}`} />
  }
  if (variant === 'light') {
    return <img src="/brand/logo-light.png" alt="Cashly" {...dims} className={`w-auto ${className}`} />
  }
  return (
    <>
      <img src="/brand/logo-light.png" alt="Cashly" {...dims} className={`w-auto dark:hidden ${className}`} />
      <img src="/brand/logo-dark.png" alt="Cashly" {...dims} className={`hidden w-auto dark:block ${className}`} />
    </>
  )
}

interface LogoMarkProps {
  className?: string
}

/** Ícono de Cashly sobre su cuadrado verde oscuro, igual que el favicon. */
export function LogoMark({ className = 'h-10 w-10' }: LogoMarkProps) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-[#084430] shadow-card ${className}`}>
      <img src="/brand/icon.png" alt="Cashly" className="h-[62%] w-auto" />
    </span>
  )
}
