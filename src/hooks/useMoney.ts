import { useMemo } from 'react'
import { formatMoney } from '@/lib/format'
import { useSettings } from '@/lib/settings'

const MASK = '$ ••••••'
const compact = new Intl.NumberFormat('es-CL', { notation: 'compact', maximumFractionDigits: 1 })

/** Formateadores de montos que respetan el modo privacidad. */
export function useMoney() {
  const { privacy } = useSettings()
  return useMemo(
    () => ({
      hidden: privacy,
      money: (value: number): string => (privacy ? MASK : formatMoney(value)),
      /** Formato compacto para ejes de gráficos; vacío en modo privacidad. */
      tick: (value: number): string => (privacy ? '' : compact.format(value)),
    }),
    [privacy],
  )
}
