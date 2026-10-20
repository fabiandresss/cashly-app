import { useEffect, type RefObject } from 'react'

/** Primer ancestro que hace scroll vertical (en la app, el contenedor de AppShell). */
function scrollParent(el: HTMLElement): HTMLElement | Window {
  let node = el.parentElement
  while (node) {
    const { overflowY } = getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll') return node
    node = node.parentElement
  }
  return window
}

/**
 * Mide cuánto ha tapado `cover` al elemento fijo `target` al hacer scroll (0 → 1)
 * y lo expone como la variable CSS --cover en `target`, sin re-renderizar.
 */
export function useCoverProgress(target: RefObject<HTMLElement | null>, cover: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = target.current
    const over = cover.current
    if (!el || !over) return
    const parent = scrollParent(el)
    let frame = 0

    const update = () => {
      frame = 0
      const hero = el.getBoundingClientRect()
      const sheet = over.getBoundingClientRect()
      // Distancia inicial entre ambos bordes superiores: alto del hero menos el solape de la hoja.
      const start = hero.height + (parseFloat(getComputedStyle(over).marginTop) || 0) || 1
      const progress = Math.min(1, Math.max(0, 1 - (sheet.top - hero.top) / start))
      el.style.setProperty('--cover', progress.toFixed(3))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    parent.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      parent.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [target, cover])
}
