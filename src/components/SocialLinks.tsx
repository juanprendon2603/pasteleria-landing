'use client'

import Section from '@/components/Section'
import { motion } from 'framer-motion'

type Social = {
  id: 'instagram' | 'tiktok' | 'facebook'
  label: string
  href: string
  handle: string
}

const socials: Social[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://instagram.com/pasteleria.nancy',
    handle: '@pasteleria.nancy',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    href: 'https://tiktok.com/@pasteleria_nancy',
    handle: '@pasteleria_nancy',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://www.facebook.com/p/Pasteleria-Nancy-100054205523535/',
    handle: 'Pastelería Nancy',
  },
]

// WhatsApp por sede
const waMiranda =
  'https://wa.me/573155287225?text=' + encodeURIComponent('¡Hola!')
const waFlorida =
  'https://wa.me/573150815246?text=' + encodeURIComponent('¡Hola!')

// Íconos SVG minimal
const Icon = {
  ig: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  ),
  tt: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M14 3v6.5a4.5 4.5 0 1 1-4.5-4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 6c1.2 1.8 3.1 3 5 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  fb: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M14 9h3V6h-3a3 3 0 0 0-3 3v3H8v3h3v6h3v-6h3l1-3h-4V9a1 1 0 0 1 1-1z"
        fill="currentColor"
      />
    </svg>
  ),
  wa: () => (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <path
        d="M16 3C9.37 3 4 8.37 4 15c0 2.1.54 4.1 1.49 5.83L4 29l8.4-1.46A11.9 11.9 0 0 0 16 27c6.63 0 12-5.37 12-12S22.63 3 16 3z"
        fill="currentColor"
      />
      <path
        d="M22.1 19.9c-.2.57-1.16 1.08-1.6 1.1-.43.03-.97.04-1.56-.1-.36-.09-.83-.27-1.43-.53-2.51-1.08-4.14-3.7-4.27-3.88-.13-.18-1.02-1.36-1.02-2.6 0-1.23.65-1.83.88-2.09s.5-.33.66-.33H14c.15 0 .35-.06.55.42.2.49.67 1.7.73 1.83.06.13.1.28.02.46a2 2 0 0 1-.72.89c-.12.12-.25.26-.11.51.14.26.62 1.02 1.34 1.66.92.82 1.68 1.07 1.94 1.19.26.12.42.1.58-.06.16-.16.67-.78.85-1.05.18-.26.36-.22.6-.13.24.09 1.49.7 1.75.83.26.13.43.19.49.3.06.11.06.63-.14 1.2z"
        fill="#fff"
      />
    </svg>
  ),
}

// Animaciones suaves
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const item = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } },
}

export default function SocialLinks() {
  return (
    <Section
      id="redes"
      variant="surface"
      center
      style={{
        background:
          'linear-gradient(180deg,#fff7fe 0%,#f9faff 40%,#fff1f7 100%)',
      }}
    >
      <header data-reveal style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 id="redes-title" className="h2">
          Síguenos y antójate
        </h2>
        <p className="lead">
          Promos, nuevos sabores y un vistazo al detrás de nuestras creaciones.
        </p>
      </header>

      {/* Redes Sociales */}
      <motion.div
        className="social-center"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        {socials.map((s) => (
          <motion.a
            key={s.id}
            href={s.href}
            target="_blank"
            rel="noreferrer"
            className={`social-card ${s.id}`}
            variants={item}
            whileHover={{
              y: -4,
              boxShadow: '0 10px 24px rgba(183,108,253,0.25)',
              scale: 1.03,
            }}
            style={{
              borderRadius: 18,
              background: '#fff',
              border: '1px solid #eadfff',
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              transition: 'all 0.2s ease',
            }}
          >
            <span
              className="icon"
              style={{
                color:
                  s.id === 'instagram'
                    ? '#E4405F'
                    : s.id === 'facebook'
                      ? '#1877F2'
                      : '#000',
              }}
            >
              {s.id === 'instagram' ? (
                <Icon.ig />
              ) : s.id === 'tiktok' ? (
                <Icon.tt />
              ) : (
                <Icon.fb />
              )}
            </span>
            <div className="text" style={{ textAlign: 'left' }}>
              <strong style={{ fontSize: '16px', display: 'block' }}>
                {s.label}
              </strong>
              <span className="handle" style={{ color: '#857b9a' }}>
                {s.handle}
              </span>
            </div>
          </motion.a>
        ))}
      </motion.div>

      {/* WhatsApp modernizado */}
      <motion.div
        className="wa-wrap"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        style={{
          marginTop: 36,
          gap: 16,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {[
          { href: waMiranda, label: 'Sede Miranda' },
          { href: waFlorida, label: 'Sede Florida' },
        ].map((w, i) => (
          <motion.a
            key={i}
            href={w.href}
            target="_blank"
            rel="noreferrer"
            variants={item}
            whileHover={{
              scale: 1.05,
              boxShadow: '0 8px 20px rgba(37,211,102,0.25)',
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(90deg,#25D366,#128C7E)',
              color: '#fff',
              borderRadius: 999,
              padding: '12px 20px',
              fontWeight: 700,
              boxShadow: '0 6px 14px rgba(37,211,102,0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            <Icon.wa />
            WhatsApp {w.label}
          </motion.a>
        ))}
      </motion.div>
    </Section>
  )
}
