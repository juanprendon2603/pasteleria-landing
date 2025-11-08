'use client'

import Section from '@/components/Section'
import { db } from '@/firebase/config'
import { collection, getDocs } from 'firebase/firestore'
import { useEffect, useMemo, useRef, useState } from 'react'

type Item = {
  id: string
  imageUrl: string
  publicId?: string
  createdAt?: number
}

// dentro de GallerySection
const clTransform = (url: string, publicId?: string) => {
  let cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
  if (!cloud && url) {
    const m = url.match(/res\.cloudinary\.com\/([^/]+)\/image\/upload\//i)
    if (m?.[1]) cloud = m[1]
  }
  if (cloud && publicId)
    return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,h_420,c_limit/${publicId}`
  if (url?.includes('/image/upload/'))
    return url.replace('/upload/', '/upload/f_auto,q_auto,h_420,c_limit/')
  return url
}

// Mezcla Fisher–Yates
const shuffle = <T,>(arr: T[]) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function WorksCarousel() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const trackRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const snap = await getDocs(collection(db, 'gallery'))
        const list: Item[] = snap.docs.map((d) => {
          const data = d.data() as any
          const created =
            (data?.createdAt?.toMillis && data.createdAt.toMillis()) ||
            (typeof data?.createdAt === 'number' && data.createdAt) ||
            0
          return {
            id: d.id,
            imageUrl: data?.imageUrl,
            publicId: data?.publicId,
            createdAt: created,
          }
        })
        setItems(shuffle(list))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Muestra hasta 12 aleatorias
  const toShow = useMemo(() => items.slice(0, 12), [items])

  const scrollByStep = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const step = Math.round(el.clientWidth * 0.9) // desplaza ~una “pantalla”
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  return (
    <Section
      id="trabajos"
      variant="surface"
      aria-label="Algunos de nuestros trabajos"
    >
      <div className="container">
        <header className="gal-header" data-reveal>
          <div>
            <h2 className="h2">Algunos de nuestros trabajos</h2>
            <p className="lead">
              Un vistazo rápido a lo que hacemos con amor 💜
            </p>
          </div>
          <div className="btn-group" style={{ justifyContent: 'end' }}>
            <a className="btn" href="/galeria" aria-label="Ver más trabajos">
              Ver más
            </a>
          </div>
        </header>

        {loading && (
          <div className="empty" data-reveal>
            <p>Cargando…</p>
          </div>
        )}

        {!loading && toShow.length > 0 && (
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
            >
              {toShow.map((p) => (
                <div key={p.id} className="car-slide">
                  <div className="car-frame">
                    <img
                      src={clTransform(p.imageUrl, p.publicId)}
                      alt="Trabajo reciente"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              className="car-btn car-btn--next"
              onClick={() => scrollByStep(1)}
              aria-label="Siguiente"
            >
              ›
            </button>
            <div className="load-wrap" style={{ marginTop: 18 }}>
              <a className="btn" href="/galeria">
                Ver galería completa
              </a>
            </div>
          </div>
        )}

        {!loading && toShow.length === 0 && (
          <div className="empty" data-reveal>
            <p>Aún no hay elementos para mostrar.</p>
          </div>
        )}
      </div>

      <div className="divider" aria-hidden="true" />
      <style>{`
        /* ===== Carrusel moderno con scroll-snap y tamaños variables ===== */
        .carousel{position:relative}
        .car-track{
          display:flex; gap:14px; padding:6px;
          overflow-x:auto; overscroll-behavior-x:contain;
          scroll-snap-type:x mandatory; scroll-padding:6px;
          -webkit-overflow-scrolling:touch;
          border-radius:22px;
          background:
            radial-gradient(800px 180px at 0% 0%, rgba(183,108,253,.05), transparent 60%),
            radial-gradient(800px 180px at 100% 100%, rgba(107,228,220,.06), transparent 55%);
          box-shadow: 0 10px 28px rgba(183,108,253,.12) inset;
        }

        /* Cada slide es de ancho variable; solo limitamos la ALTURA del marco */
        .car-slide{
          flex:0 0 auto;
          scroll-snap-align:center;
          display:grid; place-items:center;
          padding:8px;
          border-radius:18px;
          transition:transform .18s ease, box-shadow .18s ease;
          background:#fff;
          border:1px solid var(--ring);
          box-shadow:0 8px 20px var(--shadow);
        }

        /* Marco que mantiene la imagen con su proporción original (sin recortes) */
        .car-frame{
          max-height:420px;         /* altura objetivo desktop */
          max-width:min(86vw,820px);
          display:grid; place-items:center;
          overflow:hidden; border-radius:16px;
          background:linear-gradient(180deg,#faf7ff,#f7fffe);
        }
        @media (max-width: 900px){
          .car-frame{ max-height:360px; }
        }
        @media (max-width: 560px){
          .car-frame{ max-height:300px; }
        }

        /* La imagen conserva su tamaño original hasta donde deje el alto */
        .car-frame img{
          height:100%;
          width:auto;               /* ➜ respeta proporción, no se estira */
          object-fit:contain;       /* sin recortes */
          will-change:transform;
          transition:transform .25s ease, filter .25s ease;
          display:block;
        }

        /* Hover sutil */
        .car-slide:hover .car-frame img{ transform:scale(1.015); filter:contrast(1.02) }

        /* Botones */
        .car-btn{
          position:absolute; top:50%; transform:translateY(-50%);
          width:42px; height:42px; border-radius:999px; border:none;
          background:rgba(255,255,255,.92);
          box-shadow:0 10px 24px rgba(0,0,0,.12);
          display:grid; place-items:center;
          cursor:pointer; font-size:26px; line-height:1; font-weight:700;
          transition:transform .12s ease, background .15s ease;
          z-index:2;
        }
        .car-btn:hover{ transform:translateY(-50%) scale(1.05); background:#fff; }
        .car-btn--prev{ left:-4px }
        .car-btn--next{ right:-4px }
        @media (max-width: 720px){
          .car-btn{ display:none; }
        }
      `}</style>
    </Section>
  )
}
