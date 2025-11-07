// src/components/GallerySection.tsx
'use client'

import { db } from '@/firebase/config'
import { collection, getDocs } from 'firebase/firestore'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

export type PhotoItem = {
  id: string
  title?: string
  imageUrl: string
  publicId?: string
  category: string
  tags: string[]
  createdAt?: string | number
  description?: string
  author?: string
}

type Props = {
  id?: string
  title?: string
  /** Page size para "Cargar más" */
  pageSize?: number
}

/** Debounce mini hook */
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
  pageSize = 12,
}: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [items, setItems] = useState<PhotoItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])

  // Filtros UI
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('todas')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'reciente' | 'antiguo' | 'titulo'>(
    'reciente',
  )
  const [visible, setVisible] = useState(pageSize)
  const debouncedQuery = useDebouncedValue(query, 300)

  // Cargar Firestore (categories + gallery)
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        // Categorías
        const cSnap = await getDocs(collection(db, 'categories'))
        const cList = cSnap.docs
          .map((d) => (d.data() as any)?.name)
          .filter(Boolean) as string[]
        setCategories(cList)

        // Gallery
        const gSnap = await getDocs(collection(db, 'gallery'))
        const list: PhotoItem[] = gSnap.docs.map((d) => {
          const data = d.data() as any
          // createdAt puede ser Timestamp o undefined
          const created =
            (data?.createdAt?.toMillis && data.createdAt.toMillis()) ||
            (typeof data?.createdAt === 'number' && data.createdAt) ||
            (typeof data?.createdAt === 'string' &&
              Date.parse(data.createdAt)) ||
            0

          return {
            id: d.id,
            title: data?.title || '',
            imageUrl: data?.imageUrl,
            publicId: data?.publicId,
            category: data?.category || '',
            tags: Array.isArray(data?.tags) ? data.tags : [],
            createdAt: created,
            description: data?.description,
            author: data?.author,
          }
        })

        setItems(list)

        // Tags únicas
        const tagSet = new Set<string>()
        list.forEach((it) =>
          it.tags?.forEach?.((t: string) => t && tagSet.add(t)),
        )
        setAllTags(Array.from(tagSet).sort((a, b) => a.localeCompare(b)))
      } catch (e: any) {
        console.error(e)
        setError('No se pudieron cargar los datos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // transformar URL con Cloudinary (optimizado)
  // Reemplaza tu clTransform por esto:
  // 👇 reemplaza tu clTransform por este:
  const clTransform = (url: string, publicId?: string) => {
    // 1) intenta leer el cloudName desde env
    let cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined

    // 2) si no viene por env, intenta deducirlo desde imageUrl (docs viejos/bulk)
    if (!cloud && url) {
      // coincide: https://res.cloudinary.com/<cloud>/image/upload/...
      const m = url.match(/res\.cloudinary\.com\/([^/]+)\/image\/upload\//i)
      if (m?.[1]) cloud = m[1]
    }

    // 3) si tenemos publicId y cloud, construimos URL canónica (forzando jpg)
    if (cloud && publicId) {
      return `https://res.cloudinary.com/${cloud}/image/upload/f_jpg,q_auto,w_900,c_limit/${publicId}.jpg`
    }

    // 4) si NO hay publicId pero sí url de upload, inyecta transform y cambia extensión a .jpg
    if (url?.includes('/image/upload/')) {
      const withTx = url.replace(
        '/upload/',
        '/upload/f_jpg,q_auto,w_900,c_limit/',
      )
      return withTx.replace(
        /\.(heic|heif|png|jpeg|jpg|webp|avif)(\?|$)/i,
        '.jpg$2',
      )
    }

    // 5) último recurso: devuelve la original (no ideal, pero no rompe)
    return url
  }

  // 👇 agrega temporalmente este log para confirmar la URL final (luego lo quitas)
  useEffect(() => {
    if (items.length) {
      const first = items[0]
      // imprime la URL que se usará realmente
      console.log('CL test →', clTransform(first.imageUrl, first.publicId))
    }
  }, [items])

  // Filtro + búsqueda + orden
  const filtered = useMemo(() => {
    let list = items

    if (category !== 'todas')
      list = list.filter((it) => it.category === category)

    if (selectedTags.length) {
      list = list.filter((it) => selectedTags.every((t) => it.tags.includes(t)))
    }

    const q = debouncedQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((it) => {
        const hay =
          (it.title || '').toLowerCase().includes(q) ||
          it.tags.some((tg) => tg.toLowerCase().includes(q)) ||
          (it.category || '').toLowerCase().includes(q)
        return hay
      })
    }

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

  // reset visible al cambiar filtros
  useEffect(
    () => setVisible(pageSize),
    [debouncedQuery, category, selectedTags, sortBy, pageSize],
  )

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
              {title}
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
          {allTags.length > 0 && (
            <div
              className="chips"
              data-reveal
              role="group"
              aria-label="Filtrar por etiquetas"
            >
              {allTags.map((t) => {
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

        {/* Loading / Error */}
        {loading && (
          <div className="empty" data-reveal>
            <p>Cargando galería…</p>
          </div>
        )}
        {error && !loading && (
          <div className="empty" data-reveal>
            <p>{error}</p>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && (
          <AnimatePresence mode="popLayout">
            <div className="gallery-grid">
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
                      src={clTransform(p.imageUrl, p.publicId)}
                      alt={p.title || 'Pedido'}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <figcaption className="tile-caption">
                    <div className="tile-title">{p.title || 'Pedido'}</div>
                    <div className="tile-meta">
                      <span className="badge">
                        {p.category || 'Sin categoría'}
                      </span>
                      {p.tags?.slice?.(0, 2).map((tg) => (
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
        )}

        {/* Cargar más */}
        {!loading && !error && hasMore && (
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
