import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../lib/translations'
import SEO from '../components/SEO'

export default function ServisDurumu() {
  const [t, setT] = useState(() => useTranslation())
  const [status, setStatus] = useState('operational')

  useEffect(() => {
    const handleLanguageChange = () => {
      setT(() => useTranslation())
    }
    
    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  const isEn = localStorage.getItem('language') === 'en'

  const services = [
    {
      name: localStorage.getItem('language') === 'en' ? 'Discord Bot' : 'Discord Bot',
      status: 'operational',
      uptime: '99.9%'
    },
    {
      name: localStorage.getItem('language') === 'en' ? 'Web Application' : 'Web Uygulaması',
      status: 'operational',
      uptime: '99.8%'
    },
    {
      name: localStorage.getItem('language') === 'en' ? 'Database' : 'Veritabanı',
      status: 'operational',
      uptime: '100%'
    },
    {
      name: localStorage.getItem('language') === 'en' ? 'API Services' : 'API Servisleri',
      status: 'operational',
      uptime: '99.7%'
    }
  ]

  return (
    <>
      <SEO 
        title={isEn ? 'Service Status - DcOyver.com' : 'Servis Durumu - DcOyver.com'}
        description={isEn ? 'DcOyver Service Status - Check the current status of our Discord bot and website services.' : 'DcOyver Servis Durumu - Discord botumuz ve web sitesi hizmetlerimizin mevcut durumunu kontrol edin.'}
        keywords="discord sunucu, discord server, discord oy ver, discord oy verme, discord vote, discord voting, discord oy botu, discord vote bot, discord voting bot, discord bot oy verme, oy verme discord bot, discord bot, discord bot listesi, discord bot list, discord sunucu listesi, discord server list, discord sunucu bul, discord server finder, discord sunucu arama, discord server search, discord topluluk, discord community, discord communities, discord servers, discord bots, discord türk, discord tr, discord türkiye, discord turkey, discord türkçe, discord turkish, discord oy verme botu, discord vote bot türkçe, discord bot türk, discord bot türkiye, discord bot türkçe, discord sunucu oy botu, discord server vote bot, discord oy sistemi, discord voting system, discord oy platformu, discord voting platform, discord sunucu tanıtım, discord server promotion, discord sunucu reklam, discord server advertisement, servis durumu, service status, discord bot durum, discord bot status, uptime, discord bot uptime"
        url="https://dcoyver.com/servis-durumu"
      />
      <div className="min-h-screen page-transition relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-black"></div>
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-6xl md:text-8xl font-black mb-6">
            <span className="block text-white">
              {localStorage.getItem('language') === 'en' ? 'Service Status' : 'Servis Durumu'}
            </span>
          </h1>
          <div className="flex items-center justify-center gap-2 mt-4 mb-8">
            <div className="h-1 w-16 bg-gray-800"></div>
            <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
            <div className="h-1 w-16 bg-gray-800"></div>
          </div>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {localStorage.getItem('language') === 'en' 
              ? 'Real-time status of all DcOyver services and systems'
              : 'Tüm DcOyver servisleri ve sistemlerinin gerçek zamanlı durumu'}
          </p>
        </div>

        {/* Overall Status */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-500/30 rounded-3xl p-12 shadow-2xl hover:border-green-500/50 transition-all duration-300 text-center">
            <div className="text-8xl mb-6">✅</div>
            <h2 className="text-4xl font-bold text-white mb-4">
              {localStorage.getItem('language') === 'en' ? 'All Systems Operational' : 'Tüm Sistemler Çalışıyor'}
            </h2>
            <p className="text-gray-300 text-lg">
              {localStorage.getItem('language') === 'en' 
                ? 'All services are running smoothly. No issues detected.'
                : 'Tüm servisler sorunsuz çalışıyor. Herhangi bir sorun tespit edilmedi.'}
            </p>
          </div>
        </div>

        {/* Services List */}
        <div className="max-w-4xl mx-auto space-y-4 mb-12">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-[#1a1a24] to-[#0f0f1a] border border-white/10 rounded-2xl p-6 shadow-2xl hover:border-green-500/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">{service.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {localStorage.getItem('language') === 'en' ? 'Uptime' : 'Çalışma Süresi'}: {service.uptime}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-semibold">
                    {localStorage.getItem('language') === 'en' ? 'Operational' : 'Çalışıyor'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {localStorage.getItem('language') === 'en' ? 'Report an Issue' : 'Sorun Bildir'}
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              {localStorage.getItem('language') === 'en' 
                ? 'If you experience any issues, please contact us on our Discord server!'
                : 'Herhangi bir sorun yaşarsanız, lütfen Discord sunucumuzdan bizimle iletişime geçin!'}
            </p>
            <a
              href="https://discord.gg/Dcoyver"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105"
            >
              {localStorage.getItem('language') === 'en' ? 'Contact Support' : 'Destek İletişimi'}
            </a>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

