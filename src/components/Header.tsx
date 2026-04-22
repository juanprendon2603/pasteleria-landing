'use client'

import { useEffect } from 'react'

export default function Header() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('.header')
    const onScroll = () => {
      if (!header) return
      header.classList.toggle('scrolled', window.scrollY > 40)
    }
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // LINK WHATSAPP
  const whatsappLink =
    'https://wa.me/573155287225?text=' +
    encodeURIComponent('¡Hola! Quiero hacer un pedido 😊')

  return (
    <header className="header">
      <nav className="container nav">
        <div className="brand">
          <img
            src="/logo.png"
            alt="Logo Pastelería Nancy"
            className="brand-logo"
          />
          <span className="brand-text">Pastelería Nancy</span>
        </div>

        <div className="actions">
          <a className="btn secondary" href="/galeria">
            Galeria
          </a>
          <a className="btn secondary" href="#sedes">
            Sede
          </a>

          {/* BOTÓN WHATSAPP */}
          <a
            className="btn"
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            Contactar
          </a>
        </div>
      </nav>
    </header>
  )
}
