// src/components/Header.tsx
export default function Header() {
  return (
    <header className="header">
      <nav className="container nav">
        <div className="brand">
          {/* Logo */}
          <img
            src="/logo.png" // ← pon aquí tu logo (por ejemplo /public/logo2.png)
            alt="Logo Pastelería Nancy"
            className="brand-logo"
          />
          <span className="brand-text">Pastelería Nancy</span>
        </div>

        <div className="actions">
          <a className="btn secondary" href="#sedes">
            Sedes
          </a>
          <a className="btn" href="#contacto">
            Contactar
          </a>
        </div>
      </nav>
    </header>
  )
}
