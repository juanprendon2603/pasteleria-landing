import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Locations from '@/components/Locations'
import SocialLinks from '@/components/SocialLinks'
import './styles.css'

export default function App() {
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
