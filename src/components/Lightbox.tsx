'use client'

import { useEffect, useRef } from 'react'

type Item = { imageUrl: string; publicId?: string }

const ensureCloudNameFromUrl = (url?: string) => {
  if (!url) return undefined
  const m = url.match(/res\.cloudinary\.com\/([^/]+)\/image\/upload\//i)
  return m?.[1]
}

const clBaseUrl = (cloud?: string) =>
  cloud ? `https://res.cloudinary.com/${cloud}/image/upload` : ''

// Lee VITE_CLOUDINARY_CLOUD_NAME sin usar `any`
const getViteCloudName = (): string | undefined => {
  const meta = import.meta as unknown as { env?: Record<string, unknown> }
  const v = meta?.env?.['VITE_CLOUDINARY_CLOUD_NAME']
  return typeof v === 'string' ? v : undefined
}

/** Versión grande optimizada (no recorta) */
const clLarge = (url: string, publicId?: string, w = 1600) => {
  let cloud: string | undefined = getViteCloudName()
  if (!cloud && url) cloud = ensureCloudNameFromUrl(url)
  const common = 'f_auto,q_auto,dpr_auto,c_limit'
  if (cloud && publicId) return `${clBaseUrl(cloud)}/${common},w_${w}/${publicId}`
  if (url?.includes('/image/upload/'))
    return url.replace('/upload/', `/upload/${common},w_${w}/`)
  return url
}

type Props = {
  items: Item[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export default function Lightbox({ items, index, onClose, onPrev, onNext }: Props) {
  const startX = useRef<number | null>(null)

  // ESC y flechas
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, onPrev, onNext])

  const item = items[index]
  const src = clLarge(item.imageUrl, item.publicId)

  return (
    <div
      className="lb-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Foto ampliada"
      onClick={onClose}
    >
      <div className="lb-content" onClick={(e) => e.stopPropagation()}>
        <button className="lb-close" aria-label="Cerrar" onClick={onClose}>×</button>

        <button className="lb-nav lb-prev" aria-label="Anterior" onClick={onPrev}>‹</button>
        <figure className="lb-figure">
          <img
            src={src}
            alt="Trabajo ampliado"
            loading="eager"
            decoding="async"
            onTouchStart={(e) => { startX.current = e.touches[0].clientX }}
            onTouchMove={(e) => {
              if (startX.current == null) return
              const dx = e.touches[0].clientX - startX.current
              if (Math.abs(dx) > 50) {
                if (dx > 0) {
                  onPrev()
                } else {
                  onNext()
                }
                startX.current = null
              }
            }}
            onTouchEnd={() => { startX.current = null }}
          />
          <figcaption className="lb-cap">{index + 1} / {items.length}</figcaption>
        </figure>
        <button className="lb-nav lb-next" aria-label="Siguiente" onClick={onNext}>›</button>
      </div>
    </div>
  )
}
