import { useEffect, useRef } from 'react'

type Props = {
  id?: string
  variant?: 'default' | 'alt' | 'brand' | 'surface' // 👈 agrega 'surface'
  center?: boolean
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties // ✅ para poder usar style inline
}

export default function Section({
  id,
  variant = 'default',
  center,
  children,
  className,
  style,
}: Props) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const items = el.querySelectorAll<HTMLElement>('[data-reveal]')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('reveal-in')
        })
      },
      { threshold: 0.15 },
    )
    items.forEach((i) => io.observe(i))
    return () => io.disconnect()
  }, [])

  return (
    <section
      id={id}
      ref={ref}
      className={`section ${variant} ${center ? 'center' : ''} ${
        className ?? ''
      }`}
      aria-labelledby={id ? `${id}-title` : undefined}
      style={style} // ✅ esto soluciona el error
    >
      <div className="container">{children}</div>

      {/* decor separador ondulado */}
      <div className="divider" aria-hidden="true" />
    </section>
  )
}
