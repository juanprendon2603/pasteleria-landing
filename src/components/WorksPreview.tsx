'use client'

import Section from '@/components/Section'
import { db } from '@/firebase/config'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { useEffect, useMemo, useState, useCallback } from 'react'
import GalleryCarousel, { type GalleryItem } from '@/components/GalleryCarousel'
import GalleryGridPreview from '@/components/GalleryGridPreview'
import useMediaQuery from '@/hooks/useMediaQuery'
import Lightbox from '@/components/Lightbox'

/** ===== Tipos ===== */
type FirestoreGalleryData = {
  imageUrl?: string
  publicId?: string
  createdAt?: number | { toMillis?: () => number }
}

/** Item base que usan tus componentes actuales */
type BaseItem = GalleryItem & {
  publicId?: string
  createdAt?: number
}

/** Item extendido solo para optimizaciones (thumb/full) */
type ExtendedItem = BaseItem & {
  fullUrl?: string
  thumbUrl?: string
}

/** ===== Utils ===== */
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Detecta cloud de Cloudinary dentro de una URL pública existente
const getCloudFromUrl = (url?: string): string | undefined => {
  if (!url) return undefined
  const m = url.match(/res\.cloudinary\.com\/([^/]+)\/image\/upload\//i)
  return m?.[1]
}

// Genera una URL optimizada (ancho objetivo) para Cloudinary.
// - Si hay publicId: compone URL segura.
// - Si no, intenta inyectar transform en la URL existente.
// - Si no se puede, devuelve la original.
function clTransform(
  url?: string,
  publicId?: string,
  opts?: { width?: number; quality?: 'auto' | 'eco' | 'good' }
): string {
  const width = opts?.width ?? 1200
  const q = opts?.quality ?? 'auto'
  if (!publicId) return url ?? ''
  let cloud: string | undefined = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as
    | string
    | undefined
  if (!cloud && url) cloud = getCloudFromUrl(url)
  if (!cloud) return url ?? ''
  // c_limit asegura que no recorte; dpr_auto adapta densidad; f_auto formato óptimo
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_${q},dpr_auto,w_${width},c_limit/${publicId}`
}

export default function WorksPreview() {
  const [items, setItems] = useState<BaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const isDesktop = useMediaQuery('(min-width: 900px)')

  // Lightbox state
  const [isOpen, setOpen] = useState(false)
  const [lbIndex, setLbIndex] = useState(0)
  const [lbLoading, setLbLoading] = useState(false) // loading visual del lightbox

  /** === Fetch optimizado (ordenado + límite) === */
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const qref = query(
          collection(db, 'gallery'),
          orderBy('createdAt', 'desc'),
          limit(60),
        )
        const snap = await getDocs(qref)
        const list: BaseItem[] = snap.docs.map((d) => {
          const data = d.data() as FirestoreGalleryData
          const createdNum =
            (typeof data?.createdAt === 'number' && data.createdAt) ||
            (typeof data?.createdAt === 'object' &&
              typeof data.createdAt?.toMillis === 'function' &&
              data.createdAt.toMillis()) ||
            0

          return {
            id: d.id,
            imageUrl: data?.imageUrl ?? '',
            publicId: data?.publicId,
            createdAt: createdNum ?? 0,
          }
        })
        setItems(shuffle(list))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  /** === Deriva URLs optimizadas según layout === */
  // - Desktop: w≈1400 para lightbox
  // - Mobile: w≈900 (reduce bastante el peso)
  const optimizedItems: ExtendedItem[] = useMemo(() => {
    const wFull = isDesktop ? 1400 : 900
    const quality: 'auto' | 'eco' | 'good' = isDesktop ? 'auto' : 'eco'

    return items.map<ExtendedItem>((it) => {
      const full = clTransform(it.imageUrl, it.publicId, {
        width: wFull,
        quality,
      }) || it.imageUrl

      const thumb = clTransform(it.imageUrl, it.publicId, {
        width: isDesktop ? 520 : 420,
        quality: 'eco',
      }) || it.imageUrl

      return {
        ...it,
        imageUrl: thumb, // grids/carousel usan esta (rápida)
        fullUrl: full,   // lightbox puede usar esta
        thumbUrl: thumb,
      }
    })
  }, [items, isDesktop])

  const visibleCount = isDesktop ? 12 : 8
  const visibleItems: ExtendedItem[] = useMemo(
    () => optimizedItems.slice(0, visibleCount),
    [optimizedItems, visibleCount],
  )

  const hasItems = visibleItems.length > 0

  /** === Lightbox control con loading y prefetch === */
  const openAt = useCallback((idx: number) => {
    setLbIndex(idx)
    setOpen(true)
  }, [])

  const onClose = useCallback(() => setOpen(false), [])

  const onPrev = useCallback(
    () => setLbIndex((i) => (i - 1 + visibleItems.length) % visibleItems.length),
    [visibleItems.length],
  )

  const onNext = useCallback(
    () => setLbIndex((i) => (i + 1) % visibleItems.length),
    [visibleItems.length],
  )

  // Cuando cambia la imagen del lightbox: mostramos loading hasta que cargue
  useEffect(() => {
    if (!isOpen || !visibleItems[lbIndex]) return
    setLbLoading(true)

    const current = visibleItems[lbIndex]
    const full = current.fullUrl ?? current.imageUrl
    const img = new Image()
    img.onload = () => setLbLoading(false)
    img.onerror = () => setLbLoading(false)
    img.src = full

    // Prefetch siguiente y anterior para navegación instantánea
    const next = visibleItems[(lbIndex + 1) % visibleItems.length]?.fullUrl
    const prev =
      visibleItems[(lbIndex - 1 + visibleItems.length) % visibleItems.length]
        ?.fullUrl
    if (next) {
      const i2 = new Image()
      i2.src = next
    }
    if (prev) {
      const i3 = new Image()
      i3.src = prev
    }
  }, [isOpen, lbIndex, visibleItems])

  return (
    <Section id="trabajos" variant="surface" aria-label="Algunos de nuestros trabajos">
      <div className="container">
        <header className="gal-header" data-reveal>
          <div>
            <h2 className="h2">Algunos de nuestros trabajos</h2>
            <p className="lead">Un vistazo rápido a lo que hacemos con amor 💜</p>
          </div>
          {isDesktop && (
            <div className="btn-group">
              <a className="btn" href="/galeria" aria-label="Ver más trabajos">
                Ver más
              </a>
            </div>
          )}
        </header>

        {loading && (
          <div className="empty" data-reveal aria-live="polite">
            <p>Cargando…</p>
          </div>
        )}

        {!loading && hasItems && (
          <>
            {isDesktop ? (
              <GalleryCarousel
                items={visibleItems}
                maxItems={12}
                ariaLabel="Trabajos recientes"
              />
            ) : (
              <GalleryGridPreview
                items={visibleItems}
                maxItems={8}
                onSelect={openAt}
              />
            )}
          </>
        )}

        {!loading && !hasItems && (
          <div className="empty" data-reveal>
            <p>Aún no hay elementos para mostrar.</p>
          </div>
        )}
      </div>

      <div className="divider" aria-hidden="true" />

      {isOpen && (
        <>
          {/* Loader del lightbox (overlay sutil) */}
          {lbLoading && (
            <div className="lb-loading" aria-live="polite" aria-busy="true">
              <div className="spinner" />
              <span>Cargando imagen…</span>
            </div>
          )}

          <Lightbox
            items={visibleItems}
            index={lbIndex}
            onClose={onClose}
            onPrev={onPrev}
            onNext={onNext}
          />
        </>
      )}

      {/* estilos mínimos para el loader */}
      <style>{`
        .lb-loading{
          position: fixed; inset: 0; z-index: 99999;
          display: grid; place-items: center; gap: 12px;
          background: rgba(0,0,0,.35);
          color: #fff; font-weight: 700; text-shadow: 0 2px 8px rgba(0,0,0,.6);
        }
        .spinner{
          width: 36px; height: 36px; border-radius: 50%;
          border: 3px solid rgba(255,255,255,.35);
          border-top-color: #fff;
          animation: spin .9s linear infinite;
        }
        @keyframes spin{ to { transform: rotate(360deg); } }
      `}</style>
    </Section>
  )
}
