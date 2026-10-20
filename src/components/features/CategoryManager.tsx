import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Icon } from '@/components/ui/Icon'
import { TextField } from '@/components/ui/TextField'
import { TypeToggle } from '@/components/ui/TypeToggle'
import { createCategory, deleteCategory, updateCategory } from '@/lib/data'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { CATEGORY_ICONS, ICON_KEYS, iconPath } from '@/lib/categoryIcons'
import type { Category, TransactionType } from '@/types/db'

const PALETTE = ['#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#64748b']

const EDIT = 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z'
const TRASH = 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6'

export function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-2">
      {PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={`Color ${color}`}
          onClick={() => onChange(color)}
          style={{ backgroundColor: color }}
          className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${
            value === color ? 'ring-2 ring-offset-2 ring-offset-surface ring-brand-500' : ''
          }`}
        />
      ))}
    </div>
  )
}

export function IconPicker({
  value,
  color,
  onChange,
}: {
  value: string
  color: string
  onChange: (icon: string) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Ícono"
      className="grid max-h-56 grid-cols-6 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-8 lg:grid-cols-5 xl:grid-cols-6"
    >
      {ICON_KEYS.map((key) => {
        const active = value === key
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={CATEGORY_ICONS[key]?.label ?? key}
            title={CATEGORY_ICONS[key]?.label ?? key}
            onClick={() => onChange(key)}
            style={active ? { backgroundColor: color, color: '#fff' } : undefined}
            className={`flex h-10 items-center justify-center rounded-xl border transition-all ${
              active ? 'border-transparent shadow-card' : 'border-line text-muted hover:border-brand-200 hover:text-ink'
            }`}
          >
            <Icon path={iconPath(key)} className="h-5 w-5" />
          </button>
        )
      })}
    </div>
  )
}

interface CategoryManagerProps {
  categories: readonly Category[]
  onChanged: () => void
}

export function CategoryManager({ categories, onChanged }: CategoryManagerProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<TransactionType>('expense')
  const [color, setColor] = useState(PALETTE[0] ?? '#10b981')
  const [icon, setIcon] = useState('tag')
  const [nameError, setNameError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [editing, setEditing] = useState<Category | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editIcon, setEditIcon] = useState('tag')
  const [editError, setEditError] = useState<string | null>(null)

  const [toDelete, setToDelete] = useState<Category | null>(null)

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    const trimmed = name.trim()
    if (trimmed.length < 1 || trimmed.length > 40) {
      setNameError('El nombre debe tener entre 1 y 40 caracteres.')
      return
    }
    setNameError(undefined)
    setSaving(true)
    try {
      await createCategory({ name: trimmed, type, color, icon })
      setName('')
      setIcon('tag')
      onChanged()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo crear la categoría.')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(category: Category) {
    setEditing(category)
    setEditName(category.name)
    setEditColor(category.color)
    setEditIcon(category.icon)
    setEditError(null)
  }

  async function handleSaveEdit() {
    if (!editing) return
    const trimmed = editName.trim()
    if (trimmed.length < 1 || trimmed.length > 40) {
      setEditError('El nombre debe tener entre 1 y 40 caracteres.')
      return
    }
    try {
      await updateCategory(editing.id, { name: trimmed, color: editColor, icon: editIcon })
      setEditing(null)
      onChanged()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'No se pudo actualizar la categoría.')
    }
  }

  const groups: { type: TransactionType; title: string }[] = [
    { type: 'expense', title: 'Gastos' },
    { type: 'income', title: 'Ingresos' },
  ]

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-1" delay={80}>
        <h2 className="text-base font-semibold text-heading">Nueva categoría</h2>
        <form onSubmit={handleCreate} noValidate className="mt-4 space-y-4">
          {formError && <Alert tone="error">{formError}</Alert>}
          <TypeToggle value={type} onChange={setType} />
          <TextField
            label="Nombre"
            name="category-name"
            placeholder="Ej: Mascotas"
            maxLength={40}
            value={name}
            onChange={setName}
            error={nameError}
          />
          <div>
            <p className="mb-1.5 text-sm font-medium text-heading">Color</p>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-heading">Ícono</p>
            <IconPicker value={icon} color={color} onChange={setIcon} />
          </div>
          <Button type="submit" loading={saving}>
            Crear categoría
          </Button>
        </form>
      </Card>

      <div className="space-y-5 lg:col-span-2">
        {groups.map((group, index) => {
          const items = categories.filter((c) => c.type === group.type)
          return (
            <Card key={group.type} delay={160 + index * 80}>
              <h2 className="text-base font-semibold text-heading">
                {group.title} <span className="text-sm font-normal text-muted">({items.length})</span>
              </h2>
              {items.length === 0 ? (
                <p className="mt-3 text-sm text-muted">Aún no tienes categorías de este tipo.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {items.map((category) => (
                    <li key={category.id} className="py-2.5">
                      {editing?.id === category.id ? (
                        <div className="space-y-3">
                          {editError && <Alert tone="error">{editError}</Alert>}
                          <TextField
                            label="Nombre"
                            name="edit-name"
                            maxLength={40}
                            value={editName}
                            onChange={setEditName}
                          />
                          <ColorPicker value={editColor} onChange={setEditColor} />
                          <IconPicker value={editIcon} color={editColor} onChange={setEditIcon} />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              className="fx-btn fx-btn--accent fx-btn--sm"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditing(null)}
                              className="fx-btn fx-btn--soft fx-btn--sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <CategoryBadge
                            icon={category.icon}
                            color={category.color}
                            className="h-9 w-9"
                            iconClassName="h-[18px] w-[18px]"
                          />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{category.name}</span>
                          <button
                            type="button"
                            onClick={() => startEdit(category)}
                            aria-label={`Editar ${category.name}`}
                            className="fx-iconbtn fx-iconbtn--ghost fx-iconbtn--sm"
                          >
                            <Icon path={EDIT} className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setToDelete(category)}
                            aria-label={`Eliminar ${category.name}`}
                            className="fx-iconbtn fx-iconbtn--ghost fx-iconbtn--sm"
                          >
                            <Icon path={TRASH} className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )
        })}
      </div>

      {toDelete && (
        <ConfirmDialog
          title="Eliminar categoría"
          message={`Se eliminará "${toDelete.name}". Los movimientos que la usan quedarán como "Sin categoría".`}
          confirmLabel="Eliminar"
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            await deleteCategory(toDelete.id)
            setToDelete(null)
            onChanged()
          }}
        />
      )}
    </div>
  )
}
