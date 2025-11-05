'use client'

import { motion } from 'framer-motion'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        background: 'linear-gradient(180deg, #fffaff 0%, #fff1f7 100%)',
        borderTop: '1px solid #eadfff',
        paddingTop: 40,
        paddingBottom: 32,
      }}
    >
      <div className="container" style={{ textAlign: 'center' }}>
        {/* Nombre o Marca */}
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          style={{
            fontWeight: 800,
            fontSize: '1.45rem',
            color: '#6a3ba6',
            marginBottom: 6,
          }}
        >
          Pastelería Nancy 🍰
        </motion.h3>

        {/* Subfrase o toque humano */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{
            color: '#a28cbf',
            fontSize: '0.95rem',
            marginBottom: 18,
            fontWeight: 500,
          }}
        >
          Hecho con amor en Miranda, Cauca 💕
        </motion.p>

        {/* Línea divisoria sutil */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          whileInView={{ width: 100, opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            height: 1,
            background: '#eadfff',
            margin: '0 auto 18px',
            borderRadius: 2,
          }}
        />

        {/* Derechos reservados */}
        <p
          style={{
            color: '#857b9a',
            fontSize: '0.9rem',
            margin: 0,
            letterSpacing: 0.2,
          }}
        >
          © {year} Pastelería Nancy · Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
