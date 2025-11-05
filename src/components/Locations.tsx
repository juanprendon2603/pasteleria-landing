'use client'

import Section from '@/components/Section'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock, MapPin, MessageCircle, Navigation } from 'lucide-react'
import { useEffect } from 'react'

export type Branch = {
  id: string
  name: string
  phone?: string
  whatsapp?: string
  address?: string
  city?: string
  mapsUrl?: string
  openingHours?: string
  image: string
}

/** Horarios en tres líneas (bonito y legible) */
const HOURS = [
  { label: 'Lun–Sáb', time: '8:00AM – 6:00PM' },
  { label: 'Dom', time: '8:30AM – 2:00PM' },
  { label: 'Festivos', time: '8:30AM – 1:00PM' },
]

const branches: Branch[] = [
  {
    id: 'miranda',
    name: 'Sede Miranda',
    phone: '+57 315 5287225',
    whatsapp: '573155287225',
    address: 'Calle 8 # 7 - 23',
    mapsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=Calle+8+%23+7+-+23,+Miranda,+Cauca',
    openingHours: 'Lun–Sáb 8:00–18:00 · Dom 8:30–14:00 · Festivos 8:30–13:00',
    image: '/sede-miranda.jpg',
  },
  {
    id: 'florida',
    name: 'Sede Florida',
    phone: '+57 315 0815246',
    whatsapp: '573150815246',
    address: 'Calle 6 con Carrera 15, Esquina',
    mapsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=Calle+6+con+Carrera+15,+Florida,+Valle+del+Cauca',
    openingHours: 'Lun–Sáb 8:00–18:00 · Dom 8:30–14:00 · Festivos 8:30–13:00',
    image: '/sede-florida.png',
  },
]

// Utils
function onlyDigits(v?: string) {
  return (v ?? '').replace(/\D+/g, '')
}
function waLink(num?: string, text?: string) {
  const digits = onlyDigits(num)
  if (!digits) return undefined
  const t = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${digits}${t}`
}

// Reveal fallback
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
      { threshold: 0.16, rootMargin: '40px 0px -20px 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

// Animations
const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55 } },
}
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

// Card
function Banner({ b }: { b: Branch }) {
  const wa = waLink(b.whatsapp, '¡Hola! Quiero más info 😊')

  return (
    <motion.article
      className="branch card-out"
      variants={cardVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      aria-label={`Información de ${b.name}`}
    >
      {/* --- Cabecera con imagen (solo título y dirección encima) --- */}
      <div className="branch-head">
        <img
          src={b.image}
          alt=""
          className="branch-head__img"
          loading="lazy"
          decoding="async"
        />
        <div className="branch-head__overlay" />
        <div className="branch-head__content">
          <h3 className="branch-head__title">{b.name}</h3>
          <p className="branch-head__sub">
            <MapPin
              size={16}
              style={{ marginRight: 6, verticalAlign: '-2px' }}
            />
            {b.address}
          </p>
        </div>
      </div>

      {/* --- Cuerpo fuera de la imagen: horarios + botones --- */}
      <div className="branch-body">
        <div
          className="hours-card hours-card--out"
          role="group"
          aria-label={`Horarios de ${b.name}`}
        >
          <div className="hours-card__header">
            <Clock size={18} aria-hidden="true" />
            <span>Horarios</span>
          </div>
          <ul className="hours-list">
            {HOURS.map(({ label, time }) => (
              <li key={label} className="hour-row">
                <span className="hour-label">{label}</span>
                <span className="hour-time">{time}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="banner-cta"
          role="group"
          aria-label={`Acciones de ${b.name}`}
        >
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              <MessageCircle size={18} aria-hidden="true" /> WhatsApp
            </a>
          )}
          {b.mapsUrl && (
            <a
              href={b.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn secondary"
            >
              <Navigation size={18} aria-hidden="true" /> Ver en Maps
            </a>
          )}
        </div>
      </div>
    </motion.article>
  )
}

export default function LocationsPastel() {
  useRevealFallback()

  return (
    <Section
      id="sedes"
      variant="alt"
      style={{
        background:
          'linear-gradient(180deg, #FFF1F7 0%, #F6F8FF 100%),' +
          'radial-gradient(circle at top left, rgba(255, 182, 255, 0.25), transparent 60%),' +
          'radial-gradient(circle at bottom right, rgba(180, 230, 255, 0.3), transparent 60%)',
        paddingBlock: '64px',
      }}
      aria-labelledby="sedes-title"
      center
    >
      <div className="container" style={{ textAlign: 'center' }}>
        <header data-reveal style={{ marginBottom: 28 }}>
          <h2 id="sedes-title" className="h2">
            Nuestras sedes
          </h2>
          <p className="lead">Elige tu sede y contáctanos de una 📲</p>
        </header>

        <div className="branch-grid-2 branch-grid-2--center">
          <AnimatePresence>
            {branches.map((b) => (
              <Banner key={b.id} b={b} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </Section>
  )
}
