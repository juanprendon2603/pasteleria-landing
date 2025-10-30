import Section from '@/components/Section'

export default function Hero() {
  return (
    <Section center variant="brand" id="inicio">
      <div className="split">
        {/* Texto (centrado) */}
        <div data-reveal style={{ textAlign: 'center' }}>
          <h1 className="h1">La excelencia en pastelería</h1>

          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <a className="btn" href="#sedes">
              Ver sedes
            </a>
            <a className="btn secondary" href="#redes">
              Síguenos
            </a>
          </div>
        </div>

        {/* Imagen (derecha) */}
        <div data-reveal style={{ justifySelf: 'end' }}>
          {/* Guarda la imagen como /public/hero-cake.png */}
          <img
            src="/hero-cake.png"
            alt="Torta de cumpleaños con mariposas doradas"
            className="hero-img"
          />
        </div>
      </div>
    </Section>
  )
}
