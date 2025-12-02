import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../lib/translations'
import SEO from '../components/SEO'

export default function Blog() {
  const [t, setT] = useState(() => useTranslation())

  useEffect(() => {
    const handleLanguageChange = () => {
      setT(() => useTranslation())
    }
    
    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  const isEn = localStorage.getItem('language') === 'en'

  return (
    <>
      <SEO 
        title={isEn ? 'Blog - DcOyver.com' : 'Blog - DcOyver.com'}
        description={isEn ? 'DcOyver Blog - Latest news, updates, and tips about Discord servers, voting bots, and community management.' : 'DcOyver Blog - Discord sunucuları, oy verme botları ve topluluk yönetimi hakkında son haberler, güncellemeler ve ipuçları.'}
        keywords="discord sunucu, discord server, discord oy ver, discord oy verme, discord vote, discord voting, discord oy botu, discord vote bot, discord voting bot, discord bot oy verme, oy verme discord bot, discord bot, discord bot listesi, discord bot list, discord sunucu listesi, discord server list, discord sunucu bul, discord server finder, discord sunucu arama, discord server search, discord topluluk, discord community, discord communities, discord servers, discord bots, discord türk, discord tr, discord türkiye, discord turkey, discord türkçe, discord turkish, discord oy verme botu, discord vote bot türkçe, discord bot türk, discord bot türkiye, discord bot türkçe, discord sunucu oy botu, discord server vote bot, discord oy sistemi, discord voting system, discord oy platformu, discord voting platform, discord sunucu tanıtım, discord server promotion, discord sunucu reklam, discord server advertisement, discord blog, discord haberler, discord news, discord güncellemeler, discord updates, discord ipuçları, discord tips"
        url="https://dcoyver.com/blog"
      />
    <div className="min-h-screen page-transition relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-900/30 via-pink-900/20 to-transparent"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-6xl md:text-8xl font-black mb-6">
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent animate-gradient">
              {localStorage.getItem('language') === 'en' ? 'Blog' : 'Blog'}
            </span>
          </h1>
          <div className="flex items-center justify-center gap-2 mt-4 mb-8">
            <div className="h-1 w-16 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <div className="h-1 w-16 bg-gradient-to-r from-transparent via-pink-500 to-transparent"></div>
          </div>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {localStorage.getItem('language') === 'en' 
              ? 'Latest news, updates, and tips about Discord servers and community growth'
              : 'Discord sunucuları ve topluluk büyütme hakkında son haberler, güncellemeler ve ipuçları'}
          </p>
        </div>

        {/* Coming Soon */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-[#1a1a24] to-[#0f0f1a] border border-white/10 rounded-3xl p-16 shadow-2xl hover:border-purple-500/30 transition-all duration-300 text-center">
            <div className="text-8xl mb-8">📝</div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
              {localStorage.getItem('language') === 'en' ? 'Coming Soon' : 'Yakında'}
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto mb-8">
              {localStorage.getItem('language') === 'en' 
                ? 'We\'re working on amazing blog content for you! Stay tuned for updates, tips, and guides about growing your Discord community.'
                : 'Sizin için harika blog içerikleri üzerinde çalışıyoruz! Discord topluluğunuzu büyütme hakkında güncellemeler, ipuçları ve rehberler için bizi takip edin.'}
            </p>
            <Link
              to="/"
              className="inline-block px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/50"
            >
              {localStorage.getItem('language') === 'en' ? 'Back to Home' : 'Ana Sayfaya Dön'}
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

