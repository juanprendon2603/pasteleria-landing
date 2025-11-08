// src/components/GallerySection.tsx
'use client'

import { db } from '@/firebase/config'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

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
  deleteToken?: string
}

type Props = {
  id?: string
  title?: string
  pageSize?: number
  /** Fuerza modo admin. Si no se pasa, se infiere desde la URL (/dashboard) */
  admin?: boolean
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
  title = 'Galería',
  pageSize = 12,
  admin,
}: Props) {
  const location = useLocation()
  const isAdmin = useMemo(
    () =>
      typeof admin === 'boolean'
        ? admin
        : location.pathname.startsWith('/dashboard'),
    [admin, location.pathname],
  )

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

  // Modales
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [current, setCurrent] = useState<PhotoItem | null>(null)

  // Estado de edición
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editTags, setEditTags] = useState('')

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
            deleteToken: data?.deleteToken,
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

  // Cloudinary: respeta proporciones, limitando por ALTURA
  const clTransform = (url: string, publicId?: string) => {
    let cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
    if (!cloud && url) {
      const m = url.match(/res\.cloudinary\.com\/([^/]+)\/image\/upload\//i)
      if (m?.[1]) cloud = m[1]
    }
    if (cloud && publicId) {
      return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,h_420,c_limit/${publicId}`
    }
    if (url?.includes('/image/upload/')) {
      return url.replace('/upload/', '/upload/f_auto,q_auto,h_420,c_limit/')
    }
    return url
  }

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
          it.tags.some((tg) => tg.toLowerCase().includes(q))
        return hay
      })
    }
    list = [...list].sort((a, b) => {
      if (sortBy === 'titulo')
        return (a.title || '').localeCompare(b.title || '')
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

  const hasMore = visible < filtered.length
  const toShow = filtered.slice(0, visible)

  // ======= Admin actions =======
  const openEdit = (item: PhotoItem) => {
    setCurrent(item)
    setEditTitle(item.title || '')
    setEditCategory(item.category || '')
    setEditTags(item.tags?.join(', ') || '')
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (!current) return
    const ref = doc(db, 'gallery', current.id)
    const newTags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    await updateDoc(ref, {
      title: editTitle,
      category: editCategory,
      tags: newTags,
    })
    setItems((prev) =>
      prev.map((it) =>
        it.id === current.id
          ? { ...it, title: editTitle, category: editCategory, tags: newTags }
          : it,
      ),
    )
    setEditOpen(false)
    setCurrent(null)
  }

  const openConfirmDelete = (item: PhotoItem) => {
    setCurrent(item)
    setConfirmOpen(true)
  }

  const tryCloudDeleteByToken = async (token: string) => {
    const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
    const form = new FormData()
    form.append('token', token)
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud}/delete_by_token`,
      { method: 'POST', body: form },
    )
    return res.ok
  }

  const tryBackendDeleteByPublicId = async (publicId: string) => {
    const endpoint = import.meta.env.VITE_CLOUDINARY_DELETE_URL as
      | string
      | undefined
    if (!endpoint) return false
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId }),
    })
    return res.ok
  }

  const doDelete = async () => {
    if (!current) return
    try {
      if (current.deleteToken) {
        await tryCloudDeleteByToken(current.deleteToken)
      } else if (current.publicId) {
        await tryBackendDeleteByPublicId(current.publicId)
      }
      await deleteDoc(doc(db, 'gallery', current.id))
      setItems((prev) => prev.filter((it) => it.id !== current.id))
    } catch (e) {
      console.error(e)
      alert('No se pudo eliminar (revisa consola).')
    } finally {
      setConfirmOpen(false)
      setCurrent(null)
    }
  }

  return (
    <section id={id} className="section alt" aria-labelledby={`${id}-title`}>
      <div className="container">
        <header className="gal-header">
          <div>
            <h2 id={`${id}-title`} className="h2">
              {title}
            </h2>
            <p className="lead">
              Filtra por título, etiquetas u ordena por fecha/título.
            </p>
          </div>

          <div className="gal-controls">
            <div className="input-wrap">
              <input
                type="search"
                placeholder="Buscar por título o etiqueta…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar en galer\u00eda"
              />
            </div>

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

          {allTags.length > 0 && (
            <div
              className="chips"
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

        {loading && (
          <div className="empty">
            <p>Cargando galería…</p>
          </div>
        )}
        {error && !loading && (
          <div className="empty">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <AnimatePresence mode="popLayout">
            <div className="gallery-grid">
              {toShow.map((p) => (
                <motion.figure
                  key={p.id}
                  className="photo-tile photo-tile--plain"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.28 }}
                >
                  {/* Imagen sola, sin nada encima */}
                  <div
                    className="thumb-wrap thumb-wrap--frame"
                    aria-hidden="true"
                  >
                    <img
                      src={clTransform(p.imageUrl, p.publicId)}
                      alt={p.title || 'Pedido'}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  {/* Metadatos debajo */}
                  <figcaption className="tile-caption">
                    <div className="tile-title">{p.title || 'Pedido'}</div>
                    <div className="tile-meta">
                      <span className="badge">
                        {p.category || 'Sin categoría'}
                      </span>
                      {p.tags?.slice?.(0, 3).map((tg) => (
                        <span key={tg} className="tag">
                          {tg}
                        </span>
                      ))}
                    </div>

                    {isAdmin && (
                      <div className="tile-actions">
                        <button className="btn sm" onClick={() => openEdit(p)}>
                          Editar
                        </button>
                        <button
                          className="btn sm danger"
                          onClick={() => openConfirmDelete(p)}
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </figcaption>
                </motion.figure>
              ))}

              {toShow.length === 0 && (
                <div className="empty">
                  <p>Sin resultados con los filtros actuales.</p>
                </div>
              )}
            </div>
          </AnimatePresence>
        )}

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

      {/* ===== Modales ===== */}
      {editOpen && current && (
        <Modal onClose={() => setEditOpen(false)} title="Editar imagen">
          <div className="grid cols-2">
            <div className="input-wrap">
              <label>Título</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>

            <div className="input-wrap">
              <label>Categoría</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
              >
                <option value="">(sin categoría)</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-wrap">
            <label>Etiquetas (coma separadas)</label>
            <input
              type="text"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              placeholder="chocolate, fondant, baby shower"
            />
          </div>

          <div className="modal-actions">
            <button className="btn" onClick={saveEdit}>
              Guardar cambios
            </button>
            <button
              className="btn secondary"
              onClick={() => setEditOpen(false)}
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {confirmOpen && current && (
        <Modal onClose={() => setConfirmOpen(false)} title="Eliminar imagen">
          <p>
            ¿Seguro que quieres eliminar esta imagen?
            <br />
            <strong>{current.title || current.publicId}</strong>
          </p>
          <small className="muted">
            Se borrará el documento en Firestore y se intentará borrar el asset
            en Cloudinary (si hay <code>deleteToken</code> o endpoint backend).
          </small>
          <div className="modal-actions">
            <button className="btn danger" onClick={doDelete}>
              Sí, eliminar
            </button>
            <button
              className="btn secondary"
              onClick={() => setConfirmOpen(false)}
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {/* ===== Estilos específicos: imagen aparte + meta abajo ===== */}
      <style>{`
        .photo-tile { 
          background:#fff; border:1px solid var(--ring); border-radius:16px;
          overflow:hidden; box-shadow:0 8px 20px var(--shadow);
          display:grid; grid-template-rows:auto auto;
          transition:transform .18s ease, box-shadow .18s ease;
        }
        .photo-tile:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(183,108,253,.22); }

        /* Marco como el carrusel: mantiene proporción sin recortar */
        .thumb-wrap.thumb-wrap--frame {
          max-height: 420px;
          background: linear-gradient(180deg,#faf7ff,#f7fffe);
          display:grid; place-items:center;
        }
        @media (max-width: 900px){ .thumb-wrap.thumb-wrap--frame { max-height: 360px; } }
        @media (max-width: 560px){ .thumb-wrap.thumb-wrap--frame { max-height: 300px; } }

        .thumb-wrap.thumb-wrap--frame img {
          height: 100%;
          width: auto;
          object-fit: contain;
          display:block;
          transition: transform .25s ease, filter .25s ease;
        }
        .photo-tile:hover .thumb-wrap.thumb-wrap--frame img { transform: scale(1.015); filter: contrast(1.02); }

        .tile-caption { padding: 10px 12px 12px; }
        .tile-title { font-weight: 800; font-size: 0.98rem; margin: 0 0 6px; color: var(--ink); }
        .tile-meta { display: flex; gap: 8px; flex-wrap: wrap; }
        .badge { background: var(--brand); color:#fff; border-radius:999px; font-size:12px; padding:4px 8px; box-shadow:0 6px 16px rgba(183,108,253,.28); }
        .tag { border:1px solid var(--ring); padding:3px 8px; border-radius:999px; font-size:12px; color:var(--brand-ink); background:#fff; }

        .tile-actions { display:flex; gap:8px; margin-top:10px; flex-wrap:wrap; }
        .btn.sm { padding:8px 12px; border-radius:12px; font-size:.9rem; }
        .btn.danger { background:#ef4444; }
        .btn.danger:hover { background:#f87171; }

        /* Modal */
        .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.35); display:grid; place-items:center; z-index:1000; }
        .modal { width:min(560px,92vw); background:#fff; border-radius:16px; border:1px solid #eee; box-shadow:0 20px 60px rgba(0,0,0,.2); padding:18px; }
        .modal h3 { margin:0 0 10px; font-size:1.25rem; }
        .modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:14px; }
        .grid { display:grid; gap:12px; }
        @media (min-width:768px){ .grid.cols-2 { grid-template-columns:1fr 1fr; } }
        .input-wrap { display:flex; flex-direction:column; gap:6px; }
        .input-wrap input, .input-wrap select { padding:10px 12px; border-radius:12px; border:1px solid #e5e7eb; }
      `}</style>
    </section>
  )
}

/** Modal interno minimalista */
function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  )
}
