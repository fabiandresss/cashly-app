interface LogoMarkProps {
  className?: string
}

/** Isotipo de Cashly: una "C" geométrica de la que sale una flecha ascendente. */
export function LogoMark({ className = 'h-10 w-10' }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Cashly">
      <rect width="64" height="64" rx="14" fill="#064e3b" />
      <path d="M42.7 23A14 14 0 1 0 42.7 41" fill="none" stroke="#ffffff" strokeWidth="8" />
      <path
        d="M34 38L50 22M41 22H50V31"
        fill="none"
        stroke="#34d399"
        strokeWidth="5"
        strokeLinejoin="miter"
      />
    </svg>
  )
}
