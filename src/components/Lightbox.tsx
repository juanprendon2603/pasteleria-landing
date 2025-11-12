'use client'

import { useEffect, useRef, useState } from 'react'

type Item = { imageUrl: string; publicId?: string; fullUrl?: string }

const ensureCloudNameFromUrl = (url?: string) => {
  if (!url) return undefined
  const m = url.match(/res\.cloudinary\.com\/([^/]+)\/image\/upload\//i)
  return m?.[1]
}

const clBaseUrl = (cloud?: string) =>
  cloud ? `https://res.cloudinary.com/${cloud}/image/upload` : ''

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
  const [loading, setLoading] = useState(true)
  const item = items[index]
  const src = clLarge(item.fullUrl || item.imageUrl, item.publicId)

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

  // Reinicia el loader cuando cambia de imagen
  useEffect(() => {
    setLoading(true)
    const img = new Image()
    img.onload = () => setLoading(false)
    img.onerror = () => setLoading(false)
    img.src = src
  }, [src])

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
          {loading && (
            <div className="lb-loading">
              <div className="spinner" />
              <span>Cargando imagen…</span>
            </div>
          )}
          <img
            src={src}
            alt="Trabajo ampliado"
            loading="eager"
            decoding="async"
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
            style={{
              opacity: loading ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}
            onTouchStart={(e) => { startX.current = e.touches[0].clientX }}
            onTouchMove={(e) => {
              if (startX.current == null) return
              const dx = e.touches[0].clientX - startX.current
              if (Math.abs(dx) > 50) {
                if (dx > 0) onPrev()
                else onNext()
                startX.current = null
              }
            }}
            onTouchEnd={() => { startX.current = null }}
          />
          <figcaption className="lb-cap">
            {index + 1} / {items.length}
          </figcaption>
        </figure>

        <button className="lb-nav lb-next" aria-label="Siguiente" onClick={onNext}>›</button>

        <style>{`
          .lb-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .lb-content {
            position: relative;
            max-width: 90%;
            max-height: 90%;
          }
          .lb-figure {
            margin: 0;
            position: relative;
          }
          .lb-cap {
            text-align: center;
            margin-top: 8px;
            color: #fff;
            font-size: 0.9rem;
          }
          .lb-close, .lb-nav {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            color: #fff;
            font-size: 2rem;
            background: none;
            border: none;
            cursor: pointer;
            z-index: 2;
            opacity: 0.7;
          }
          .lb-close {
            top: 16px;
            right: 24px;
            font-size: 2.2rem;
            transform: none;
          }
          .lb-prev { left: -40px; }
          .lb-next { right: -40px; }
          .lb-nav:hover, .lb-close:hover { opacity: 1; }

          .lb-loading {
            position: absolute;
            inset: 0;
            display: grid;
            place-items: center;
            background: rgba(0,0,0,.4);
            color: #fff;
            font-weight: 600;
            z-index: 5;
          }
          .spinner {
            width: 38px; height: 38px;
            border-radius: 50%;
            border: 3px solid rgba(255,255,255,.35);
            border-top-color: #fff;
            animation: spin .9s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  )
}
