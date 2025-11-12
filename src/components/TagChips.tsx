'use client'

import type { UiTag } from '@/types/gallery'

export default function TagChips({
  catalog,
  selected,
  onToggle,
  onClear,
  showAll,
  onToggleAll,
  max = 12,
}: {
  catalog: UiTag[]
  selected: string[]      // norms
  onToggle: (norm: string) => void
  onClear: () => void
  showAll: boolean
  onToggleAll: () => void
  max?: number
}) {
  const list = showAll ? catalog : catalog.slice(0, max)

  return (
    <div className="chips" role="group" aria-label="Filtrar por etiquetas">
      {list.map(({ norm, label, count }) => {
        const active = selected.includes(norm)
        return (
          <button
            key={norm}
            className={`chip ${active ? 'active' : ''}`}
            onClick={() => onToggle(norm)}
            aria-pressed={active}
            type="button"
            title={`${count} coincidencia${count === 1 ? '' : 's'}`}
          >
            {label}
          </button>
        )
      })}

      {catalog.length > max && (
        <button className="chip clear" onClick={onToggleAll} type="button">
          {showAll ? 'Ver menos' : `Ver todas (${catalog.length})`}
        </button>
      )}

      {selected.length > 0 && (
        <button className="chip clear" onClick={onClear} type="button">
          Limpiar etiquetas
        </button>
      )}
    </div>
  )
}
