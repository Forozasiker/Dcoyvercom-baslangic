import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../lib/translations'
import SEO from '../components/SEO'

export default function Hakkimizda() {
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
        title={isEn ? 'About Us - DcOyver.com' : 'Hakkımızda - DcOyver.com'}
        description={isEn ? 'Learn about DcOyver - A modern Discord voting bot and server listing platform. Discover Discord servers, vote for your favorites, and join communities.' : 'DcOyver hakkında bilgi edinin - Modern bir Discord oy verme botu ve sunucu listeleme platformu. Discord sunucularını keşfedin, favorilerinize oy verin ve topluluklara katılın.'}
        keywords="discord sunucu, discord server, discord oy ver, discord oy verme, discord vote, discord voting, discord oy botu, discord vote bot, discord voting bot, discord bot oy verme, oy verme discord bot, discord bot, discord bot listesi, discord bot list, discord sunucu listesi, discord server list, discord sunucu bul, discord server finder, discord sunucu arama, discord server search, discord topluluk, discord community, discord communities, discord servers, discord bots, discord türk, discord tr, discord türkiye, discord turkey, discord türkçe, discord turkish, discord oy verme botu, discord vote bot türkçe, discord bot türk, discord bot türkiye, discord bot türkçe, discord sunucu oy botu, discord server vote bot, discord oy sistemi, discord voting system, discord oy platformu, discord voting platform, discord sunucu tanıtım, discord server promotion, discord sunucu reklam, discord server advertisement, hakkımızda, about us, discord bot hakkında, discord bot about"
        url="https://dcoyver.com/hakkımızda"
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
              {localStorage.getItem('language') === 'en' ? 'About Us' : 'Hakkımızda'}
            </span>
          </h1>
          <div className="flex items-center justify-center gap-2 mt-4 mb-8">
            <div className="h-1 w-16 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <div className="h-1 w-16 bg-gradient-to-r from-transparent via-pink-500 to-transparent"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Mission Section */}
          <div className="mb-16">
            <div className="bg-gradient-to-br from-[#1a1a24] to-[#0f0f1a] border border-white/10 rounded-3xl p-10 shadow-2xl hover:border-purple-500/30 transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {localStorage.getItem('language') === 'en' ? 'Our Mission' : 'Misyonumuz'}
                </h2>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">
                {localStorage.getItem('language') === 'en' 
                  ? 'DcOyver is designed to help Discord server owners grow their communities through an advanced voting system. We provide a platform where server owners can list their servers, collect votes, and track detailed statistics. Our mission is to create the best Discord server listing and voting platform in Turkey.'
                  : 'DcOyver, Discord sunucu sahiplerinin topluluklarını gelişmiş bir oy verme sistemi ile büyütmelerine yardımcı olmak için tasarlanmıştır. Sunucu sahiplerinin sunucularını listeleyebileceği, oy toplayabileceği ve detaylı istatistikleri takip edebileceği bir platform sunuyoruz. Misyonumuz, Türkiye\'nin en iyi Discord sunucu listeleme ve oy verme platformunu oluşturmaktır.'}
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/50">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {localStorage.getItem('language') === 'en' ? 'Fast & Reliable' : 'Hızlı & Güvenilir'}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {localStorage.getItem('language') === 'en' 
                  ? 'Lightning-fast voting system with real-time updates and 99.9% uptime guarantee.'
                  : 'Gerçek zamanlı güncellemeler ve %99.9 çalışma süresi garantisi ile yıldırım hızında oy verme sistemi.'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-8 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/50">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {localStorage.getItem('language') === 'en' ? 'Detailed Statistics' : 'Detaylı İstatistikler'}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {localStorage.getItem('language') === 'en' 
                  ? 'Track votes, members, online users, voice channels, camera and stream statistics in real-time.'
                  : 'Oy, üye, online kullanıcı, ses kanalları, kamera ve yayın istatistiklerini gerçek zamanlı olarak takip edin.'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-500/30 rounded-2xl p-8 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/50">
              <div className="text-5xl mb-4">🎨</div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {localStorage.getItem('language') === 'en' ? 'Modern Design' : 'Modern Tasarım'}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {localStorage.getItem('language') === 'en' 
                  ? 'Beautiful, premium interface with Discord Components V2 and smooth animations.'
                  : 'Discord Components V2 ve akıcı animasyonlarla güzel, premium arayüz.'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-8 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/50">
              <div className="text-5xl mb-4">🔔</div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {localStorage.getItem('language') === 'en' ? 'Smart Notifications' : 'Akıllı Bildirimler'}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {localStorage.getItem('language') === 'en' 
                  ? 'Get notified via DM when your 12-hour cooldown expires. Never miss a vote!'
                  : '12 saatlik bekleme süreniz dolduğunda DM yoluyla bildirim alın. Hiçbir oyu kaçırmayın!'}
              </p>
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="bg-gradient-to-br from-[#1a1a24] to-[#0f0f1a] border border-white/10 rounded-3xl p-10 shadow-2xl hover:border-purple-500/30 transition-all duration-300 mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-8 text-center">
              {localStorage.getItem('language') === 'en' ? 'Why Choose DcOyver?' : 'Neden DcOyver?'}
            </h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {localStorage.getItem('language') === 'en' ? 'Easy Setup' : 'Kolay Kurulum'}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {localStorage.getItem('language') === 'en' 
                      ? 'Get started in minutes with our simple setup process. Just use /setup command and you\'re ready!'
                      : 'Basit kurulum sürecimizle dakikalar içinde başlayın. Sadece /setup komutunu kullanın ve hazırsınız!'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🔄</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {localStorage.getItem('language') === 'en' ? 'Real-Time Updates' : 'Gerçek Zamanlı Güncellemeler'}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {localStorage.getItem('language') === 'en' 
                      ? 'Vote panels update automatically every second. See your votes and rankings instantly!'
                      : 'Oy panelleri her saniye otomatik olarak güncellenir. Oylarınızı ve sıralamanızı anında görün!'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💬</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {localStorage.getItem('language') === 'en' ? 'Comment System' : 'Yorum Sistemi'}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {localStorage.getItem('language') === 'en' 
                      ? 'Let users rate and comment on your server. Build trust and attract more members!'
                      : 'Kullanıcıların sunucunuzu puanlamasına ve yorum yapmasına izin verin. Güven oluşturun ve daha fazla üye çekin!'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🏆</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {localStorage.getItem('language') === 'en' ? 'Top 100 Rankings' : 'Top 100 Sıralaması'}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {localStorage.getItem('language') === 'en' 
                      ? 'Compete for the top spots! Get featured on our Top 100 page and gain more visibility.'
                      : 'En üst sıralar için yarışın! Top 100 sayfamızda yer alın ve daha fazla görünürlük kazanın.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-red-500/20 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                {localStorage.getItem('language') === 'en' ? 'Ready to Get Started?' : 'Başlamaya Hazır mısınız?'}
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                {localStorage.getItem('language') === 'en' 
                  ? 'Join thousands of Discord servers already using DcOyver to grow their communities!'
                  : 'Topluluklarını büyütmek için DcOyver kullanan binlerce Discord sunucusuna katılın!'}
              </p>
              <Link
                to="/"
                className="inline-block px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/50"
              >
                {localStorage.getItem('language') === 'en' ? 'Explore Servers' : 'Sunucuları Keşfet'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

