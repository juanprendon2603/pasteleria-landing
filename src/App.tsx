import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Locations from '@/components/Locations'
import SocialLinks from '@/components/SocialLinks'
import WorksPreview from '@/components/WorksPreview'
import { Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import PublicGalleryPage from './pages/PublicGalleryPage'

function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <WorksPreview /> 
        <Locations />
        <SocialLinks />
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/galeria" element={<PublicGalleryPage />} />{' '}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
