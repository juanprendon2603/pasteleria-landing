'use client'

import { useCallback, useMemo, useRef } from 'react'

export type GalleryItem = {
  id: string
  imageUrl: string
  publicId?: string
  createdAt?: number
}

/** ===== Helpers Cloudinary (solo usados por el carrusel) ===== */
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

/** URL “principal” para fallback (desktop) */
const clTransform = (url: string, publicId?: string) => {
  let cloud: string | undefined = getViteCloudName()
  if (!cloud && url) cloud = ensureCloudNameFromUrl(url)

  const common = 'f_auto,q_auto,dpr_auto'
  if (cloud && publicId) return `${clBaseUrl(cloud)}/${common},w_960,c_limit/${publicId}`
  if (url?.includes('/image/upload/'))
    return url.replace('/upload/', `/upload/${common},w_960,c_limit/`)
  return url
}

/** srcset para que mobile reciba archivos más pequeños */
const clSrcSet = (url: string, publicId?: string) => {
  let cloud: string | undefined = getViteCloudName()
  if (!cloud && url) cloud = ensureCloudNameFromUrl(url)
  const widths = [320, 480, 640, 800, 960, 1200]
  const common = 'f_auto,q_auto,dpr_auto,c_limit'

  if (cloud && publicId) {
    return widths.map((w) => `${clBaseUrl(cloud)}/${common},w_${w}/${publicId} ${w}w`).join(', ')
  }
  if (url?.includes('/image/upload/')) {
    return widths.map((w) => url.replace('/upload/', `/upload/${common},w_${w}/`) + ` ${w}w`).join(', ')
  }
  return undefined
}

type Props = {
  items: GalleryItem[]
  sizes?: string
  ariaLabel?: string
  /** Por defecto 12 */
  maxItems?: number
}

export default function GalleryCarousel({
  items,
  sizes = '(max-width:560px) 86vw, (max-width:900px) 78vw, 540px',
  ariaLabel = 'Carrusel',
  maxItems = 12,
}: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const toShow = useMemo(() => items.slice(0, maxItems), [items, maxItems])

  const scrollByStep = useCallback((dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.95), behavior: 'smooth' })
  }, [])

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') scrollByStep(1)
    if (e.key === 'ArrowLeft') scrollByStep(-1)
  }

  if (toShow.length === 0) return null

  return (
    <div className="carousel">
      <button
        className="car-btn car-btn--prev"
        onClick={() => scrollByStep(-1)}
        aria-label="Anterior"
      >
        ‹
      </button>

      <div
        ref={trackRef}
        className="car-track"
        tabIndex={0}
        aria-roledescription="Carrusel"
        aria-label={ariaLabel}
        onKeyDown={onKey}
      >
        {toShow.map((p) => {
          const src = clTransform(p.imageUrl, p.publicId)
          const srcSet = clSrcSet(p.imageUrl, p.publicId)
          return (
            <div key={p.id} className="car-slide">
              <div className="car-frame">
                <img
                  src={src}
                  srcSet={srcSet}
                  sizes={sizes}
                  alt="Trabajo reciente"
                  loading="lazy"
                  decoding="async"
                  width={960}
                  height={720}
                />
              </div>
            </div>
          )
        })}
      </div>

      <button
        className="car-btn car-btn--next"
        onClick={() => scrollByStep(1)}
        aria-label="Siguiente"
      >
        ›
      </button>
    </div>
  )
}
