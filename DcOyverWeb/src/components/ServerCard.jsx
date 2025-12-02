import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTranslation } from '../lib/translations'

export default function ServerCard({ server, isPremium = false }) {
  const [t, setT] = useState(() => useTranslation())

  useEffect(() => {
    const handleLanguageChange = () => {
      setT(() => useTranslation())
    }
    
    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

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
