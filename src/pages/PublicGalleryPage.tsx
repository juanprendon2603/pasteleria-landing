'use client'

import Footer from '@/components/Footer'
import GallerySection from '@/components/GallerySection'
import Header from '@/components/Header'
import { useEffect } from 'react'

export default function PublicGalleryPage() {
  useEffect(() => {
    document.title = 'Galería'
  }, [])

  return (
    <>
      <Header />
      <main>
        <GallerySection id="galeria" title="Galería" pageSize={24} />
      </main>
      <Footer />
    </>
  )
}
