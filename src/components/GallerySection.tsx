'use client'

import { db } from '@/firebase/config'
import { collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import Modal from '@/components/Modal'
import ViewerOverlay from '@/components/ViewerOverlay'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { clLarge, clTransform, toShareUrl } from '@/utils/cloudinary'

export type PhotoItem = {
  id: string
  title?: string
  imageUrl: string
  publicId?: string
  category: string
  tags: string[]
  tagsNorm?: string[]
  createdAt?: string | number
  description?: string
  author?: string
  deleteToken?: string
}

export type Branch = { id: string; name: string; phone: string }

type Props = {
  id?: string
  title?: string
  pageSize?: number
  admin?: boolean
  branches?: Branch[]
}

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

const slugify = (s?: string) =>
  (s || 'sin-cat')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const normalizeTag = (s: string) =>
  s.trim().replace(/[.]+$/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const prettyTag = (s: string) => {
  const t = s.trim().replace(/[.]+$/g, '')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

type UiTag = { norm: string; label: string; count: number }

type SortBy = 'reciente' | 'antiguo' | 'titulo'


const buildWA = (phone: string, item: PhotoItem, imgUrl: string) => {
  const share = toShareUrl(imgUrl, item.publicId)
  const base = `https://wa.me/${phone}`
  const msg = `Hola, deseo más info de esta torta:\n${share}`
  return `${base}?text=${encodeURIComponent(msg)}`
}

export default function GallerySection({
  id = 'galeria',
  title = 'Galería',
  pageSize = 12,
  admin,
  branches,
}: Props) {
  /** Router: admin y sincronización URL */
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const isAdmin = useMemo(
    () => (typeof admin === 'boolean' ? admin : location.pathname.startsWith('/dashboard')),
    [admin, location.pathname],
  )

  // Sedes
  const fallbackBranches: Branch[] = [
    { id: 'mir', name: 'Sede Miranda', phone: '573155287225' },
    { id: 'flo', name: 'Sede Florida',  phone: '573150815246' },
  ]
  const sedeList = branches?.length ? branches : fallbackBranches

  // Estado principal
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<PhotoItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  // --- NUEVO: estado específico para el editor de etiquetas ---
const [editTagList, setEditTagList] = useState<string[]>([])
const [tagInput, setTagInput] = useState('')


  // Catálogo de etiquetas unificadas
  const [tagCatalog, setTagCatalog] = useState<UiTag[]>([])
  const [showAllTags, setShowAllTags] = useState(false)

  // Filtros
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('todas')
  const [selectedTags, setSelectedTags] = useState<string[]>([]) // norms
  const [sortBy, setSortBy] = useState<SortBy>('reciente')
  const [visible, setVisible] = useState(pageSize)
  const debouncedQuery = useDebouncedValue(query, 300)

  // Viewer
  const [viewerImage, setViewerImage] = useState<string | null>(null)

  // WhatsApp
  const [inquiryItem, setInquiryItem] = useState<PhotoItem | null>(null)
  const [inquiryImg, setInquiryImg] = useState<string>('')

  // Admin modals
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [current, setCurrent] = useState<PhotoItem | null>(null)
  const [editCategory, setEditCategory] = useState('')
  const [editTags, setEditTags] = useState('')

  /** Leer parámetros iniciales de la URL y aplicarlos a filtros */
  useEffect(() => {
    const cat = searchParams.get('categoria')
    const tag = searchParams.get('etiqueta')
    if (cat) setCategory(cat)
    if (tag) setSelectedTags([tag.toLowerCase()])
    // no dependencias para que sólo se ejecute al montar
  }, [])

  /** Cargar datos Firestore */
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
  'toMillis' in data.createdAt &&
  typeof data.createdAt.toMillis === 'function' &&
  data.createdAt.toMillis())
 ||
            (typeof data?.createdAt === 'number' && data.createdAt) ||
            (typeof data?.createdAt === 'string' && Date.parse(data.createdAt)) ||
            0

          const rawTags = data?.tags
          const tags: string[] = Array.isArray(rawTags)
            ? (rawTags.filter((t): t is string => typeof t === 'string') as string[])
            : []
          const tagsNorm = tags.map((t) => normalizeTag(t)).filter(Boolean)

          return {
            id: d.id,
            title: data?.title || '',
            imageUrl: data?.imageUrl ?? '',
            publicId: data?.publicId,
            deleteToken: data?.deleteToken,
            category: data?.category || '',
            tags,
            tagsNorm,
            createdAt: created,
            description: data?.description,
            author: data?.author,
          }
        })

        setItems(list)

        // Construir catálogo de etiquetas
        const stats = new Map<string, UiTag>()
        list.forEach((it) => {
          (it.tags ?? []).forEach((raw) => {
            const norm = normalizeTag(raw)
            if (!norm) return
            const label = prettyTag(raw)
            const prev = stats.get(norm)
            if (prev) {
              prev.count += 1
              if (label.length > prev.label.length) prev.label = label
            } else {
              stats.set(norm, { norm, label, count: 1 })
            }
          })
        })
        const catalog = Array.from(stats.values()).sort((a, b) => b.count - a.count)
        setTagCatalog(catalog)
      } catch (e) {
        console.error(e)
        setError('No se pudieron cargar los datos')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  /** Filtro + búsqueda + orden */
  const filtered = useMemo(() => {
    let list = items
    if (category !== 'todas') list = list.filter((it) => it.category === category)

    if (selectedTags.length) {
      list = list.filter((it) => {
        const norms = it.tagsNorm ?? it.tags.map(normalizeTag)
        return selectedTags.every((t) => norms.includes(t))
      })
    }

    const q = normalizeTag(debouncedQuery)
    if (q) {
      list = list.filter((it) => {
        const norms = it.tagsNorm ?? it.tags.map(normalizeTag)
        return norms.some((tg) => tg.includes(q))
      })
    }

    list = [...list].sort((a, b) => {
      if (sortBy === 'titulo') return (a.title || '').localeCompare(b.title || '')
      const da = new Date(a.createdAt || 0).getTime()
      const db = new Date(b.createdAt || 0).getTime()
      return sortBy === 'reciente' ? db - da : da - db
    })
    return list
  }, [items, category, selectedTags, debouncedQuery, sortBy])

  /** Reset de paginado al cambiar filtros */
  useEffect(() => setVisible(pageSize), [debouncedQuery, category, selectedTags, sortBy, pageSize])

  /** Cambiar categoría + actualizar URL */
  const onChangeCategory = (value: string) => {
    setCategory(value)
    const params = new URLSearchParams(searchParams)
    if (value && value !== 'todas') params.set('categoria', value)
    else params.delete('categoria')
    setSearchParams(params)
  }

  /** Toggle etiqueta (single principal en URL) */
  const toggleTag = (norm: string) => {
    setSelectedTags((prev) => {
      const exists = prev.includes(norm)
      const updated = exists ? prev.filter((x) => x !== norm) : [norm]
      const params = new URLSearchParams(searchParams)
      if (updated.length > 0) params.set('etiqueta', updated[0])
      else params.delete('etiqueta')
      setSearchParams(params)
      return updated
    })
  }

  // --- NUEVO: helpers editor de tags ---
const addTag = (raw: string) => {
  const label = prettyTag(raw)
  const exists = editTagList.some((t) => normalizeTag(t) === normalizeTag(label))
  if (!exists) setEditTagList((prev) => [...prev, label])
  setTagInput('')
}

const removeTag = (norm: string) => {
  setEditTagList((prev) => prev.filter((t) => normalizeTag(t) !== norm))
}

const onTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter' || e.key === ',' ) {
    e.preventDefault()
    const val = tagInput.trim().replace(/,$/, '')
    if (val) addTag(val)
  } else if (e.key === 'Backspace' && !tagInput) {
    // UX: borrar el último chip si el input está vacío
    setEditTagList((prev) => prev.slice(0, -1))
  }
}

