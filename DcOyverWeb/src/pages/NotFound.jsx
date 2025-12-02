import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

export default function NotFound() {
  return (
    <>
      <SEO 
        title="404 - Sayfa Bulunamadı | DcOyver.com"
        description="Aradığınız sayfa bulunamadı. Ana sayfaya dönmek için tıklayın."
        keywords="404, sayfa bulunamadı, hata, DcOyver, discord sunucu, discord server, discord oy ver, discord oy verme, discord vote, discord voting, discord oy botu, discord vote bot, discord voting bot, discord bot oy verme, oy verme discord bot, discord bot, discord bot listesi, discord bot list, discord sunucu listesi, discord server list, discord sunucu bul, discord server finder, discord sunucu arama, discord server search, discord topluluk, discord community, discord communities, discord servers, discord bots, discord türk, discord tr, discord türkiye, discord turkey, discord türkçe, discord turkish"
        url="https://dcoyver.com/404"
      />
      <div className="min-h-screen page-transition relative overflow-hidden flex items-center justify-center">
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 left-0 w-full h-full bg-black"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_70%)]"></div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto">
            {/* 404 Number */}
            <div className="mb-8">
              <h1 className="text-9xl sm:text-[12rem] md:text-[15rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 leading-none">
                404
              </h1>
            </div>

            {/* Error Message */}
            <div className="mb-8">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                Yapma ya orosbu evladı seni
              </h2>
              <p className="text-gray-400 text-lg sm:text-xl mb-2">
                Üzgünüz, aradığınız sayfa mevcut değil veya taşınmış olabilir.
              </p>
              <p className="text-gray-500 text-sm sm:text-base">
                Lütfen URL'yi kontrol edin veya ana sayfaya dönün.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                to="/"
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-500 hover:via-pink-500 hover:to-blue-500 border border-purple-500/50 rounded-xl font-black text-base sm:text-lg text-white transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/40 flex items-center gap-2 shadow-lg overflow-hidden"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <svg className="relative z-10 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="relative z-10">Ana Sayfaya Dön</span>
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="px-8 py-4 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-gray-700/50 rounded-xl font-bold text-base sm:text-lg text-white transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Geri Dön</span>
              </button>
            </div>

            {/* Additional Links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-md mx-auto">
              <Link
                to="/top100"
                className="p-4 bg-gray-900/50 hover:bg-gray-800/50 border border-gray-800/50 hover:border-purple-500/50 rounded-xl transition-all duration-300 hover:scale-105 group"
              >
                <div className="text-purple-400 group-hover:text-purple-300 mb-2">
                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <p className="text-white text-sm font-semibold">Top 100</p>
              </Link>

              <Link
                to="/yorumlar"
                className="p-4 bg-gray-900/50 hover:bg-gray-800/50 border border-gray-800/50 hover:border-purple-500/50 rounded-xl transition-all duration-300 hover:scale-105 group"
              >
                <div className="text-purple-400 group-hover:text-purple-300 mb-2">
                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-white text-sm font-semibold">Yorumlar</p>
              </Link>

              <Link
                to="/hakkımızda"
                className="p-4 bg-gray-900/50 hover:bg-gray-800/50 border border-gray-800/50 hover:border-purple-500/50 rounded-xl transition-all duration-300 hover:scale-105 group"
              >
                <div className="text-purple-400 group-hover:text-purple-300 mb-2">
                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-white text-sm font-semibold">Hakkımızda</p>
              </Link>

              <Link
                to="/iletişim"
                className="p-4 bg-gray-900/50 hover:bg-gray-800/50 border border-gray-800/50 hover:border-purple-500/50 rounded-xl transition-all duration-300 hover:scale-105 group"
              >
                <div className="text-purple-400 group-hover:text-purple-300 mb-2">
                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-white text-sm font-semibold">İletişim</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

