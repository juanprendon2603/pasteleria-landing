'use client'

import { useEffect } from 'react'

export default function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
      </div>

      <style>{`
        .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.35); display:grid; place-items:center; z-index:9999; }
        .modal { width:min(560px,92vw); background:#fff; border-radius:16px; border:1px solid #eee; box-shadow:0 20px 60px rgba(0,0,0,.2); padding:18px; }
        .modal h3 { margin:0 0 6px; font-size:1.22rem; }
        .modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:14px; }
        .grid { display:grid; gap:12px; }
        @media (min-width:768px){ .grid.cols-2 { grid-template-columns:1fr 1fr; } }
        .input-wrap { display:flex; flex-direction:column; gap:6px; }
        .input-wrap input, .input-wrap select { padding:10px 12px; border-radius:12px; border:1px solid #e5e7eb; }
      `}</style>
    </div>
  )
}
