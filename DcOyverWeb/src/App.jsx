import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import WebProtection from './components/WebProtection'
import Home from './pages/Home'
import ServerDetail from './pages/ServerDetail'
import AuthCallback from './pages/AuthCallback'
import Top100 from './pages/Top100'
import Comments from './pages/Comments'
import Hakkimizda from './pages/Hakkimizda'
import Blog from './pages/Blog'
import YardimMerkezi from './pages/YardimMerkezi'
import Iletisim from './pages/Iletisim'
import ServisDurumu from './pages/ServisDurumu'
import Sunucularim from './pages/Sunucularim'
import ReklamYonetim from './pages/ReklamYonetim'
import YoneticiPanel from './pages/YoneticiPanel'
import BasvuruPaneli from './pages/BasvuruPaneli'
import Sunucular from './pages/Sunucular'
import Kullanicilar from './pages/Kullanicilar'
import KullaniciDetay from './pages/KullaniciDetay'
import GizlilikPolitikasi from './pages/GizlilikPolitikasi'
import HizmetKosullari from './pages/HizmetKosullari'
import NotFound from './pages/NotFound'

function App() {
  // Tema yönetimi - localStorage'dan oku
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark'
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
    }
    
    // Tema değişikliği event listener
    const handleThemeChange = () => {
      const currentTheme = localStorage.getItem('theme') || 'dark'
      if (currentTheme === 'light') {
        document.documentElement.classList.remove('dark')
        document.documentElement.classList.add('light')
      } else {
        document.documentElement.classList.remove('light')
        document.documentElement.classList.add('dark')
      }
    }
    
    window.addEventListener('themeChange', handleThemeChange)
    return () => window.removeEventListener('themeChange', handleThemeChange)
  }, [])

  return (
    <div className="min-h-screen bg-black dark:bg-black bg-gray-50 flex flex-col transition-colors duration-300">
      <WebProtection />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/kategori/:category" element={<Home />} />
          <Route path="/sunucu/:guildId" element={<ServerDetail />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/top100" element={<Top100 />} />
          <Route path="/yorumlar" element={<Comments />} />
          <Route path="/hakkımızda" element={<Hakkimizda />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/yardım-merkezi" element={<YardimMerkezi />} />
          <Route path="/iletişim" element={<Iletisim />} />
          <Route path="/servis-durumu" element={<ServisDurumu />} />
          <Route path="/sunucularım" element={<Sunucularim />} />
          <Route path="/reklam-yonetim" element={<ReklamYonetim />} />
          <Route path="/yonetici-panel" element={<YoneticiPanel />} />
          <Route path="/basvuru-paneli" element={<BasvuruPaneli />} />
          <Route path="/basvuru-panel" element={<BasvuruPaneli />} />
          <Route path="/sunucular" element={<Sunucular />} />
          <Route path="/kullanıcılar" element={<Kullanicilar />} />
          <Route path="/kullanicilar" element={<Kullanicilar />} />
          <Route path="/kullanici/:discordId" element={<KullaniciDetay />} />
          <Route path="/kullanıcı/:discordId" element={<KullaniciDetay />} />
          <Route path="/gizlilik-politikası" element={<GizlilikPolitikasi />} />
          <Route path="/gizlilik-politikasi" element={<GizlilikPolitikasi />} />
          <Route path="/hizmet-koşulları" element={<HizmetKosullari />} />
          <Route path="/hizmet-kosullari" element={<HizmetKosullari />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