// Sugerencias filtradas desde el catálogo
const tagSuggestions = useMemo(() => {
  const q = normalizeTag(tagInput)
  const base = tagCatalog
  if (!q) return base.slice(0, 10) // top 10 por uso
  return base.filter(t => normalizeTag(t.label).includes(q)).slice(0, 10)
}, [tagInput, tagCatalog])


  const hasMore = visible < filtered.length
  const toShow = filtered.slice(0, visible)

  /** Admin: abrir/guardar/eliminar */
const openEdit = (item: PhotoItem) => {
  setCurrent(item)
  setEditCategory(item.category || '')
  setEditTags(item.tags.join(', ')) // (lo mantengo por compatibilidad si lo usas en otro lado)
  setEditTagList(item.tags ?? [])
  setTagInput('')
  setEditOpen(true)
}


const saveEdit = async () => {
  if (!current) return
  const ref = doc(db, 'gallery', current.id)

  // Fuente de la verdad: editTagList
  const newTags = editTagList
    .map((t) => t.trim())
    .filter(Boolean)

  await updateDoc(ref, { category: editCategory, tags: newTags })

  setItems((prev) =>
    prev.map((it) =>
      it.id === current.id
        ? { ...it, category: editCategory, tags: newTags, tagsNorm: newTags.map(normalizeTag) }
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
                onChange={(e) => onChangeCategory(e.target.value)}
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

          {tagCatalog.length > 0 && (
            <div className="chips" role="group" aria-label="Filtrar por etiquetas">
              {(showAllTags ? tagCatalog : tagCatalog.slice(0, 12)).map(({ norm, label, count }) => {
                const active = selectedTags.includes(norm)
                return (
                  <button
                    key={norm}
                    className={`chip ${active ? 'active' : ''}`}
                    onClick={() => toggleTag(norm)}
                    aria-pressed={active}
                    type="button"
                    title={`${count} coincidencia${count === 1 ? '' : 's'}`}
                  >
                    {label}
                  </button>
                )
              })}

              {tagCatalog.length > 12 && (
                <button
                  className="chip clear"
                  onClick={() => setShowAllTags((v) => !v)}
                  type="button"
                >
                  {showAllTags ? 'Ver menos' : `Ver todas (${tagCatalog.length})`}
                </button>
              )}

              {selectedTags.length > 0 && (
                <button className="chip clear" onClick={() => setSelectedTags([])} type="button">
                  Limpiar etiquetas
                </button>
              )}
            </div>
          )}
        </header>

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

      {/* Viewer */}
      {viewerImage && (
        <ViewerOverlay src={viewerImage} onClose={() => setViewerImage(null)} />
      )}

      {/* Modal WhatsApp */}
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

          <style>{`
            .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.35); display:grid; place-items:center; z-index:9999; }
            .modal { width:min(560px,92vw); background:#fff; border-radius:16px; border:1px solid #eee; box-shadow:0 20px 60px rgba(0,0,0,.2); padding:18px; }
            .grid { display:grid; gap:12px; }
          `}</style>
        </div>
      )}

      {/* Modales admin */}
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

       {/* --- NUEVO: Editor de etiquetas con chips + sugerencias --- */}
<div className="input-wrap">
  <label>Etiquetas</label>

  {/* Chips ya seleccionados */}
  <div className="chips" style={{ gap: 8, marginBottom: 8 }}>
    {editTagList.map((t) => {
      const norm = normalizeTag(t)
      return (
        <button
          key={norm}
          type="button"
          className="chip active"
          aria-pressed="true"
          onClick={() => removeTag(norm)}
          title="Quitar etiqueta"
        >
          {prettyTag(t)} ✕
        </button>
      )
    })}
    {editTagList.length === 0 && <span className="muted">Sin etiquetas</span>}
  </div>

  {/* Input con enter/coma para añadir */}
  <input
    type="text"
    value={tagInput}
    onChange={(e) => setTagInput(e.target.value)}
    onKeyDown={onTagInputKeyDown}
    placeholder="Escribe y presiona Enter (p. ej. chocolate, fondant, baby shower)"
    aria-label="Añadir etiqueta"
  />

  {/* Sugerencias en vivo (catálogo/top) */}
  {tagSuggestions.length > 0 && (
    <div className="chips" style={{ gap: 8, marginTop: 8 }}>
      {tagSuggestions.map(({ norm, label, count }) => {
        const active = editTagList.some((t) => normalizeTag(t) === norm)
        return (
          <button
            key={norm}
            type="button"
            className={`chip ${active ? 'active' : ''}`}
            onClick={() => (active ? removeTag(norm) : addTag(label))}
            title={`${count} coincidencia${count === 1 ? '' : 's'}`}
          >
            {label}{!active && ' +'}
          </button>
        )
      })}
      {/* Atajo para limpiar todas */}
      {editTagList.length > 0 && (
        <button
          type="button"
          className="chip clear"
          onClick={() => setEditTagList([])}
          title="Limpiar todo"
        >
          Limpiar
        </button>
      )}
    </div>
  )}
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

      {/* Estilos locales de la sección */}
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

        .gallery-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; }
        .chip.clear{ background:#fff; color:#5b21b6; border:1px dashed #c4b5fd; }

        .empty { display:grid; place-items:center; min-height: 120px; }
        /* chips ya existen en tu header; esto asegura estados */
.chip { padding: 6px 10px; border-radius: 999px; border:1px solid #ddd; background:#f8f8ff; cursor:pointer; }
.chip.active { background:#5b21b6; color:#fff; border-color:#5b21b6; }
.chip.clear { background:#fff; color:#5b21b6; border:1px dashed #c4b5fd; }

      `}</style>
    </section>
  )
}
