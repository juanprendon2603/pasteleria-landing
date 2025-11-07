import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Locations from '@/components/Locations'
import SocialLinks from '@/components/SocialLinks'
import { Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'

// Home “pública”
function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
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
      <Route path="/dashboard" element={<Dashboard />} />
      {/* opcional: redirect desconocidos a home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
