import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import SEO from '../components/SEO'

axios.defaults.withCredentials = true

export default function KullaniciDetay() {
  const { discordId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [imageError, setImageError] = useState(false)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchUser()
    fetchComments()
  }, [discordId])

  const fetchComments = async () => {
    try {
      setCommentsLoading(true)
      // Kullanıcının yorumlarını çek - userId ile filtrele
      const response = await axios.get('/api/comments')
      if (response.data && Array.isArray(response.data)) {
        // Kullanıcının yorumlarını filtrele
        const userComments = response.data.filter(comment => comment.userId === discordId)
        // En son 5 yorumu al
        const latestComments = userComments.slice(0, 5)
        
        // Her yorum için sunucu bilgilerini çek
        const commentsWithGuilds = await Promise.all(
          latestComments.map(async (comment) => {
            try {
              const guildResponse = await axios.get(`/api/guilds/${comment.guildId}`)
              return {
                ...comment,
                guildName: guildResponse.data?.name || 'Unknown Server',
                guildIcon: guildResponse.data?.iconURL || null
              }
            } catch (error) {
              return {
                ...comment,
                guildName: 'Unknown Server',
                guildIcon: null
              }
            }
          })
        )
        setComments(commentsWithGuilds)
      }
    } catch (error) {
      console.error('❌ Yorumlar yüklenemedi:', error)
      setComments([])
    } finally {
      setCommentsLoading(false)
    }
  }

  const fetchUser = async () => {
    try {
      console.log('🔍 Kullanıcı detayı çekiliyor:', discordId)
      const response = await axios.get(`/api/users/${discordId}`)
      console.log('✅ API Response:', response)
      console.log('✅ Kullanıcı verisi alındı:', response.data)
      
      if (response.data && response.data.discordId) {
        console.log('✅ Kullanıcı verisi geçerli, state güncelleniyor')
        setUser(response.data)
      } else {
        console.warn('⚠️ Kullanıcı verisi eksik veya geçersiz:', response.data)
        setUser(null)
      }
    } catch (error) {
      console.error('❌ Kullanıcı yüklenemedi:', error)
      console.error('❌ Error response:', error.response?.data)
      console.error('❌ Error status:', error.response?.status)
      console.error('❌ Error message:', error.message)
      
      if (error.response?.status === 404) {
        console.warn('⚠️ 404 - Kullanıcı bulunamadı')
      } else if (error.response?.status === 403) {
        console.warn('⚠️ 403 - Origin kontrolü başarısız')
      }
      
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'idle':
        return 'bg-yellow-500'
      case 'dnd':
        return 'bg-red-500'
      default:
        return 'bg-gray-600'
    }
  }

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

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 7) {
      return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
    } else if (days > 0) {
      return `${days} ${localStorage.getItem('language') === 'en' ? 'days ago' : 'gün önce'}`
    } else if (hours > 0) {
      return `${hours} ${localStorage.getItem('language') === 'en' ? 'hours ago' : 'saat önce'}`
    } else if (minutes > 0) {
      return `${minutes} ${localStorage.getItem('language') === 'en' ? 'minutes ago' : 'dakika önce'}`
    } else {
      return localStorage.getItem('language') === 'en' ? 'Just now' : 'Az önce'
    }
  }

  const getBannerUrl = () => {
    if (user?.bannerUrl && !imageError) {
      if (user.bannerUrl.includes('?size=')) {
        return user.bannerUrl.replace(/\?size=\d+/, '?size=2048')
      }
      return user.bannerUrl + '?size=2048'
    }
    return null
  }

  const displayName = user?.globalName || user?.username || 'Unknown'
  const username = user?.username || 'unknown'
  const avatarUrl = user?.avatarUrl || `https://cdn.discordapp.com/embed/avatars/${(discordId || '0').charAt(discordId?.length - 1) || 0}.png`
  const bannerUrl = getBannerUrl()

  if (loading) {
    return (
      <>
        <SEO
          title={`${displayName} | DcOyver.com`}
          description={`${displayName} kullanıcı profili`}
        />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-gray-800 border-t-purple-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 text-lg">
              {localStorage.getItem('language') === 'en' ? 'Loading...' : 'Yükleniyor...'}
            </p>
          </div>
        </div>
      </>
    )
  }

  if (!loading && !user) {
    return (
      <>
        <SEO
          title="Kullanıcı Bulunamadı | DcOyver.com"
          description="Kullanıcı bulunamadı"
        />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500 mb-4">
              404
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              {localStorage.getItem('language') === 'en' ? 'User Not Found' : 'Kullanıcı Bulunamadı'}
            </h1>
            <p className="text-gray-400 text-lg mb-6">
              {localStorage.getItem('language') === 'en' 
                ? 'The user you are looking for does not exist or may have been removed.'
                : 'Aradığınız kullanıcı mevcut değil veya kaldırılmış olabilir.'}
            </p>
            <button
              onClick={() => navigate('/kullanicilar')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-white font-semibold transition-all duration-300"
            >
              {localStorage.getItem('language') === 'en' ? 'Back to Users' : 'Kullanıcılara Dön'}
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SEO
        title={`${displayName} | DcOyver.com`}
        description={`${displayName} kullanıcı profili - ${user.totalGuilds || 0} sunucu, ${user.totalVotes || 0} oy`}
      />
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Ultra Premium Background Effects - Multi-Color Neon Glow */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-950 via-black to-gray-950"></div>
          {/* Neon Purple Glow - Daha Canlı */}
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-[140px] animate-pulse shadow-[0_0_300px_rgba(168,85,247,0.5)]"></div>
          {/* Neon Pink Glow - Daha Canlı */}
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-pink-500/30 rounded-full blur-[140px] animate-pulse shadow-[0_0_300px_rgba(236,72,153,0.5)]" style={{ animationDelay: '1s' }}></div>
          {/* Neon Cyan Glow - Daha Canlı */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/25 rounded-full blur-[160px] animate-pulse shadow-[0_0_350px_rgba(6,182,212,0.4)]" style={{ animationDelay: '2s' }}></div>
          {/* Neon Blue Glow - Daha Canlı */}
          <div className="absolute top-3/4 left-1/3 w-[500px] h-[500px] bg-blue-500/25 rounded-full blur-[120px] animate-pulse shadow-[0_0_250px_rgba(59,130,246,0.4)]" style={{ animationDelay: '0.5s' }}></div>
          {/* Neon Orange Glow - Yeni */}
          <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-orange-500/20 rounded-full blur-[130px] animate-pulse shadow-[0_0_280px_rgba(249,115,22,0.3)]" style={{ animationDelay: '1.5s' }}></div>
          {/* Neon Green Glow - Yeni */}
          <div className="absolute bottom-1/3 left-1/5 w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-[110px] animate-pulse shadow-[0_0_240px_rgba(16,185,129,0.3)]" style={{ animationDelay: '0.8s' }}></div>
        </div>

        {/* Ultra Premium Banner Section - Neon Effects */}
        <div className="relative h-64 sm:h-80 overflow-hidden">
          {bannerUrl ? (
            <>
              <img 
                src={bannerUrl} 
                alt={displayName}
                className="w-full h-full object-cover"
              />
              {/* Neon Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900/30 via-black via-indigo-900/30 to-pink-900/20 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
              {/* Animated Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 animate-pulse"></div>
            </div>
          )}
          {/* Neon Border Glow */}
          <div className="absolute inset-0 border-b-2 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.5)]"></div>
        </div>

        {/* Main Container */}
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative -mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sol Sidebar - Kullanıcı Profili - Ultra Premium Stil */}
            <div className="lg:col-span-1">
              <div className="group relative backdrop-blur-xl border-2 bg-gradient-to-br from-gray-950/95 via-purple-950/10 to-black/95 border-purple-500/40 hover:border-purple-300/80 hover:from-gray-900/95 hover:via-pink-950/10 hover:to-gray-900/95 rounded-2xl overflow-hidden transition-all duration-700 transform hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(168,85,247,0.6),0_0_120px_rgba(236,72,153,0.4),0_0_80px_rgba(6,182,212,0.3)] shadow-[0_0_40px_rgba(168,85,247,0.3)] sticky top-8">
                {/* Ultra Premium Multi-Color Neon Glow Effect */}
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/40 via-pink-600/40 to-cyan-600/40 rounded-2xl opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-700 -z-10 animate-pulse"></div>
                {/* Secondary Multi-Color Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 rounded-2xl opacity-0 group-hover:opacity-90 blur-xl transition-opacity duration-700 -z-10"></div>
                {/* Tertiary Orange Glow - Yeni */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 via-yellow-500/20 to-emerald-500/20 rounded-2xl opacity-0 group-hover:opacity-70 blur-lg transition-opacity duration-700 -z-10"></div>
                
                {/* Ultra Premium Banner Section - Neon Effects */}
                <div className="relative h-32 sm:h-40 overflow-hidden">
                  <img 
                    src={bannerUrl || '/banner.png'} 
                    alt={displayName}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                    onError={() => setImageError(true)}
                  />
                  
                  {/* Ultra Premium Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
                  
                  {/* Neon Shimmer Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-purple-400/20 to-transparent"></div>
                  
                  {/* Bottom Neon Border */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent shadow-[0_0_20px_rgba(168,85,247,0.6)]"></div>
                </div>

                {/* Content Section */}
                <div className="p-4 sm:p-6 relative">
                  {/* Ultra Premium User Avatar - Neon Glow */}
                  <div className="relative -mt-12 sm:-mt-16 mb-3 flex justify-center">
                    <div className="relative">
                      {/* Ultra Premium Avatar Glow - Multi Layer */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/40 via-pink-500/40 to-cyan-500/40 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-pink-500/30 rounded-full blur-xl opacity-0 group-hover:opacity-80 transition-opacity duration-700"></div>
                      
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                        <img 
                          src={avatarUrl} 
                          alt={displayName}
                          className="w-full h-full rounded-full object-cover border-4 border-black shadow-[0_0_30px_rgba(168,85,247,0.5)] group-hover:border-purple-400/70 group-hover:shadow-[0_0_50px_rgba(168,85,247,0.8)] transition-all duration-700"
                          onError={(e) => {
                            e.target.src = `https://cdn.discordapp.com/embed/avatars/${(discordId || '0').charAt(discordId?.length - 1) || 0}.png`
                          }}
                        />
                        
                        {/* Ultra Premium Status Badge - Neon Glow */}
                        {user.status && (
                          <div className={`absolute bottom-0 right-0 w-6 h-6 sm:w-7 sm:h-7 ${getStatusColor(user.status)} rounded-full border-3 border-black shadow-[0_0_15px_currentColor] animate-pulse`}></div>
                        )}
                        
                        {/* Ultra Premium Nitro Badge - Neon Glow */}
                        {user.hasNitro && (
                          <div className="absolute -top-0.5 -right-0.5 w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.8)] border-2 border-black animate-pulse">
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ultra Premium User Name - Neon Gradient Text */}
                  <h1 className="text-center mb-1 text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white group-hover:from-purple-300 group-hover:via-pink-300 group-hover:to-cyan-300 transition-all duration-700 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] group-hover:drop-shadow-[0_0_20px_rgba(236,72,153,0.8)]">
                    {displayName}
                  </h1>
                  
                  {/* Username */}
                  {user.globalName && user.username && (
                    <p className="text-center mb-2 text-xs sm:text-sm text-gray-400 font-medium">
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

                  {/* Ultra Premium Stats Grid - Multi-Color Neon Glow Effects */}
                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                    <div className="text-center p-2 bg-gradient-to-br from-blue-950/40 via-cyan-950/30 to-black/90 backdrop-blur-sm border-2 border-blue-400/50 rounded-lg hover:border-blue-300/90 hover:shadow-[0_0_30px_rgba(59,130,246,0.7),0_0_15px_rgba(6,182,212,0.5)] hover:from-blue-950/60 hover:via-cyan-950/40 transition-all duration-500 group/stat">
                      <div className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-300 group-hover/stat:from-blue-200 group-hover/stat:via-cyan-200 group-hover/stat:to-blue-200 transition-all duration-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]">
                        {formatNumber(user.totalGuilds || 0)}
                      </div>
                      <div className="text-[10px] text-blue-300/70 mt-0.5 font-medium">{localStorage.getItem('language') === 'en' ? 'Servers' : 'Sunucu'}</div>
                    </div>
                    
                    <div className="text-center p-2 bg-gradient-to-br from-emerald-950/40 via-green-950/30 to-black/90 backdrop-blur-sm border-2 border-emerald-400/50 rounded-lg hover:border-emerald-300/90 hover:shadow-[0_0_30px_rgba(16,185,129,0.7),0_0_15px_rgba(34,197,94,0.5)] hover:from-emerald-950/60 hover:via-green-950/40 transition-all duration-500 group/stat">
                      <div className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-300 group-hover/stat:from-emerald-200 group-hover/stat:via-green-200 group-hover/stat:to-emerald-200 transition-all duration-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]">
                        {formatNumber(user.totalVotes || 0)}
                      </div>
                      <div className="text-[10px] text-emerald-300/70 mt-0.5 font-medium">{localStorage.getItem('language') === 'en' ? 'Votes' : 'Oy'}</div>
                    </div>
                    
                    <div className="text-center p-2 bg-gradient-to-br from-purple-950/40 via-pink-950/30 to-black/90 backdrop-blur-sm border-2 border-purple-400/50 rounded-lg hover:border-purple-300/90 hover:shadow-[0_0_30px_rgba(168,85,247,0.7),0_0_15px_rgba(236,72,153,0.5)] hover:from-purple-950/60 hover:via-pink-950/40 transition-all duration-500 group/stat">
                      <div className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 group-hover/stat:from-purple-200 group-hover/stat:via-pink-200 group-hover/stat:to-purple-200 transition-all duration-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]">
                        {formatNumber(user.votedGuildsCount || 0)}
                      </div>
                      <div className="text-[10px] text-purple-300/70 mt-0.5 font-medium">{localStorage.getItem('language') === 'en' ? 'Voted' : 'Oy Verdi'}</div>
                    </div>

                    <div className="text-center p-2 bg-gradient-to-br from-orange-950/40 via-yellow-950/30 to-black/90 backdrop-blur-sm border-2 border-orange-400/50 rounded-lg hover:border-orange-300/90 hover:shadow-[0_0_30px_rgba(249,115,22,0.7),0_0_15px_rgba(234,179,8,0.5)] hover:from-orange-950/60 hover:via-yellow-950/40 transition-all duration-500 group/stat">
                      <div className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-yellow-300 to-orange-300 group-hover/stat:from-orange-200 group-hover/stat:via-yellow-200 group-hover/stat:to-orange-200 transition-all duration-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]">
                        {formatNumber(user.viewCount || 0)}
                      </div>
                      <div className="text-[10px] text-orange-300/70 mt-0.5 font-medium">{localStorage.getItem('language') === 'en' ? 'Popular' : 'Popüler'}</div>
                    </div>
                  </div>

                  {/* Ultra Premium Status Info - Neon Glow */}
                  <div className="mb-2">
                    <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md border-2 rounded-lg transition-all duration-500 ${
                      user.status === 'online' ? 'border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:border-green-400/70 hover:shadow-[0_0_25px_rgba(34,197,94,0.6)]' :
                      user.status === 'idle' ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.4)] hover:border-yellow-400/70 hover:shadow-[0_0_25px_rgba(234,179,8,0.6)]' :
                      user.status === 'dnd' ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:border-red-400/70 hover:shadow-[0_0_25px_rgba(239,68,68,0.6)]' :
                      'border-gray-600/50 shadow-[0_0_15px_rgba(107,114,128,0.4)] hover:border-gray-500/70'
                    }`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(user.status || 'offline')} shadow-[0_0_10px_currentColor] animate-pulse`}></div>
                      <span className="text-gray-200 font-semibold text-xs">{getStatusText(user.status || 'offline')}</span>
                    </div>
                  </div>

                  {/* Discord ID & Last Synced */}
                  <div className="pt-3 border-t border-gray-900 text-center">
                    <p className="text-xs text-gray-600 font-mono">ID: {user.discordId}</p>
                    {user.lastSyncedAt && (
                      <p className="text-xs text-gray-700 mt-1">
                        {localStorage.getItem('language') === 'en' ? 'Last synced' : 'Son senkronizasyon'}: {formatDate(user.lastSyncedAt)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ultra Premium Corner Accents - Neon Glow */}
                <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent rounded-br-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 shadow-[0_0_30px_rgba(168,85,247,0.3)]"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-pink-500/20 via-cyan-500/10 to-transparent rounded-tl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 shadow-[0_0_30px_rgba(236,72,153,0.3)]"></div>
              </div>
            </div>

            {/* Sağ Taraf - Ana İçerik */}
            <div className="lg:col-span-3 space-y-6">
              {/* Ultra Premium Tabs - Neon Glow */}
              <div className="flex gap-2 border-b-2 border-purple-500/20 pb-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-3 font-bold transition-all duration-500 relative ${
                    activeTab === 'overview'
                      ? 'text-white border-b-2 border-purple-400 shadow-[0_4px_20px_rgba(168,85,247,0.5)]'
                      : 'text-gray-400 hover:text-purple-300 hover:border-b-2 hover:border-purple-500/50'
                  }`}
                >
                  {localStorage.getItem('language') === 'en' ? 'Overview' : 'Genel Bakış'}
                  {activeTab === 'overview' && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('activities')}
                  className={`px-6 py-3 font-bold transition-all duration-500 relative ${
                    activeTab === 'activities'
                      ? 'text-white border-b-2 border-cyan-400 shadow-[0_4px_20px_rgba(6,182,212,0.5)]'
                      : 'text-gray-400 hover:text-cyan-300 hover:border-b-2 hover:border-cyan-500/50'
                  }`}
                >
                  {localStorage.getItem('language') === 'en' ? 'Activities' : 'Aktiviteler'}
                  {activeTab === 'activities' && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('servers')}
                  className={`px-6 py-3 font-bold transition-all duration-500 relative ${
                    activeTab === 'servers'
                      ? 'text-white border-b-2 border-pink-400 shadow-[0_4px_20px_rgba(236,72,153,0.5)]'
                      : 'text-gray-400 hover:text-pink-300 hover:border-b-2 hover:border-pink-500/50'
                  }`}
                >
                  {localStorage.getItem('language') === 'en' ? 'Servers' : 'Sunucular'} <span className="text-gray-500">({user.guilds?.length || 0})</span>
                  {activeTab === 'servers' && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-pink-400 to-transparent shadow-[0_0_10px_rgba(236,72,153,0.8)]"></div>
                  )}
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Ultra Premium Recent Comments - API'den Çekilen - Neon Glow */}
                  <div className="bg-gradient-to-br from-gray-900/95 via-yellow-900/10 to-black/95 backdrop-blur-md rounded-xl p-6 border-2 border-yellow-500/40 shadow-[0_0_40px_rgba(234,179,8,0.3)] hover:border-yellow-400/70 hover:shadow-[0_0_60px_rgba(234,179,8,0.5)] transition-all duration-700">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,1)] animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                        {localStorage.getItem('language') === 'en' ? 'Latest Comments' : 'Son Yorumlar'}
                      </span>
                    </h2>
                    {commentsLoading ? (
                      <div className="text-center py-8">
                        <div className="inline-block w-8 h-8 border-2 border-yellow-500/50 border-t-yellow-400 rounded-full animate-spin"></div>
                      </div>
                    ) : comments.length > 0 ? (
                      <div className="space-y-4">
                        {comments.map((comment, index) => (
                          <Link
                            key={comment._id || index}
                            to={`/sunucu/${comment.guildId}`}
                            className="group block bg-gradient-to-br from-gray-800/90 via-yellow-900/5 to-gray-900/90 backdrop-blur-sm rounded-lg p-4 border border-yellow-500/30 hover:border-yellow-400/60 hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] hover:from-gray-800/95 hover:via-yellow-900/10 hover:to-gray-900/95 transition-all duration-500"
                          >
                            <div className="flex items-start gap-3 mb-2">
                              {/* Sunucu İkonu */}
                              <div className="flex-shrink-0">
                                {comment.guildIcon ? (
                                  <img 
                                    src={comment.guildIcon} 
                                    alt={comment.guildName}
                                    className="w-10 h-10 rounded-lg border-2 border-yellow-500/40 group-hover:border-yellow-400/70 group-hover:shadow-[0_0_15px_rgba(234,179,8,0.6)] transition-all duration-500"
                                    onError={(e) => e.target.style.display = 'none'}
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border-2 border-yellow-500/40 flex items-center justify-center">
                                    <span className="text-lg font-bold text-yellow-300">
                                      {(comment.guildName || '?').charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-bold text-white truncate drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{comment.guildName || 'Unknown Server'}</span>
                                    <span className="text-gray-400 text-xs">•</span>
                                    <span className="font-semibold text-yellow-300 text-sm truncate">{comment.username}</span>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {[...Array(comment.rating || 5)].map((_, i) => (
                                      <svg key={i} className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    ))}
                                  </div>
                                </div>
                                <p className="text-gray-200 text-sm mb-2 line-clamp-2 group-hover:text-white transition-colors">"{comment.content || ''}"</p>
                                <p className="text-gray-400 text-xs">{formatDate(comment.createdAt || comment.created_at)}</p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400">{localStorage.getItem('language') === 'en' ? 'No comments yet' : 'Henüz yorum yok'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'activities' && (
                <div className="space-y-6">
                  {/* Ultra Premium Son Ses Kanalı - Neon Glow */}
                  {user.lastVoiceChannelId && (
                    <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-md rounded-xl p-6 border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:border-cyan-400/50 hover:shadow-[0_0_50px_rgba(6,182,212,0.4)] transition-all duration-700">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                          {localStorage.getItem('language') === 'en' ? 'Last Voice Channel' : 'Son Ses Kanalı'}
                        </span>
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">{localStorage.getItem('language') === 'en' ? 'Channel Name' : 'Kanal Adı'}:</span>
                          <span className="text-white font-semibold">{user.lastVoiceChannelName || '-'}</span>
                        </div>
                        {user.lastVoiceJoinedAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">{localStorage.getItem('language') === 'en' ? 'Joined At' : 'Katılma Tarihi'}:</span>
                            <span className="text-gray-300 text-sm">{formatDate(user.lastVoiceJoinedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ultra Premium Son Mesaj Kanalı - Neon Glow */}
                  {user.lastMessageChannelId && (
                    <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-md rounded-xl p-6 border-2 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:border-purple-400/50 hover:shadow-[0_0_50px_rgba(168,85,247,0.4)] transition-all duration-700">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                          {localStorage.getItem('language') === 'en' ? 'Last Message Channel' : 'Son Mesaj Kanalı'}
                        </span>
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">{localStorage.getItem('language') === 'en' ? 'Channel Name' : 'Kanal Adı'}:</span>
                          <span className="text-white font-semibold">{user.lastMessageChannelName || '-'}</span>
                        </div>
                        {user.lastMessage && (
                          <div className="mt-3 pt-3 border-t border-gray-800">
                            <span className="text-gray-400 text-sm block mb-2">{localStorage.getItem('language') === 'en' ? 'Last Message' : 'Son Mesaj'}:</span>
                            <p className="text-gray-300 text-sm bg-gray-800 p-3 rounded-lg border border-gray-700">
                              "{user.lastMessage.length > 200 ? user.lastMessage.substring(0, 200) + '...' : user.lastMessage}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ultra Premium Discord Aktiviteleri - Neon Glow */}
                  {user.activities && user.activities.length > 0 && (
                    <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-md rounded-xl p-6 border-2 border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)] hover:border-green-400/50 hover:shadow-[0_0_50px_rgba(34,197,94,0.4)] transition-all duration-700">
                      <h3 className="text-lg font-bold mb-4">
                        <span className="bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">
                          {localStorage.getItem('language') === 'en' ? 'Discord Activities' : 'Discord Aktiviteleri'}
                        </span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {user.activities.map((activity, index) => (
                          <div key={index} className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-lg p-4 border border-green-500/20 hover:border-green-400/40 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all duration-500">
                            <p className="text-white font-semibold mb-2">{activity.name || '-'}</p>
                            {activity.details && <p className="text-gray-300 text-sm">{activity.details}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'servers' && (
                <div className="space-y-6">
                  {/* Bulunduğu Sunucular - Top100 Tarzı Uzunlamasına */}
                  {user.guilds && user.guilds.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                        <span className="text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">🏰</span>
                        <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                          {localStorage.getItem('language') === 'en' ? 'Servers' : 'Bulunduğu Sunucular'}
                        </span>
                        <span className="text-gray-400 text-lg">({user.guilds.length})</span>
                      </h2>
                      <div className="space-y-3">
                        {user.guilds.map((guild, index) => (
                          <Link
                            key={index}
                            to={`/sunucu/${guild.guildId}`}
                            className="group block relative overflow-hidden rounded-xl transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl"
                          >
                            {/* Ultra Premium Background - Multi-Color Neon Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-yellow-950/20 to-gray-900/95 group-hover:from-gray-800/95 group-hover:via-orange-950/30 group-hover:to-gray-800/95 transition-all duration-700"></div>
                            
                            {/* Ultra Premium Border - Multi-Color Neon Glow */}
                            <div className="absolute inset-0 border-2 border-yellow-500/50 group-hover:border-yellow-300/90 rounded-xl transition-all duration-700 group-hover:shadow-[0_0_40px_rgba(234,179,8,0.6),0_0_20px_rgba(249,115,22,0.4)]"></div>
                            
                            {/* Multi-Color Neon Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-orange-500/10 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl"></div>
                            <div className="absolute inset-0 bg-gradient-to-l from-amber-500/0 via-yellow-500/8 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl"></div>
                            
                            {/* Content */}
                            <div className="relative p-4 flex items-center gap-4">
                              {/* Ultra Premium Guild Icon - Neon Glow */}
                              <div className="flex-shrink-0 relative">
                                {/* Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                {guild.guildIcon ? (
                                  <img 
                                    src={guild.guildIcon} 
                                    alt={guild.guildName}
                                    className="relative w-16 h-16 rounded-xl border-2 border-yellow-500/40 group-hover:border-yellow-400/70 transition-all duration-700 group-hover:shadow-[0_0_25px_rgba(234,179,8,0.6)]"
                                    onError={(e) => e.target.style.display = 'none'}
                                  />
                                ) : (
                                  <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 border-2 border-yellow-500/40 group-hover:border-yellow-400/70 group-hover:shadow-[0_0_25px_rgba(234,179,8,0.6)] flex items-center justify-center transition-all duration-700">
                                    <span className="text-2xl font-bold text-blue-300 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">
                                      {(guild.guildName || '?').charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Guild Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-white truncate mb-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{guild.guildName}</h3>
                                    {guild.guildDescription && (
                                      <p className="text-sm text-gray-300 line-clamp-1 mb-2">{guild.guildDescription}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {guild.guildCategory && (
                                      <span className="px-2 py-1 bg-gray-800/70 backdrop-blur-sm rounded text-xs text-gray-300 border border-gray-600/50 hover:border-gray-500/70 transition-all duration-500">
                                        {guild.guildCategory}
                                      </span>
                                    )}
                                    {guild.isOwner && (
                                      <span className="px-2 py-1 bg-yellow-500/30 border border-yellow-400/70 rounded text-xs text-yellow-300 font-bold shadow-[0_0_15px_rgba(234,179,8,0.5)] hover:shadow-[0_0_25px_rgba(234,179,8,0.8)] transition-all duration-500">
                                        {localStorage.getItem('language') === 'en' ? 'Owner' : 'Sahip'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1 text-gray-400">
                                    <span>{localStorage.getItem('language') === 'en' ? 'Joined' : 'Katıldı'}:</span>
                                    <span className="text-gray-300">{formatDate(guild.joinedAt)}</span>
                                  </div>
                                  {guild.guildMemberCount && (
                                    <div className="flex items-center gap-1 text-gray-400">
                                      <span>👥</span>
                                      <span>{formatNumber(guild.guildMemberCount)}</span>
                                    </div>
                                  )}
                                  {guild.guildTotalVotes && (
                                    <div className="flex items-center gap-1 text-gray-400">
                                      <span>⭐</span>
                                      <span>{formatNumber(guild.guildTotalVotes)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Oy Verdiği Sunucular - Top100 Tarzı Uzunlamasına */}
                  {user.votedGuilds && user.votedGuilds.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                        <span className="text-pink-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]">❤️</span>
                        <span className="bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
                          {localStorage.getItem('language') === 'en' ? 'Voted Servers' : 'Oy Verdiği Sunucular'}
                        </span>
                        <span className="text-gray-400 text-lg">({user.votedGuilds.length})</span>
                      </h2>
                      <div className="space-y-3">
                        {user.votedGuilds.map((vote, index) => (
                          <Link
                            key={index}
                            to={`/sunucu/${vote.guildId}`}
                            className="group block relative overflow-hidden rounded-xl transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl"
                          >
                            {/* Ultra Premium Background - Multi-Color Neon Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-pink-900/40 to-cyan-900/30 group-hover:from-purple-800/50 group-hover:via-pink-800/40 group-hover:to-cyan-800/30 transition-all duration-700"></div>
                            
                            {/* Ultra Premium Border - Multi-Color Neon Glow */}
                            <div className="absolute inset-0 border-2 border-purple-400/60 group-hover:border-purple-300/90 rounded-xl transition-all duration-700 group-hover:shadow-[0_0_50px_rgba(168,85,247,0.7),0_0_25px_rgba(236,72,153,0.5),0_0_15px_rgba(6,182,212,0.4)]"></div>
                            
                            {/* Multi-Color Neon Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/15 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl"></div>
                            <div className="absolute inset-0 bg-gradient-to-l from-cyan-500/0 via-purple-500/12 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl"></div>
                            
                            {/* Content */}
                            <div className="relative p-4 flex items-center gap-4">
                              {/* Ultra Premium Guild Icon - Neon Glow */}
                              <div className="flex-shrink-0 relative">
                                {/* Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                {vote.guildIcon ? (
                                  <img 
                                    src={vote.guildIcon} 
                                    alt={vote.guildName || 'Server'}
                                    className="relative w-16 h-16 rounded-xl border-2 border-purple-400/60 group-hover:border-purple-300/80 transition-all duration-700 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.7)]"
                                    onError={(e) => e.target.style.display = 'none'}
                                  />
                                ) : (
                                  <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/40 to-pink-500/40 border-2 border-purple-400/60 group-hover:border-purple-300/80 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.7)] flex items-center justify-center transition-all duration-700">
                                    <span className="text-2xl font-bold text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
                                      {(vote.guildName || '?').charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Guild Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-white truncate mb-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{vote.guildName || 'Unknown Server'}</h3>
                                    {vote.guildDescription && (
                                      <p className="text-sm text-gray-300 line-clamp-1 mb-2">{vote.guildDescription}</p>
                                    )}
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]">
                                      {vote.voteCount}
                                    </div>
                                    <div className="text-xs text-gray-400 font-semibold">{localStorage.getItem('language') === 'en' ? 'votes' : 'oy'}</div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1 text-gray-400">
                                    <span>{localStorage.getItem('language') === 'en' ? 'Voted at' : 'Oy verildi'}:</span>
                                    <span className="text-gray-300">{formatDate(vote.votedAt)}</span>
                                  </div>
                                  {vote.guildMemberCount && (
                                    <div className="flex items-center gap-1 text-gray-400">
                                      <span>👥</span>
                                      <span>{formatNumber(vote.guildMemberCount)}</span>
                                    </div>
                                  )}
                                  {vote.guildTotalVotes && (
                                    <div className="flex items-center gap-1 text-gray-400">
                                      <span>⭐</span>
                                      <span>{formatNumber(vote.guildTotalVotes)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
