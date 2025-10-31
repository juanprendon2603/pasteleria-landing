import type { Branch } from '@/types'
import { buildBranchVCard, downloadVCard } from '@/utils/vcard'

type Props = { branch: Branch }

export default function ContactCard({ branch }: Props) {
  const onSave = () => {
    const vcard = buildBranchVCard(branch)
    // replaceAll -> compatible con ES2020:
    downloadVCard(branch.name.replace(/\s+/g, '_'), vcard)
  }

  return (
    <article className="card" aria-labelledby={`branch-${branch.id}-title`}>
      <h3 id={`branch-${branch.id}-title`} style={{ marginTop: 0 }}>
        {branch.name}
      </h3>
      <p className="muted" style={{ marginTop: 0, marginBottom: 12 }}>
        {branch.address} · {branch.city}
        {branch.neighborhood ? ` · ${branch.neighborhood}` : ''}
      </p>
      <div className="grid cols-2">
        <div>
          <p>
            <strong>Teléfono:</strong>{' '}
            <a href={`tel:${branch.phone}`}>{branch.phone}</a>
          </p>
          {branch.whatsapp && (
            <p>
              <strong>WhatsApp:</strong>{' '}
              <a
                href={`https://wa.me/${branch.whatsapp}`}
                target="_blank"
                rel="noreferrer"
              >
                {branch.whatsapp}
              </a>
            </p>
          )}
          {branch.email && (
            <p>
              <strong>Email:</strong>{' '}
              <a href={`mailto:${branch.email}`}>{branch.email}</a>
            </p>
          )}
          {branch.openingHours && (
            <p>
              <strong>Horarios:</strong> {branch.openingHours}
            </p>
          )}
        </div>
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn"
              onClick={onSave}
              aria-label={`Guardar contacto de ${branch.name}`}
            >
              Guardar contacto
            </button>
            {branch.mapsUrl && (
              <a
                className="btn secondary"
                href={branch.mapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Abrir en Maps
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
