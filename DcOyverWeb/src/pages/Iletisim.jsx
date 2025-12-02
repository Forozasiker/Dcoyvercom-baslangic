import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../lib/translations'
import SEO from '../components/SEO'

export default function Iletisim() {
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
        title={isEn ? 'Contact Us - DcOyver.com' : 'İletişim - DcOyver.com'}
        description={isEn ? 'Contact DcOyver - Get in touch with us for support, questions, or feedback about our Discord bot and server listing platform.' : 'DcOyver ile iletişime geçin - Discord botumuz ve sunucu listeleme platformumuz hakkında destek, sorular veya geri bildirim için bizimle iletişime geçin.'}
        keywords="discord sunucu, discord server, discord oy ver, discord oy verme, discord vote, discord voting, discord oy botu, discord vote bot, discord voting bot, discord bot oy verme, oy verme discord bot, discord bot, discord bot listesi, discord bot list, discord sunucu listesi, discord server list, discord sunucu bul, discord server finder, discord sunucu arama, discord server search, discord topluluk, discord community, discord communities, discord servers, discord bots, discord türk, discord tr, discord türkiye, discord turkey, discord türkçe, discord turkish, discord oy verme botu, discord vote bot türkçe, discord bot türk, discord bot türkiye, discord bot türkçe, discord sunucu oy botu, discord server vote bot, discord oy sistemi, discord voting system, discord oy platformu, discord voting platform, discord sunucu tanıtım, discord server promotion, discord sunucu reklam, discord server advertisement, iletişim, contact, discord bot iletişim, discord bot contact"
        url="https://dcoyver.com/iletişim"
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
              {localStorage.getItem('language') === 'en' ? 'Contact' : 'İletişim'}
            </span>
          </h1>
          <div className="flex items-center justify-center gap-2 mt-4 mb-8">
            <div className="h-1 w-16 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <div className="h-1 w-16 bg-gradient-to-r from-transparent via-pink-500 to-transparent"></div>
          </div>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {localStorage.getItem('language') === 'en' 
              ? 'Get in touch with us! Join our Discord server for support, suggestions, and community discussions.'
              : 'Bizimle iletişime geçin! Destek, öneriler ve topluluk tartışmaları için Discord sunucumuza katılın.'}
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Discord Server Card */}
          <div className="bg-gradient-to-br from-[#1a1a24] to-[#0f0f1a] border border-white/10 rounded-3xl p-12 shadow-2xl hover:border-purple-500/30 transition-all duration-300 mb-12">
            <div className="text-center">
              <div className="inline-block mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl blur-2xl opacity-50"></div>
                  <div className="relative w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center">
                    <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </div>
                </div>
              </div>
              
              <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
                {localStorage.getItem('language') === 'en' ? 'Join Our Discord Server' : 'Discord Sunucumuza Katılın'}
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                {localStorage.getItem('language') === 'en' 
                  ? 'Get instant support, share your feedback, report bugs, or just hang out with our amazing community! Our Discord server is the best place to connect with us and other server owners.'
                  : 'Anında destek alın, geri bildirimlerinizi paylaşın, hata bildirin veya harika topluluğumuzla vakit geçirin! Discord sunucumuz bizimle ve diğer sunucu sahipleriyle bağlantı kurmanın en iyi yeridir.'}
              </p>
              
              <a
                href="https://discord.gg/Dcoyver"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-105 shadow-2xl shadow-indigo-500/50 text-lg"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                {localStorage.getItem('language') === 'en' ? 'Join Discord.gg/Dcoyver' : 'Discord.gg/Dcoyver\'a Katıl'}
              </a>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 hover:scale-105 transition-all duration-300">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {localStorage.getItem('language') === 'en' ? 'Community Support' : 'Topluluk Desteği'}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {localStorage.getItem('language') === 'en' 
                  ? 'Get help from experienced server owners and our friendly community members.'
                  : 'Deneyimli sunucu sahiplerinden ve dost canlısı topluluk üyelerimizden yardım alın.'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-8 hover:scale-105 transition-all duration-300">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {localStorage.getItem('language') === 'en' ? 'Feature Requests' : 'Özellik İstekleri'}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {localStorage.getItem('language') === 'en' 
                  ? 'Share your ideas and suggestions to help us improve DcOyver!'
                  : 'Fikirlerinizi ve önerilerinizi paylaşın, DcOyver\'ı geliştirmemize yardımcı olun!'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

