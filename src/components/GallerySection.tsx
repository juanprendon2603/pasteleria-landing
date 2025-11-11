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

export type Branch = {
  id: string
  name: string
  phone: string
}

type Props = {
  id?: string
  title?: string
  pageSize?: number
  /** Fuerza modo admin. Si no se pasa, se infiere desde la URL (/dashboard) */
  admin?: boolean
  /** Sedes opcionales para WhatsApp */
  branches?: Branch[]
}

/** Docs de Firestore tipados */
type CategoryDoc = { name?: string }
type FirestoreGalleryData = {
  title?: string
  imageUrl?: string
  publicId?: string
  deleteToken?: string
  category?: string
  tags?: unknown
  createdAt?: number | string | { toMillis?: () => number }
  description?: string
  author?: string
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

/** Slug para clases */
const slugify = (s?: string) =>
  (s || 'sin-cat')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/** URL compartible que NO fuerza descarga (limpia fl_attachment y query) */
const toShareUrl = (url: string, publicId?: string, w = 1200) => {
  let cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
  if (!cloud && url) {
    const m = url.match(/res\.cloudinary\.com\/([^/]+)\/image\/upload\//i)
    if (m?.[1]) cloud = m[1]
  }
  const base = cloud ? `https://res.cloudinary.com/${cloud}/image/upload` : ''
  const common = `f_auto,q_auto,dpr_auto,c_limit,w_${w}`
  if (cloud && publicId) return `${base}/${common}/${publicId}`

  const cleanNoQS = url.split('?')[0]
  const cleaned = cleanNoQS
    .replace(/\/upload\/([^/]*,)?fl_attachment[^/]*\//i, '/upload/')
    .replace(/\/upload\/([^/]*,)?attachment[^/]*\//i, '/upload/')
  if (cleaned.includes('/image/upload/')) {
    return cleaned.replace('/upload/', `/upload/${common}/`)
  }
  return cleaned
}

/** Cloudinary transform (limitando ALTURA, sin recortar) */
const clTransform = (url: string, publicId?: string, h = 420) => {
  let cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
  if (!cloud && url) {
    const m = url.match(/res\.cloudinary\.com\/([^/]+)\/image\/upload\//i)
    if (m?.[1]) cloud = m[1]
  }
  if (cloud && publicId) {
    return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,h_${h},c_limit/${publicId}`
  }
  if (url?.includes('/image/upload/')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,h_${h},c_limit/`)
  }
  return url
}

/** Versión grande (para viewer) */
const clLarge = (url: string, publicId?: string) => clTransform(url, publicId, 1600)

/** WhatsApp con mensaje simple + link inline */
const buildWA = (phone: string, item: PhotoItem, imgUrl: string) => {
  const share = toShareUrl(imgUrl, item.publicId)
  const base = `https://wa.me/${phone}`
  const msg = `Hola, deseo más info de esta torta:\n${share}`
  return `${base}?text=${encodeURIComponent(msg)}`
}

const SORT_VALUES = ['reciente', 'antiguo', 'titulo'] as const
type SortBy = typeof SORT_VALUES[number]

export default function GallerySection({
  id = 'galeria',
  title = 'Galería',
  pageSize = 12,
  admin,
  branches,
}: Props) {
  const location = useLocation()
  const isAdmin = useMemo(
    () => (typeof admin === 'boolean' ? admin : location.pathname.startsWith('/dashboard')),
    [admin, location.pathname],
  )

  // Sedes por defecto
  const fallbackBranches: Branch[] = [
    { id: 'mir', name: 'Sede Miranda', phone: '573155287225' },
    { id: 'flo', name: 'Sede Florida',  phone: '573150815246' },
  ]
  const sedeList = branches?.length ? branches : fallbackBranches

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [items, setItems] = useState<PhotoItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])

  // Filtros UI
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('todas')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortBy>('reciente')
  const [visible, setVisible] = useState(pageSize)
  const debouncedQuery = useDebouncedValue(query, 300)

  // Viewer (solo 1 imagen)
  const [viewerImage, setViewerImage] = useState<string | null>(null)

  // Modal “elige sede” para WhatsApp
  const [inquiryItem, setInquiryItem] = useState<PhotoItem | null>(null)
  const [inquiryImg, setInquiryImg] = useState<string>('')

  // Modales admin (sin título)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [current, setCurrent] = useState<PhotoItem | null>(null)
  const [editCategory, setEditCategory] = useState('')
  const [editTags, setEditTags] = useState('')

  // Cargar Firestore (categorías + gallery)
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const cSnap = await getDocs(collection(db, 'categories'))
        const cList = cSnap.docs
          .map((d) => (d.data() as CategoryDoc)?.name)
          .filter((name): name is string => Boolean(name))
        setCategories(cList)

        const gSnap = await getDocs(collection(db, 'gallery'))
        const list: PhotoItem[] = gSnap.docs.map((d) => {
          const data = d.data() as FirestoreGalleryData
          const created =
            (typeof data?.createdAt === 'object' &&
              typeof data.createdAt?.toMillis === 'function' &&
              data.createdAt.toMillis()) ||
            (typeof data?.createdAt === 'number' && data.createdAt) ||
            (typeof data?.createdAt === 'string' && Date.parse(data.createdAt)) ||
            0

          const rawTags = data?.tags
          const tags: string[] = Array.isArray(rawTags)
            ? (rawTags.filter((t): t is string => typeof t === 'string') as string[])
            : []

          return {
            id: d.id,
            title: data?.title || '',
            imageUrl: data?.imageUrl ?? '',
            publicId: data?.publicId,
            deleteToken: data?.deleteToken,
            category: data?.category || '',
            tags,
            createdAt: created,
            description: data?.description,
            author: data?.author,
          }
        })

        setItems(list)

        const tagSet = new Set<string>()
        list.forEach((it) => it.tags.forEach((t) => t && tagSet.add(t)))
        setAllTags(Array.from(tagSet).sort((a, b) => a.localeCompare(b)))
      } catch (e) {
        console.error(e)
        setError('No se pudieron cargar los datos')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  // Filtro + búsqueda + orden (SIN título)
  const filtered = useMemo(() => {
    let list = items
    if (category !== 'todas') list = list.filter((it) => it.category === category)
    if (selectedTags.length) list = list.filter((it) => selectedTags.every((t) => it.tags.includes(t)))
    const q = debouncedQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((it) => it.tags.some((tg) => tg.toLowerCase().includes(q)))
    }
    list = [...list].sort((a, b) => {
      if (sortBy === 'titulo') return (a.title || '').localeCompare(b.title || '')
      const da = new Date(a.createdAt || 0).getTime()
      const db = new Date(b.createdAt || 0).getTime()
      return sortBy === 'reciente' ? db - da : da - db
    })
    return list
  }, [items, category, selectedTags, debouncedQuery, sortBy])

  // reset visible al cambiar filtros
  useEffect(() => setVisible(pageSize), [debouncedQuery, category, selectedTags, sortBy, pageSize])

  const toggleTag = (t: string) =>
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  const hasMore = visible < filtered.length
  const toShow = filtered.slice(0, visible)

  // ======= Admin actions =======
  const openEdit = (item: PhotoItem) => {
    setCurrent(item)
    setEditCategory(item.category || '')
    setEditTags(item.tags.join(', '))
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (!current) return
    const ref = doc(db, 'gallery', current.id)
    const newTags = editTags.split(',').map((t) => t.trim()).filter(Boolean)
    await updateDoc(ref, { category: editCategory, tags: newTags }) // ← sin título
    setItems((prev) =>
      prev.map((it) =>
        it.id === current.id ? { ...it, category: editCategory, tags: newTags } : it,
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
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/delete_by_token`, { method: 'POST', body: form })
    return res.ok
  }

  const tryBackendDeleteByPublicId = async (publicId: string) => {
    const endpoint = import.meta.env.VITE_CLOUDINARY_DELETE_URL as string | undefined
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
      if (current.deleteToken) await tryCloudDeleteByToken(current.deleteToken)
      else if (current.publicId) await tryBackendDeleteByPublicId(current.publicId)
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
            <h2 id={`${id}-title`} className="h2">{title}</h2>
            <p className="lead">Filtra por etiquetas u ordena por fecha.</p>
          </div>

          <div className="gal-controls">
            <div className="input-wrap">
              <input
                type="search"
                placeholder="Buscar por etiqueta…"
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
                <option value="">(sin categoría)</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="select-wrap">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.currentTarget.value as SortBy)}
                aria-label="Ordenar resultados"
              >
                <option value="reciente">Más recientes</option>
                <option value="antiguo">Más antiguos</option>
                <option value="titulo">Por título (A-Z)</option>
              </select>
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="chips" role="group" aria-label="Filtrar por etiquetas">
              {allTags.map((t) => {
                const active = selectedTags.includes(t)
                return (
                  <button
                    key={t}
                    className={`chip ${active ? 'active' : ''}`}
                    onClick={() => toggleTag(t)}
                    aria-pressed={active}
                    type="button"
                  >
                    {t}
                  </button>
                )
              })}
              {selectedTags.length > 0 && (
                <button className="chip clear" onClick={() => setSelectedTags([])} type="button">
                  Limpiar etiquetas
                </button>
              )}
            </div>
          )}
        </header>

        {/* Loading */}
        {loading && <div className="empty"><p>Cargando galería…</p></div>}
        {error && !loading && <div className="empty"><p>{error}</p></div>}

        {!loading && !error && (
          <AnimatePresence mode="popLayout">
            <div className="gallery-grid">
              {toShow.map((p) => {
                const catSlug = slugify(p.category)
                const imgSmall = clTransform(p.imageUrl, p.publicId)
                const imgBig = toShareUrl(clLarge(p.imageUrl, p.publicId), p.publicId)

                return (
                  <motion.figure
                    key={p.id}
                    className="photo-tile photo-tile--plain"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.28 }}
                  >
                    {/* Imagen + ribbon */}
                    <div
                      className="thumb-wrap thumb-wrap--frame clickable"
                      onClick={() => setViewerImage(imgBig)}
                      role="button"
                      tabIndex={0}
                    >
                      <span className={`ribbon ${catSlug || 'sin-cat'}`}>
                        <i aria-hidden>🏷️</i> {p.category || 'Sin categoría'}
                      </span>
                      <img src={imgSmall} alt="Pedido" loading="lazy" decoding="async" />
                    </div>

                    {/* Acciones debajo */}
                    <figcaption className="tile-caption">
                      {isAdmin ? (
                        <div className="tile-actions">
                          <button type="button" className="btn sm" onClick={() => openEdit(p)}>Editar</button>
                          <button type="button" className="btn sm danger" onClick={() => openConfirmDelete(p)}>Eliminar</button>
                        </div>
                      ) : (
                        <div className="tile-actions">
                          <button
                            type="button"
                            className="btn sm secondary"
                            onClick={() => { setInquiryItem(p); setInquiryImg(imgBig) }}
                          >
                            Más info
                          </button>
                        </div>
                      )}
                    </figcaption>
                  </motion.figure>
                )
              })}

              {toShow.length === 0 && <div className="empty"><p>Sin resultados con los filtros actuales.</p></div>}
            </div>
          </AnimatePresence>
        )}

        {!loading && !error && hasMore && (
          <div className="load-wrap">
            <button className="btn" onClick={() => setVisible((v) => v + pageSize)} type="button">
              Cargar más
            </button>
          </div>
        )}
      </div>

      {/* ===== Viewer (solo imagen clicada) ===== */}
      {viewerImage && (
        <div className="image-viewer-backdrop" onClick={() => setViewerImage(null)} role="button" tabIndex={0}>
          <img
            src={viewerImage}
            alt="Vista ampliada"
            className="image-viewer-img"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="image-viewer-close" onClick={() => setViewerImage(null)} aria-label="Cerrar vista" type="button">✕</button>
        </div>
      )}

      {/* ===== Modal elegir sede para WhatsApp (MÁS INFO) ===== */}
      {inquiryItem && (
        <div className="modal-backdrop" onClick={() => { setInquiryItem(null); setInquiryImg('') }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>¿A qué sede quieres escribir?</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              Enviaremos el link directo de esta imagen por WhatsApp.
            </p>

            <div className="grid">
              {sedeList.map((b) => {
                const href = buildWA(b.phone, inquiryItem, inquiryImg)
                return (
                  <a key={b.id} className="btn" href={href} target="_blank" rel="noopener noreferrer">
                    WhatsApp {b.name}
                  </a>
                )
              })}
            </div>

            <div className="modal-actions">
              <button className="btn secondary" onClick={() => { setInquiryItem(null); setInquiryImg('') }} type="button">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modales admin ===== */}
      {editOpen && current && (
        <Modal onClose={() => setEditOpen(false)} title="Editar imagen">
          <div className="grid cols-2">
            <div className="input-wrap">
              <label>Categoría</label>
              <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                <option value="">(sin categoría)</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
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
            <button className="btn" onClick={saveEdit} type="button">Guardar cambios</button>
            <button className="btn secondary" onClick={() => setEditOpen(false)} type="button">Cancelar</button>
          </div>
        </Modal>
      )}

      {confirmOpen && current && (
        <Modal onClose={() => setConfirmOpen(false)} title="Eliminar imagen">
          <p>
            ¿Seguro que quieres eliminar esta imagen?
            <br />
            <strong>{current.publicId}</strong>
          </p>
          <small className="muted">
            Se borrará el documento en Firestore y se intentará borrar el asset en Cloudinary (si hay <code>deleteToken</code> o endpoint backend).
          </small>
          <div className="modal-actions">
            <button className="btn danger" onClick={doDelete} type="button">Sí, eliminar</button>
            <button className="btn secondary" onClick={() => setConfirmOpen(false)} type="button">Cancelar</button>
          </div>
        </Modal>
      )}

      {/* ===== Estilos (tiles + ribbon + viewer + modal) ===== */}
      <style>{`
        .photo-tile {
          position: relative;
          background:#fff; border:1px solid var(--ring); border-radius:16px; overflow:hidden;
          box-shadow:0 8px 20px var(--shadow);
          display:grid; grid-template-rows:auto auto;
          transition:transform .18s ease, box-shadow .18s ease;
        }
        .photo-tile:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(183,108,253,.22); }

        .thumb-wrap.thumb-wrap--frame {
          position: relative;
          max-height: 420px;
          background: linear-gradient(180deg,#faf7ff,#f7fffe);
          display:grid; place-items:center;
        }
        @media (max-width: 900px){ .thumb-wrap.thumb-wrap--frame { max-height: 360px; } }
        @media (max-width: 560px){ .thumb-wrap.thumb-wrap--frame { max-height: 300px; } }
        .thumb-wrap.thumb-wrap--frame img {
          height: 100%; width: auto; object-fit: contain; display:block;
          transition: transform .25s ease, filter .25s ease;
        }
        .thumb-wrap.clickable { cursor: zoom-in; }
        .photo-tile:hover .thumb-wrap--frame img { transform: scale(1.015); filter: contrast(1.02); }

        .tile-caption { padding: 10px 12px 12px; }
        .tile-actions { display:flex; gap:8px; margin-top:10px; flex-wrap:wrap; justify-content:center; }
        .btn.sm { padding:8px 12px; border-radius:12px; font-size:.9rem; }
        .btn.danger { background:#ef4444; } .btn.danger:hover { background:#f87171; }

        /* Ribbon */
        .ribbon {
          position: absolute; top: 10px; left: 10px; z-index: 2;
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 12px; font-weight: 800; font-size: 12px; color: #fff;
          background: linear-gradient(135deg, var(--brand), var(--accent));
          border-radius: 999px; box-shadow: 0 6px 16px rgba(183,108,253,.28);
          backdrop-filter: blur(4px);
        }
        .ribbon i { font-style: normal; opacity: .95; }

        .ribbon.cumple { background: linear-gradient(135deg, #8aa7ff, #b76cfd); }
        .ribbon.baby-shower { background: linear-gradient(135deg, #f8aee3, #6be4dc); color:#3a2e4e; }
        .ribbon.chocolate { background: linear-gradient(135deg, #a77979, #e0b9a8); }

        /* Viewer */
        .image-viewer-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,0.8);
          display: grid; place-items: center; z-index: 2000; cursor: zoom-out; animation: fadeIn .25s ease;
        }
        .image-viewer-img {
          max-width: 95vw; max-height: 90vh; border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5); cursor: default;
        }
        .image-viewer-close {
          position: absolute; top: 24px; right: 24px;
          background: rgba(255,255,255,0.9); color:#111; border:none;
          border-radius:999px; width:42px; height:42px; font-size:22px; font-weight:700;
          display:grid; place-items:center; cursor:pointer;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* Modal genérico */
        .modal-backdrop {
          position:fixed; inset:0; background:rgba(0,0,0,.35);
          display:grid; place-items:center; z-index:9999;
        }
        .modal {
          width:min(560px,92vw); background:#fff; border-radius:16px; border:1px solid #eee;
          box-shadow:0 20px 60px rgba(0,0,0,.2); padding:18px;
        }
        .modal h3 { margin:0 0 6px; font-size:1.22rem; }
        .modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:14px; }
        .grid { display:grid; gap:12px; }
        @media (min-width:768px){ .grid.cols-2 { grid-template-columns:1fr 1fr; } }
        .input-wrap { display:flex; flex-direction:column; gap:6px; }
        .input-wrap input, .input-wrap select { padding:10px 12px; border-radius:12px; border:1px solid #e5e7eb; }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 18px;
        }
      `}</style>
    </section>
  )
}

/** Modal interno minimalista (click fuera para cerrar) */
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
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  )
}
