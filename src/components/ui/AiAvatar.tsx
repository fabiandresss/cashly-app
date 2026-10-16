interface AiAvatarProps {
  /** Tamaño y utilidades de layout, por ejemplo "h-10 w-10". */
  className?: string
  /** Desactiva el flotado y el brillo (útil en listas largas). */
  still?: boolean
}

const STAR = 'M0 -1C0.15 -0.35 0.35 -0.15 1 0C0.35 0.15 0.15 0.35 0 1C-0.15 0.35 -0.35 0.15 -1 0C-0.35 -0.15 -0.15 -0.35 0 -1z'

/**
 * Cashly AI: burbuja de conversación esmeralda con una chispa central que "respira"
 * y destellos que titilan. Las animaciones respetan prefers-reduced-motion.
 */
export function AiAvatar({ className = 'h-10 w-10', still = false }: AiAvatarProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${
        still ? '' : 'animate-ai-bob'
      } ${className}`}
    >
      <span
        className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-brand-300 via-brand-500 to-brand-800 ${
          still ? 'shadow-card' : 'animate-ai-glow'
        }`}
      >
        <svg viewBox="0 0 64 64" className="h-[72%] w-[72%]" role="img" aria-label="Cashly AI">
          <defs>
            <linearGradient id="ai-bubble" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#d1fae5" />
            </linearGradient>
          </defs>

          {/* Burbuja de conversación con cola */}
          <path
            d="M18 10h28a11 11 0 0111 11v16a11 11 0 01-11 11H31l-11 9.5V48h-2A11 11 0 017 37V21a11 11 0 0111-11z"
            fill="url(#ai-bubble)"
          />

          {/* Chispa central */}
          <g transform="translate(32 29)">
            <g
              className={still ? '' : 'animate-ai-pulse'}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            >
              <path d={STAR} transform="scale(12)" fill="#059669" />
            </g>
          </g>

          {/* Destellos pequeños */}
          <g transform="translate(46 20)">
            <g
              className={still ? '' : 'animate-ai-twinkle'}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            >
              <path d={STAR} transform="scale(4.2)" fill="#10b981" />
            </g>
          </g>
          <g transform="translate(19 38)">
            <g
              className={still ? '' : 'animate-ai-twinkle'}
              style={{ transformBox: 'fill-box', transformOrigin: 'center', animationDelay: '1.1s' }}
            >
              <path d={STAR} transform="scale(3.2)" fill="#34d399" />
            </g>
          </g>
        </svg>
      </span>
    </span>
  )
}
