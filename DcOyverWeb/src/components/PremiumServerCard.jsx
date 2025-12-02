import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function PremiumServerCard({ server, advertisement }) {
  const [timeRemaining, setTimeRemaining] = useState('')

  useEffect(() => {
    if (!advertisement || !advertisement.endDate) return

    const updateTimeRemaining = () => {
      const now = new Date()
      const endDate = new Date(advertisement.endDate)
      const diff = endDate - now

      if (diff <= 0) {
        setTimeRemaining(localStorage.getItem('language') === 'en' ? 'Expired' : 'Süresi Doldu')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeRemaining(`${days} ${localStorage.getItem('language') === 'en' ? 'day' : 'gün'} ${hours} ${localStorage.getItem('language') === 'en' ? 'hour' : 'saat'}`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours} ${localStorage.getItem('language') === 'en' ? 'hour' : 'saat'} ${minutes} ${localStorage.getItem('language') === 'en' ? 'min' : 'dakika'}`)
      } else {
        setTimeRemaining(`${minutes} ${localStorage.getItem('language') === 'en' ? 'min' : 'dakika'}`)
      }
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 60000) // Her dakika güncelle

    return () => clearInterval(interval)
  }, [advertisement])

  const getCategoryName = (category) => {
    const names = {
      tr: { public: 'Genel', private: 'Özel', game: 'Oyun' },
      en: { public: 'Public', private: 'Private', game: 'Game' }
    }
    const lang = localStorage.getItem('language') || 'tr'
    return names[lang][category] || names.tr[category]
  }

  // Banner URL'ini optimize et - yüksek kalite için size=1024 veya 2048
  const getOptimizedBannerURL = (bannerURL) => {
    if (!bannerURL) return '/banner.png'
    
    // Discord CDN URL'leri için size parametresini optimize et
    if (bannerURL.includes('cdn.discordapp.com')) {
      if (bannerURL.includes('?size=')) {
        return bannerURL.replace(/\?size=\d+/, '?size=2048')
      }
      return bannerURL + '?size=2048'
    }
    
    return bannerURL
  }

  // Sayı formatlama: 10000'den büyükse k ekle
  const formatNumber = (num) => {
    const number = num || 0
    if (number >= 10000) {
      return (number / 1000).toFixed(0) + 'k'
    }
    return number.toLocaleString('tr-TR')
  }

  return (
    <div className="group relative backdrop-blur-sm border bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 rounded-2xl overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg">
      {/* Banner Section */}
      <div className="relative h-32 overflow-hidden">
        <img 
          src={getOptimizedBannerURL(server.bannerURL)} 
          alt={server.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            if (e.target.src !== '/banner.png') {
              e.target.src = '/banner.png'
            }
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent"></div>
        
        {/* Premium Badge - Top Right - Sadece sponsor olan sunucularda göster */}
        {advertisement && (
          <div className="absolute top-3 right-3">
            <div className="bg-white backdrop-blur-md text-gray-900 text-xs font-bold px-3.5 py-2 rounded-full shadow-2xl border border-gray-300/60 flex items-center gap-2 hover:shadow-blue-500/20 hover:border-blue-400/40 transition-all duration-300">
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="tracking-wider font-extrabold">SPONSOR</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6 relative">
        {/* Server Icon */}
        <div className="relative -mt-12 mb-4">
          <div className="w-20 h-20 mx-auto relative">
            <img 
              src={server.iconURL || 'https://cdn.discordapp.com/embed/avatars/2.png'} 
              alt={server.name}
              className="w-full h-full rounded-full object-cover border-4 border-white/20 shadow-lg"
              onError={(e) => {
                e.target.src = 'https://cdn.discordapp.com/embed/avatars/2.png'
              }}
            />
            
            {/* Verified Badge - Twitter Style */}
            <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-lg border border-gray-900/60">
              <div className="bg-[#1DA1F2] rounded-full p-1 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Server Name */}
        <h3 className="text-center mb-2 text-xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300">
          <Link to={`/sunucu/${server.guildId}`} className="hover:underline">
            {server.name}
          </Link>
        </h3>

        {/* Server Owner */}
        {server.ownerInfo && (server.ownerInfo.globalName || server.ownerInfo.username) && (
          <div className="text-center mb-3">
            <div className="text-xs text-gray-400 mb-1.5">{localStorage.getItem('language') === 'en' ? 'Server Owner' : 'Sunucu Sahibi'}</div>
            <div className="flex items-center justify-center gap-2">
              {server.ownerInfo.avatarURL ? (
                <img
                  src={server.ownerInfo.avatarURL}
                  alt={server.ownerInfo.globalName || server.ownerInfo.username || 'Owner'}
                  className="w-6 h-6 rounded-full border border-gray-600"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border border-gray-600">
                  <span className="text-white font-bold text-xs">
                    {(server.ownerInfo.globalName || server.ownerInfo.username || 'O').charAt(0)}
                  </span>
                </div>
              )}
              <div className="text-sm font-semibold text-gray-300">
                {server.ownerInfo.globalName || server.ownerInfo.username || 'Unknown'}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">
              {formatNumber(server.memberCount)}
            </div>
            <div className="text-xs text-gray-400">{localStorage.getItem('language') === 'en' ? 'Members' : 'Üye'}</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">
              {formatNumber(server.onlineCount)}
            </div>
            <div className="text-xs text-gray-400">{localStorage.getItem('language') === 'en' ? 'Online' : 'Çevrimiçi'}</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">
              {formatNumber(server.voiceCount)}
            </div>
            <div className="text-xs text-gray-400">{localStorage.getItem('language') === 'en' ? 'Voice' : 'Seste'}</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-400">
              {formatNumber(server.totalVotes)}
            </div>
            <div className="text-xs text-gray-400">{localStorage.getItem('language') === 'en' ? 'Votes' : 'Oy'}</div>
          </div>
        </div>

        {/* Join Button */}
        <div className="space-y-3">
          {server.inviteURL ? (
            <a 
              href={server.inviteURL} 
              target="_blank"
              rel="noopener noreferrer"
              className="w-full group/btn relative overflow-hidden flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-base transition-all duration-300 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 text-white transform hover:scale-105 hover:shadow-2xl shadow-lg"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
              
              <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="relative z-10">{localStorage.getItem('language') === 'en' ? 'Join Server' : 'Sunucuya Katıl'}</span>
            </a>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-base bg-gray-600/50 text-gray-400 cursor-not-allowed">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>{localStorage.getItem('language') === 'en' ? 'No Invite Link' : 'Davet Linki Yok'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Glow effect on hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-300 -z-10"></div>
    </div>
  )
}

