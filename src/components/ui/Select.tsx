import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/components/ui/Icon'

export interface SelectOption {
  value: string
  label: string
  /** Path SVG opcional que se muestra junto a la opción. */
  icon?: string | undefined
  /** Color del ícono (por ejemplo, el de la categoría). */
  color?: string | undefined
}

interface SelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly SelectOption[]
}

const CHEVRON = 'M6 9l6 6 6-6'
const CHECK = 'M5 12l5 5L20 7'
const MENU_MAX_HEIGHT = 260
const GAP = 6

interface Placement {
  top: number
  left: number
  width: number
  maxHeight: number
  above: boolean
}

function OptionIcon({ option }: { option: SelectOption }) {
  if (!option.icon) return null
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
      style={{ backgroundColor: option.color ?? '#64748b' }}
      aria-hidden="true"
    >
      <Icon path={option.icon} className="h-4 w-4" />
    </span>
  )
}

export function Select({ label, value, onChange, options }: SelectProps) {
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [placement, setPlacement] = useState<Placement | null>(null)

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  )
  const selected = options[selectedIndex]

  const close = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  const openMenu = useCallback(() => {
    setActive(selectedIndex)
    setOpen(true)
  }, [selectedIndex])

  const choose = useCallback(
    (index: number) => {
      const option = options[index]
      if (option) onChange(option.value)
      close()
    },
    [options, onChange, close],
  )

  // Posiciona el menú junto al botón; si no cabe abajo, lo abre hacia arriba.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - GAP - 8
    const spaceAbove = rect.top - GAP - 8
    const above = spaceBelow < 180 && spaceAbove > spaceBelow
    const maxHeight = Math.min(MENU_MAX_HEIGHT, above ? spaceAbove : spaceBelow)
    setPlacement({
      top: above ? rect.top - GAP : rect.bottom + GAP,
      left: rect.left,
      width: rect.width,
      maxHeight,
      above,
    })
  }, [open])

  // Cierra al hacer clic fuera, al redimensionar o al hacer scroll fuera del menú.
  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      setOpen(false)
    }
    const onScroll = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    const onResize = () => setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  // Mantiene visible la opción activa.
  useEffect(() => {
    if (!open) return
    menuRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active, open, placement])

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openMenu()
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActive((i) => Math.min(options.length - 1, i + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActive((i) => Math.max(0, i - 1))
        break
      case 'Home':
        e.preventDefault()
        setActive(0)
        break
      case 'End':
        e.preventDefault()
        setActive(options.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        choose(active)
        break
      case 'Escape':
        e.preventDefault()
        e.stopPropagation()
        close()
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  return (
    <div>
      <label id={`${id}-label`} className="mb-1.5 block text-sm font-medium text-heading">
        {label}
      </label>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-labelledby={`${id}-label`}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={handleKeyDown}
        className={`flex w-full items-center gap-3 rounded-xl border bg-surface px-3.5 py-2.5 text-left text-sm text-ink shadow-sm outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 ${
          open ? 'border-brand-500 ring-4 ring-brand-500/15' : 'border-line hover:border-brand-200'
        }`}
      >
        {selected && <OptionIcon option={selected} />}
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? ''}</span>
        <Icon
          path={CHEVRON}
          className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open &&
        placement &&
        createPortal(
          <ul
            ref={menuRef}
            id={`${id}-list`}
            role="listbox"
            aria-labelledby={`${id}-label`}
            style={{
              position: 'fixed',
              left: placement.left,
              width: placement.width,
              maxHeight: placement.maxHeight,
              ...(placement.above
                ? { bottom: window.innerHeight - placement.top }
                : { top: placement.top }),
            }}
            className={`z-50 overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-lift ${
              placement.above ? 'origin-bottom animate-pop-up' : 'origin-top animate-pop'
            }`}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value
              const isActive = index === active
              return (
                <li
                  key={option.value}
                  id={`${id}-opt-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  onPointerEnter={() => setActive(index)}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => choose(index)}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-colors ${
                    isActive ? 'bg-brand-50' : ''
                  } ${isSelected ? 'font-semibold text-heading' : 'text-ink'}`}
                >
                  <OptionIcon option={option} />
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {isSelected && <Icon path={CHECK} className="h-4 w-4 shrink-0 text-link" />}
                </li>
              )
            })}
          </ul>,
          document.body,
        )}
    </div>
  )
}
