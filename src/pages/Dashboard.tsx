'use client'

import GalleryAdmin from '@/components/GalleryAdmin'
import GallerySection from '@/components/GallerySection'
import { useEffect, useState } from 'react'

type SectionKey = 'upload' | 'gallery' | 'settings'

// ⚠️ Cambia este PIN a algo tuyo:
const DASHBOARD_PIN = '1987'
const STORAGE_KEY = 'dash_auth_ok'

export default function Dashboard() {
  const [authorized, setAuthorized] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY) === '1'
  })
  const [pin, setPin] = useState('')
  const [section, setSection] = useState<SectionKey>('upload')

  useEffect(() => {
    document.title = 'Dashboard'
  }, [])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === DASHBOARD_PIN) {
      localStorage.setItem(STORAGE_KEY, '1')
      setAuthorized(true)
    } else {
      alert('PIN incorrecto')
    }
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAuthorized(false)
    setPin('')
  }

  if (!authorized) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 420 }}>
          <h2 className="h2">Acceso</h2>
          <p className="lead">Ingresa el PIN para continuar</p>
          <form onSubmit={onSubmit} className="admin-card">
            <input
              type="password"
              placeholder="PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 8,
                border: '1px solid #ddd',
              }}
            />
            <button className="btn" style={{ marginTop: 12 }} type="submit">
              Entrar
            </button>
          </form>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="container">
        <div className="dash-layout">
          {/* Sidebar */}
          <aside className="dash-sidebar" aria-label="Menú del dashboard">
            <div className="dash-brand">
              <strong>Dashboard</strong>
              <small className="muted">oculto</small>
            </div>

            <nav className="dash-nav">
              <button
                className={`dash-link ${section === 'upload' ? 'active' : ''}`}
                onClick={() => setSection('upload')}
              >
                📤 Subir imágenes
              </button>
              <button
                className={`dash-link ${section === 'gallery' ? 'active' : ''}`}
                onClick={() => setSection('gallery')}
              >
                🖼️ Galería
              </button>
              <button
                className={`dash-link ${section === 'settings' ? 'active' : ''}`}
                onClick={() => setSection('settings')}
              >
                ⚙️ Ajustes
              </button>
            </nav>

            <div className="dash-footer">
              <button className="btn btn-ghost" onClick={logout}>
                Salir
              </button>
            </div>
          </aside>

          {/* Contenido */}
          <main className="dash-content">
            {section === 'upload' && (
              <>
                <h2 className="h2">Subida de imágenes</h2>
                <p className="lead">
                  Usa el cargador para subir con datos o la sección de carga
                  masiva (sin metadatos).
                </p>
                <GalleryAdmin />
              </>
            )}

            {section === 'gallery' && (
              <>
                <h2 className="h2">Galería</h2>
                <p className="lead">
                  Explora lo que ya subiste, con filtros y búsqueda.
                </p>
                <GallerySection />
              </>
            )}

            {section === 'settings' && (
              <>
                <h2 className="h2">Ajustes</h2>
                <div className="admin-card">
                  <p className="muted">
                    Aquí puedes agregar opciones como cambiar el PIN, revisar
                    variables de entorno, o mostrar info de tu cuenta de
                    Cloudinary / Firestore.
                  </p>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Estilos locales del dashboard */}
      <style>{`
        .dash-layout {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 16px;
          min-height: 70vh;
        }
        @media (max-width: 960px) {
          .dash-layout {
            grid-template-columns: 1fr;
          }
          .dash-sidebar {
            position: sticky;
            top: 10px;
            z-index: 2;
          }
        }
        .dash-sidebar {
          background: #fff;
          border: 1px solid #eee;
          border-radius: 14px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          height: fit-content;
        }
        .dash-brand {
          display: flex;
          align-items: baseline;
          gap: 6px;
          font-size: 18px;
        }
        .muted { color: #6b7280; font-size: 12px; }
        .dash-nav {
          display: grid;
          gap: 6px;
          margin-top: 8px;
        }
        .dash-link {
          text-align: left;
          border: 1px solid #eee;
          background: #fafafa;
          border-radius: 10px;
          padding: 10px 12px;
          cursor: pointer;
          transition: background .15s ease, border-color .15s ease, transform .05s ease;
        }
        .dash-link:hover { background: #f6f6f6; border-color: #e7e7e7; }
        .dash-link.active {
          background: #f0f2ff;
          border-color: #dfe3ff;
        }
        .dash-footer {
          margin-top: auto;
          display: flex;
          justify-content: flex-start;
        }
        .btn-ghost {
          background: transparent;
          border: 1px solid #eee;
          color: #374151;
        }
        .dash-content {
          display: grid;
          gap: 16px;
        }
        .admin-card {
          background: #fff;
          padding: 1.5rem;
          border-radius: 16px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
          border: 1px solid #eee;
        }
      `}</style>
    </section>
  )
}
