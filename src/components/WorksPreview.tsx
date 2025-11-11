'use client'

import Section from '@/components/Section'
import { db } from '@/firebase/config'
import { collection, getDocs } from 'firebase/firestore'
import { useEffect, useMemo, useState, useCallback } from 'react'
import GalleryCarousel, { type GalleryItem } from '@/components/GalleryCarousel'
import GalleryGridPreview from '@/components/GalleryGridPreview'
import useMediaQuery from '@/hooks/useMediaQuery'
import Lightbox from '@/components/Lightbox'

type Item = GalleryItem

// Evita mutar el array original; Fisher–Yates.
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Tipado mínimo del documento en Firestore para no usar `any`.
type FirestoreGalleryData = {
  imageUrl?: string
  publicId?: string
  // Puede ser un número (epoch ms) o un objeto con toMillis() (Timestamp).
  createdAt?: number | { toMillis?: () => number }
}

export default function WorksPreview() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const isDesktop = useMediaQuery('(min-width: 900px)')

  // Lightbox state
  const [isOpen, setOpen] = useState(false)
  const [lbIndex, setLbIndex] = useState(0)

  // Cantidad visible por layout
  const visibleCount = isDesktop ? 12 : 8
  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount],
  )

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const snap = await getDocs(collection(db, 'gallery'))
        const list: Item[] = snap.docs.map((d) => {
          const data = d.data() as FirestoreGalleryData
          const created =
            (typeof data?.createdAt === 'number' && data.createdAt) ||
            (typeof data?.createdAt === 'object' &&
              data.createdAt?.toMillis &&
              data.createdAt.toMillis()) ||
            0
          return {
            id: d.id,
            imageUrl: data?.imageUrl ?? '',
            publicId: data?.publicId,
            createdAt: created,
          }
        })
        setItems(shuffle(list))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const openAt = useCallback((idx: number) => {
    setLbIndex(idx)
    setOpen(true)
  }, [])

  const onClose = useCallback(() => setOpen(false), [])
  const onPrev = useCallback(
    () =>
      setLbIndex((i) => (i - 1 + visibleItems.length) % visibleItems.length),
    [visibleItems.length],
  )
  const onNext = useCallback(
    () => setLbIndex((i) => (i + 1) % visibleItems.length),
    [visibleItems.length],
  )

  const hasItems = useMemo(() => items.length > 0, [items])

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
              // `GalleryCarousel` no declara `onSelect` en sus props; se elimina para cumplir TS.
              <GalleryCarousel items={items} maxItems={12} ariaLabel="Trabajos recientes" />
            ) : (
              // En grid sí abrimos el lightbox con `onSelect`.
              <GalleryGridPreview items={items} maxItems={8} onSelect={openAt} />
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
        <Lightbox
          items={visibleItems}
          index={lbIndex}
          onClose={onClose}
          onPrev={onPrev}
          onNext={onNext}
        />
      )}
    </Section>
  )
}
