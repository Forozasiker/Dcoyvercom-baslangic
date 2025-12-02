import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { io } from 'socket.io-client'

export default function UserCard({ user }) {
  const [imageError, setImageError] = useState(false)
  const [bannerUrl, setBannerUrl] = useState(user.bannerUrl)
  
  // Socket.io ile banner güncellemelerini dinle
  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    })
    
    socket.on('userBannerUpdate', (data) => {
      // Bu kullanıcının banner'ı güncellendiyse state'i güncelle
      if (data.userId === user.discordId) {
        setBannerUrl(data.bannerUrl)
        setImageError(false) // Banner güncellendiğinde hata durumunu sıfırla
      }
    })
    
    return () => {
      socket.disconnect()
    }
  }, [user.discordId])

  // Status badge renkleri - Premium dark theme
  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-green-500 shadow-green-500/50'
      case 'idle':
        return 'bg-yellow-500 shadow-yellow-500/50'
      case 'dnd':
        return 'bg-red-500 shadow-red-500/50'
      default:
        return 'bg-gray-600 shadow-gray-600/50'
    }
  }

  // Status badge metni
  const getStatusText = (status) => {
    const lang = localStorage.getItem('language') === 'en'
    switch (status) {
      case 'online':
        return lang ? 'Online' : 'Çevrimiçi'
      case 'idle':
        return lang ? 'Idle' : 'Boşta'
      case 'dnd':
        return lang ? 'Do Not Disturb' : 'Rahatsız Etme'
      default:
        return lang ? 'Offline' : 'Çevrimdışı'
    }
  }

  // Sayı formatlama
  const formatNumber = (num) => {
    const number = num || 0
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + 'M'
    }
    if (number >= 1000) {
      return (number / 1000).toFixed(1) + 'k'
    }
    return number.toLocaleString('tr-TR')
  }

  // Display name
  const displayName = user.globalName || user.username || 'Unknown'
  const username = user.username || 'unknown'
  const avatarUrl = user.avatarUrl || `https://cdn.discordapp.com/embed/avatars/${(user.discordId || '0').charAt(user.discordId?.length - 1) || 0}.png`
  
  // Banner URL - Eğer banner yoksa /banner.png kullan
  const getBannerUrl = () => {
    // Önce state'teki bannerUrl'i kontrol et, yoksa user.bannerUrl'i kullan
    const currentBannerUrl = bannerUrl || user.bannerUrl
    
    // Banner URL kontrolü - null, undefined, boş string kontrolü
    if (currentBannerUrl && currentBannerUrl !== 'null' && currentBannerUrl !== 'undefined' && currentBannerUrl.trim() !== '' && !imageError) {
      if (currentBannerUrl.includes('?size=')) {
        return currentBannerUrl.replace(/\?size=\d+/, '?size=2048')
      }
      return currentBannerUrl + '?size=2048'
    }
    // Banner yoksa veya null ise default banner.png
    return '/banner.png'
  }
  
  const displayBannerUrl = getBannerUrl()

  return (
    <div className="group relative backdrop-blur-xl border-2 bg-gradient-to-br from-gray-950 via-black to-gray-950 border-gray-900 hover:border-gray-800 hover:from-gray-900 hover:via-black hover:to-gray-900 rounded-2xl overflow-hidden transition-all duration-500 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 shadow-xl">
      {/* Premium Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-indigo-600/20 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10"></div>
      
      {/* Banner Section - Premium */}
      <div className="relative h-24 overflow-hidden">
        <img 
          src={displayBannerUrl} 
          alt={displayName}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          decoding="async"
          onError={() => setImageError(true)}
        />
        
        {/* Premium Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
        
        {/* Shimmer Effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      </div>

      {/* Content Section */}
      <div className="p-4 relative">
        {/* User Avatar - Premium */}
        <div className="relative -mt-10 mb-3 flex justify-center">
          <div className="relative">
            {/* Avatar Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-indigo-500/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative w-16 h-16">
              <img 
                src={avatarUrl} 
                alt={displayName}
                className="w-full h-full rounded-full object-cover border-4 border-black shadow-2xl group-hover:border-purple-500/50 transition-all duration-500"
                onError={(e) => {
                  e.target.src = `https://cdn.discordapp.com/embed/avatars/${(user.discordId || '0').charAt(user.discordId?.length - 1) || 0}.png`
                }}
              />
              
              {/* Status Badge - Premium */}
              {user.status && (
                <div className={`absolute bottom-0 right-0 w-5 h-5 ${getStatusColor(user.status)} rounded-full border-2 border-black shadow-lg animate-pulse`}></div>
              )}
              
              {/* Nitro Badge - Premium */}
              {user.hasNitro && (
                <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl border-2 border-black">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Name - Premium - Tıklanabilir */}
        <Link to={`/kullanici/${user.discordId}`} className="block">
          <h3 className="text-center mb-1 text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-white group-hover:from-purple-400 group-hover:via-pink-400 group-hover:to-indigo-400 transition-all duration-500 cursor-pointer hover:scale-105">
            {displayName}
          </h3>
        </Link>

        {/* Username */}
        {user.globalName && user.username && (
          <p className="text-center mb-2 text-xs text-gray-400 font-medium">
            @{username}
          </p>
        )}

        {/* Custom Status - Premium */}
        {user.customStatus && (
          <div className="text-center mb-2">
            <div className="inline-block px-2 py-1 bg-black/50 border border-gray-800 rounded-lg backdrop-blur-sm">
              <p className="text-xs text-gray-300 italic font-medium truncate max-w-[200px]">"{user.customStatus}"</p>
            </div>
          </div>
        )}

        {/* Nitro Badges - Premium */}
        {user.hasNitro && (
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <div className="px-2 py-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-full text-xs font-bold text-purple-300 backdrop-blur-sm">
              {localStorage.getItem('language') === 'en' ? 'Nitro' : 'Nitro'}
            </div>
            {user.nitroType === 'boost' && (
              <div className="px-2 py-0.5 bg-gradient-to-r from-pink-500/20 to-red-500/20 border border-pink-500/50 rounded-full text-xs font-bold text-pink-300 backdrop-blur-sm">
                {localStorage.getItem('language') === 'en' ? 'Boost' : 'Boost'}
              </div>
            )}
          </div>
        )}

        {/* Stats Grid - Premium */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          <div className="text-center p-2 bg-gradient-to-br from-gray-950 to-black border border-gray-900 rounded-lg hover:border-purple-500/50 transition-all duration-300 group/stat">
            <div className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 group-hover/stat:from-blue-300 group-hover/stat:to-cyan-300 transition-all duration-300">
              {formatNumber(user.totalGuilds || 0)}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5 font-medium">{localStorage.getItem('language') === 'en' ? 'Servers' : 'Sunucu'}</div>
          </div>
          
          <div className="text-center p-2 bg-gradient-to-br from-gray-950 to-black border border-gray-900 rounded-lg hover:border-green-500/50 transition-all duration-300 group/stat">
            <div className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 group-hover/stat:from-green-300 group-hover/stat:to-emerald-300 transition-all duration-300">
              {formatNumber(user.totalVotes || 0)}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5 font-medium">{localStorage.getItem('language') === 'en' ? 'Votes' : 'Oy'}</div>
          </div>
          
          <div className="text-center p-2 bg-gradient-to-br from-gray-950 to-black border border-gray-900 rounded-lg hover:border-purple-500/50 transition-all duration-300 group/stat">
            <div className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 group-hover/stat:from-purple-300 group-hover/stat:to-pink-300 transition-all duration-300">
              {formatNumber(user.votedGuildsCount || 0)}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5 font-medium">{localStorage.getItem('language') === 'en' ? 'Voted' : 'Oy Verdi'}</div>
          </div>

          <div className="text-center p-2 bg-gradient-to-br from-gray-950 to-black border border-gray-900 rounded-lg hover:border-yellow-500/50 transition-all duration-300 group/stat">
            <div className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 group-hover/stat:from-yellow-300 group-hover/stat:to-orange-300 transition-all duration-300">
              {formatNumber(user.viewCount || 0)}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5 font-medium">{localStorage.getItem('language') === 'en' ? 'Popular' : 'Popüler'}</div>
          </div>
        </div>

        {/* Status Info - Premium */}
        <div className="mb-2">
          <div className="flex items-center justify-center gap-1.5 px-2 py-1 bg-black/50 border border-gray-900 rounded-lg backdrop-blur-sm">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(user.status || 'offline')} shadow-lg`}></div>
            <span className="text-gray-300 font-medium text-xs">{getStatusText(user.status || 'offline')}</span>
          </div>
        </div>
      </div>

      {/* Corner Accents - Premium */}
      <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-br-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-pink-500/10 to-transparent rounded-tl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </div>
  )
}

