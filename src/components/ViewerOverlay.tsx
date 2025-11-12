'use client'

import React, { useEffect, useState } from 'react'

export default function ViewerOverlay({
  src,
  onClose,
}: {
  src: string
  onClose: () => void
}) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return (
    <div className="image-viewer-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="image-viewer-stage" onClick={(e) => e.stopPropagation()}>
        {!loaded && !failed && (
          <div className="viewer-loading">
            <div className="loader-ring" />
            <p className="viewer-loading-text">Cargando imagen…</p>
          </div>
        )}

        {failed ? (
          <div className="viewer-error" role="alert">
            <p>No se pudo cargar la imagen.</p>
            <button className="btn" onClick={onClose} type="button">Cerrar</button>
          </div>
        ) : (
          <img
            src={src}
            alt="Vista ampliada"
            className={`image-viewer-img ${loaded ? 'in' : 'hide'}`}
            loading="eager"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        )}

        {loaded && (
          <button
            className="image-viewer-close"
            onClick={onClose}
            aria-label="Cerrar vista"
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      <style>{`
        .image-viewer-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: grid; place-items: center; z-index: 2000; cursor: zoom-out; animation: fadeIn .25s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .image-viewer-stage{ position:relative; max-width:95vw; max-height:90vh; }
        .image-viewer-img { max-width: 95vw; max-height: 90vh; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); cursor: default; }
        .image-viewer-img.hide{ opacity:0; }
        .image-viewer-img.in{ opacity:1; transition: opacity .25s ease; }

        .viewer-loading{
          position:absolute; inset:0; display:grid; place-items:center; gap:10px;
          padding:24px; text-align:center;
          background: radial-gradient(1200px 600px at 50% 10%, rgba(255,255,255,.06), transparent);
          backdrop-filter: blur(2px);
        }
        .viewer-loading-text{ color:#e5e7eb; margin:0; font-weight:600; letter-spacing:.2px; }
        .loader-ring{
          width:64px; height:64px; border-radius:999px;
          border:4px solid rgba(255,255,255,.25);
          border-top-color:#b76cfd; border-right-color:#6be4dc;
          animation: spin .9s linear infinite;
          box-shadow: 0 0 22px rgba(183,108,253,.35), inset 0 0 12px rgba(107,228,220,.2);
        }
        @keyframes spin{ to { transform: rotate(360deg); } }
        .viewer-error{ position:absolute; inset:0; display:grid; place-items:center; gap:10px; color:#fff; }
        .image-viewer-close{
          position:absolute; top:12px; right:12px;
          background: rgba(255,255,255,0.95); color:#111; border:none;
          border-radius:999px; width:40px; height:40px; font-size:22px; font-weight:700;
          display:grid; place-items:center; cursor:pointer;
          box-shadow:0 6px 18px rgba(0,0,0,.25);
        }
      `}</style>
    </div>
  )
}
