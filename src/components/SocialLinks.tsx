// src/components/SocialLinks.tsx
import Section from '@/components/Section'

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
  'https://wa.me/573155287225?text=' +
  encodeURIComponent('¡Hola! Quiero información de la sede Miranda 😊')
const waFlorida =
  'https://wa.me/573103585608?text=' +
  encodeURIComponent('¡Hola! Quiero información de la sede Florida 😊')

// Íconos SVG minimal (sin dependencias)
const Icon = {
  ig: () => (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
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
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
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
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14 9h3V6h-3a3 3 0 0 0-3 3v3H8v3h3v6h3v-6h3l1-3h-4V9a1 1 0 0 1 1-1z"
        fill="currentColor"
      />
    </svg>
  ),
  wa: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
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

export default function SocialLinks() {
  return (
    <Section id="redes">
      <header data-reveal style={{ textAlign: 'center' }}>
        <h2 id="redes-title" className="h2">
          Síguenos y antójate
        </h2>
        <p className="lead">
          Promos, nuevos sabores y el detrás de cámaras de nuestras creaciones.
        </p>
      </header>

      {/* Redes centradas */}
      <div className="social-center" data-reveal>
        {socials.map((s) => (
          <a
            key={s.id}
            href={s.href}
            target="_blank"
            rel="noreferrer"
            className={`social-card ${s.id}`}
            aria-label={s.label}
          >
            <span className="icon">
              {s.id === 'instagram' ? (
                <Icon.ig />
              ) : s.id === 'tiktok' ? (
                <Icon.tt />
              ) : (
                <Icon.fb />
              )}
            </span>
            <div className="text">
              <strong>{s.label}</strong>
              <span className="handle">{s.handle}</span>
            </div>
          </a>
        ))}
      </div>

      {/* WhatsApp por sede (centrado) */}
      <div className="wa-wrap" data-reveal>
        <a className="wa-btn" href={waMiranda} target="_blank" rel="noreferrer">
          <Icon.wa /> WhatsApp Sede Miranda
        </a>
        <a className="wa-btn" href={waFlorida} target="_blank" rel="noreferrer">
          <Icon.wa /> WhatsApp Sede Florida
        </a>
      </div>
    </Section>
  )
}
