import { useEffect, useRef } from 'react'

type Props = {
  id?: string
  variant?: 'default' | 'alt' | 'brand'
  center?: boolean
  children: React.ReactNode
}

export default function Section({
  id,
  variant = 'default',
  center,
  children,
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
      className={`section ${variant} ${center ? 'center' : ''}`}
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <div className="container">{children}</div>
      {/* decor separador ondulado */}
      <div className="divider" aria-hidden="true" />
    </section>
  )
}
