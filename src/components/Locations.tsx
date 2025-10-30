// src/components/Locations.tsx
import Section from '@/components/Section'
import type { Branch } from '@/types'
import { buildBranchVCard, downloadVCard } from '@/utils/vcard'

type LocalBranch = Branch & { image: string } // solo para esta vista

const branches: LocalBranch[] = [
  {
    id: 'miranda',
    name: 'Sede Miranda',
    phone: '+57 315 5287225',
    whatsapp: '573155287225',
    email: 'pedidos.miranda@pasteleria.com',
    address: 'Calle 8 # 7 - 23',
    city: 'Miranda, Cauca',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Calle+8+%23+7+-+23+Miranda+Cauca',
    openingHours: 'Lun-Dom 8:00–19:00',
    image: '/sede-miranda.jpg', // ← pon tu imagen en /public
  },
  {
    id: 'florida',
    name: 'Sede Florida',
    phone: '+57 310 3585608',
    whatsapp: '573103585608',
    email: 'pedidos.florida@pasteleria.com',
    address: 'Calle 6 con Carrera 15, Esquina',
    city: 'Florida, Valle del Cauca',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Calle+6+con+Carrera+15+Esquina+Florida+Valle+del+Cauca',
    openingHours: 'Lun-Sáb 9:00–18:00',
    image: '/sede-florida.jpg', // ← pon tu imagen en /public
  },
]

function waLink(num?: string, text?: string) {
  if (!num) return undefined
  const t = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${num}${t}`
}

function Panel({ b, reverse }: { b: LocalBranch; reverse?: boolean }) {
  const onSave = () =>
    downloadVCard(b.name.replaceAll(' ', '_'), buildBranchVCard(b))

  return (
    <article className={`branch-panel ${reverse ? 'reverse' : ''}`} data-reveal>
      <div className="branch-media">
        {/* Imagen grande de la sede (tú la pones en /public) */}
        <img src={b.image} alt={b.name} loading="lazy" />
      </div>

      <div className="branch-body">
        <h3 className="branch-title">{b.name}</h3>
        <p className="branch-address">
          {b.address} · {b.city}
        </p>
        {b.openingHours && <p className="branch-hours">{b.openingHours}</p>}

        <div className="branch-cta">
          {b.whatsapp && (
            <a
              className="btn"
              href={waLink(b.whatsapp, 'Hola! Quiero más info 😊')}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          )}
          {b.mapsUrl && (
            <a
              className="btn secondary"
              href={b.mapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Ver en Maps
            </a>
          )}
          <button className="btn ghost" onClick={onSave}>
            Guardar contacto
          </button>
        </div>

        <div className="branch-meta">
          <a href={`tel:${b.phone}`}>{b.phone}</a>
          {b.email && (
            <>
              <span>·</span>
              <a href={`mailto:${b.email}`}>{b.email}</a>
            </>
          )}
        </div>
      </div>
    </article>
  )
}

export default function Locations() {
  return (
    <Section id="sedes" variant="alt">
      <header data-reveal style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 className="h2">Nuestras sedes</h2>
        <p className="lead">Elige tu sede y contáctanos de una 📲</p>
      </header>

      <div className="branch-stack">
        <Panel b={branches[0]} />
        <Panel b={branches[1]} reverse />
      </div>
    </Section>
  )
}
