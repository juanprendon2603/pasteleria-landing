import Section from '@/components/Section'
import { useEffect } from 'react'

export default function Hero() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]')
    const reduce = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('reveal-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const target = e.target as HTMLElement
            target.classList.add('reveal-in')
            io.unobserve(target)
          }
        })
      },
      { threshold: 0.2, rootMargin: '40px 0px -20px 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
<Section
  center
  variant="brand"
  id="inicio"
  aria-label="Portada pastelería"
  style={{ paddingTop: 0, marginTop: 0 }}
>
      {/* decor blobs */}
      <span className="orb orb--1" aria-hidden="true" />
      <span className="orb orb--2" aria-hidden="true" />
      <span className="orb orb--3" aria-hidden="true" />

      <div className="container hero-wrap">
        <div className="split">
          {/* Texto */}
          <div data-reveal className="hero-copy">
            <p className="eyebrow">Pastelería artesanal</p>
            <h1 className="h1">La excelencia en pastelería</h1>
            <p className="lead">
              Tortas elegantes, frescas y con el toque perfecto para tus
              momentos especiales.
            </p>

            <div
              className="btn-group"
              role="group"
              aria-label="Acciones principales"
            >
              <a className="btn btn-lg" href="#sedes">
                Ver sedes
              </a>
              <a className="btn secondary btn-lg" href="#redes">
                Síguenos
              </a>
            </div>
          </div>

          {/* Imagen */}
          <div data-reveal className="hero-media">
            <picture>
              <source srcSet="/hero-cake.png" type="image/webp" />
              <img
                src="/hero-cake.png"
                width={520}
                height={520}
                decoding="async"
                fetchPriority="high"
                alt="Torta de cumpleaños con mariposas doradas"
                className="hero-img floaty"
              />
            </picture>
          </div>
        </div>
      </div>

      {/* separador sutil entre secciones (opcional) */}
      <div className="divider" aria-hidden="true" />
    </Section>
  )
}
