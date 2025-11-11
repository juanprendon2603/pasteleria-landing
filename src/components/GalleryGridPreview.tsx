'use client'

import { useMemo } from 'react'
import type { GalleryItem } from '@/components/GalleryCarousel'

/** ===== Helpers Cloudinary (local al componente) ===== */
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

/** Thumb cuadrado rápido para grid mobile (sin recortes) */
const clThumb = (url: string, publicId?: string, w = 480) => {
  let cloud: string | undefined = getViteCloudName()
  if (!cloud && url) cloud = ensureCloudNameFromUrl(url)
  const common = 'f_auto,q_auto,dpr_auto,c_limit'
  if (cloud && publicId) return `${clBaseUrl(cloud)}/${common},w_${w}/${publicId}`
  if (url?.includes('/image/upload/'))
    return url.replace('/upload/', `/upload/${common},w_${w}/`)
  return url
}

type Props = {
  items: GalleryItem[]
  maxItems?: number
  onSelect?: (index: number) => void
}

export default function GalleryGridPreview({ items, maxItems = 8, onSelect }: Props) {
  const toShow = useMemo(() => items.slice(0, maxItems), [items, maxItems])

  if (!toShow.length) return null

  return (
    <>
      <div className="gallery-grid" aria-label="Vista rápida de trabajos">
        {toShow.map((p, i) => {
          const src = clThumb(p.imageUrl, p.publicId, 480)
          return (
            <article key={p.id} className="photo-tile photo-tile--plain">
              <button className="thumb-wrap" onClick={() => onSelect?.(i)} aria-label="Ver grande">
                <img
                  src={src}
                  alt="Trabajo reciente"
                  loading="lazy"
                  decoding="async"
                  width={480}
                  height={480}
                  style={{ aspectRatio: '1 / 1', objectFit: 'contain' }}
                />
              </button>
            </article>
          )
        })}
      </div>

      <div className="load-wrap narrow-560">
        <a className="btn" href="/galeria">Ver galería completa</a>
      </div>
    </>
  )
}
