'use client'

import Section from '@/components/Section'
import { motion } from 'framer-motion'
import { Clock, MapPin, MessageCircle, Navigation } from 'lucide-react'
import { useEffect } from 'react'

// Horarios
const HOURS = [
  { label: 'Lun–Sáb', time: '8:00AM – 6:00PM' },
  { label: 'Dom', time: '8:30AM – 2:00PM' },
  { label: 'Festivos', time: '8:30AM – 1:00PM' },
]

// Data única (más limpio)
const BRANCH = {
  name: 'Sede Miranda',
  whatsapp: '573155287225',
  address: 'Calle 8 # 7 - 23',
  mapsUrl:
    'https://www.google.com/maps/dir/?api=1&destination=Calle+8+%23+7+-+23,+Miranda,+Cauca',
  image: '/sede-miranda.jpg',
}

// Utils
function waLink(num?: string, text?: string) {
  if (!num) return undefined
  const t = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${num}${t}`
}

// Reveal
function useRevealFallback() {
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
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            ;(e.target as HTMLElement).classList.add('reveal-in')
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.2 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

// Animación
const card = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6 },
  },
}

export default function LocationsPastel() {
  useRevealFallback()

  const wa = waLink(BRANCH.whatsapp, '¡Hola! Quiero hacer un pedido 😊')

  return (
    <Section
      id="sedes"
      variant="alt"
      style={{
        background: 'linear-gradient(180deg, #FFF1F7 0%, #F6F8FF 100%)',
        paddingBlock: '80px',
      }}
      center
    >
      <div className="container" style={{ textAlign: 'center' }}>
        <header data-reveal style={{ marginBottom: 40 }}>
          <h2 className="h2">Nuestra sede</h2>
          <p className="lead">Visítanos o haz tu pedido fácilmente 📲</p>
        </header>

        {/* CARD GRANDE CENTRADA */}
        <motion.article
          variants={card}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          style={{
            maxWidth: 720,
            margin: '0 auto',
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
            background: '#fff',
          }}
        >
          {/* Imagen */}
          <div style={{ position: 'relative' }}>
            <img
              src={BRANCH.image}
              alt="Sede Miranda"
              style={{
                width: '100%',
                height: 320,
                objectFit: 'cover',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
              }}
            />

            <div
              style={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                color: '#fff',
                textAlign: 'left',
              }}
            >
              <h3 style={{ fontSize: 24, fontWeight: 600 }}>{BRANCH.name}</h3>
              <p style={{ opacity: 0.9 }}>
                <MapPin size={16} /> {BRANCH.address}
              </p>
            </div>
          </div>

          {/* Contenido */}
          <div style={{ padding: 28 }}>
            {/* Horarios */}
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                <Clock size={18} /> Horarios
              </div>

              {HOURS.map((h) => (
                <div
                  key={h.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                    fontSize: 15,
                  }}
                >
                  <span>{h.label}</span>
                  <span>{h.time}</span>
                </div>
              ))}
            </div>

            {/* Botones */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              {wa && (
                <a href={wa} target="_blank" className="btn">
                  <MessageCircle size={18} /> WhatsApp
                </a>
              )}

              <a
                href={BRANCH.mapsUrl}
                target="_blank"
                className="btn secondary"
              >
                <Navigation size={18} /> Cómo llegar
              </a>
            </div>
          </div>
        </motion.article>
      </div>
    </Section>
  )
}
