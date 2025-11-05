// src/components/GallerySection.tsx
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

export type PhotoItem = {
  id: string
  title?: string
  imageUrl: string
  category: string
  tags: string[]
  createdAt?: string | number
  // opcionales para detalle
  description?: string
  author?: string
}

type Props = {
  id?: string
  title?: string
  /** Datos ya normalizados desde tu API */
  items: PhotoItem[]
  /** Listado de categorías posibles (para filtros) */
  categories: string[]
  /** Listado de etiquetas posibles (para filtros) */
  tags: string[]
  /** Page size para "Cargar más" */
  pageSize?: number
}

const useDebouncedValue = <T,>(value: T, delay = 350) => {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

export default function GallerySection({
  id = 'galeria',
  title = 'Galería de pedidos',
  items,
  categories,
  tags,
  pageSize = 12,
}: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('todas')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'reciente' | 'antiguo' | 'titulo'>(
    'reciente',
  )
  const [visible, setVisible] = useState(pageSize)

  const debouncedQuery = useDebouncedValue(query, 300)

  // Filtro + búsqueda + orden
  const filtered = useMemo(() => {
    let list = items

    // categoría
    if (category !== 'todas') {
      list = list.filter((it) => it.category === category)
    }
    // etiquetas (todas deben estar incluidas)
    if (selectedTags.length) {
      list = list.filter((it) => selectedTags.every((t) => it.tags.includes(t)))
    }
    // búsqueda por título / tags
    const q = debouncedQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((it) => {
        const hay =
          (it.title || '').toLowerCase().includes(q) ||
          it.tags.some((tg) => tg.toLowerCase().includes(q)) ||
          it.category.toLowerCase().includes(q)
        return hay
      })
    }
    // orden
    list = [...list].sort((a, b) => {
      if (sortBy === 'titulo') {
        return (a.title || '').localeCompare(b.title || '')
      }
      const da = new Date(a.createdAt || 0).getTime()
      const db = new Date(b.createdAt || 0).getTime()
      return sortBy === 'reciente' ? db - da : da - db
    })
    return list
  }, [items, category, selectedTags, debouncedQuery, sortBy])

  // reset “visible” al cambiar filtros/busqueda
  useEffect(
    () => setVisible(pageSize),
    [debouncedQuery, category, selectedTags, sortBy, pageSize],
  )

  // toggle multitag
  const toggleTag = (t: string) =>
    setSelectedTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    )

  // Reveal fallback
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]')
    const reduce = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('reveal-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            ;(e.target as HTMLElement).classList.add('reveal-in')
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.16, rootMargin: '40px 0px -20px 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const hasMore = visible < filtered.length
  const toShow = filtered.slice(0, visible)

  return (
    <section id={id} className="section alt" aria-labelledby={`${id}-title`}>
      <div className="container">
        <header className="gal-header" data-reveal>
          <div>
            <h2 id={`${id}-title`} className="h2">
              Explora nuestros pedidos
            </h2>
            <p className="lead">
              Filtra por categoría, etiquetas o busca por nombre/sabor/tema.
            </p>
          </div>

          <div className="gal-controls">
            {/* Buscador */}
            <div className="input-wrap">
              <input
                type="search"
                placeholder="Buscar (ej: Red Velvet, Spiderman, baby shower)…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar en galer\u00eda"
              />
            </div>

            {/* Categoría */}
            <div className="select-wrap">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filtrar por categor\u00eda"
              >
                <option value="todas">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Orden */}
            <div className="select-wrap">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Ordenar resultados"
              >
                <option value="reciente">Más recientes</option>
                <option value="antiguo">Más antiguos</option>
                <option value="titulo">Por título (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Etiquetas (chips) */}
          {tags.length > 0 && (
            <div
              className="chips"
              data-reveal
              role="group"
              aria-label="Filtrar por etiquetas"
            >
              {tags.map((t) => {
                const active = selectedTags.includes(t)
                return (
                  <button
                    key={t}
                    className={`chip ${active ? 'active' : ''}`}
                    onClick={() => toggleTag(t)}
                    aria-pressed={active}
                  >
                    {t}
                  </button>
                )
              })}
              {selectedTags.length > 0 && (
                <button
                  className="chip clear"
                  onClick={() => setSelectedTags([])}
                >
                  Limpiar etiquetas
                </button>
              )}
            </div>
          )}
        </header>

        {/* Grid */}
        <AnimatePresence mode="popLayout">
          <div className="gallery-grid" data-reveal>
            {toShow.map((p) => (
              <motion.figure
                key={p.id}
                className="photo-tile"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.28 }}
              >
                <div className="thumb-wrap" aria-hidden="true">
                  <img
                    src={p.imageUrl}
                    alt={p.title || 'Pedido'}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <figcaption className="tile-caption">
                  <div className="tile-title">{p.title || 'Pedido'}</div>
                  <div className="tile-meta">
                    <span className="badge">{p.category}</span>
                    {p.tags.slice(0, 2).map((tg) => (
                      <span key={tg} className="tag">
                        {tg}
                      </span>
                    ))}
                  </div>
                </figcaption>
              </motion.figure>
            ))}

            {/* Vacío */}
            {toShow.length === 0 && (
              <div className="empty">
                <p>
                  No encontramos resultados. Prueba otra búsqueda o quita
                  filtros.
                </p>
              </div>
            )}
          </div>
        </AnimatePresence>

        {/* Cargar más */}
        {hasMore && (
          <div className="load-wrap">
            <button
              className="btn"
              onClick={() => setVisible((v) => v + pageSize)}
            >
              Cargar más
            </button>
          </div>
        )}
      </div>
      <div className="divider" aria-hidden="true" />
    </section>
  )
}
