'use client'

import { useEffect } from 'react'

export default function Header() {
  useEffect(() => {
    // Añade/quita la clase "scrolled" al hacer scroll (opcional)
    const header = document.querySelector<HTMLElement>('.header')
    const onScroll = () => {
      if (!header) return
      header.classList.toggle('scrolled', window.scrollY > 40)
    }
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
