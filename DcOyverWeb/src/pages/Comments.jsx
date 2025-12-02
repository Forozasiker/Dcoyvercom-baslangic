import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useTranslation } from '../lib/translations'

axios.defaults.withCredentials = true

export default function Comments() {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('recent')
  const [t, setT] = useState(() => useTranslation())

  useEffect(() => {
    const handleLanguageChange = () => {
      setT(() => useTranslation())
    }
    
    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  useEffect(() => {
    fetchComments()
  }, [])

  const fetchComments = async () => {
    try {
      console.log('🔄 Yorumlar çekiliyor...')
      
      // Tüm yorumları al
      const response = await axios.get('/api/comments')
      const allComments = response.data
      
      console.log('✅ API\'den gelen yorumlar:', allComments)
      console.log('📊 Yorum sayısı:', Array.isArray(allComments) ? allComments.length : 'Array değil!')
      console.log('📊 Yorum tipi:', typeof allComments)
      
      if (!Array.isArray(allComments)) {
        console.error('❌ Yorumlar bir array değil!', allComments)
        setComments([])
        setLoading(false)
        return
      }
      
      if (allComments.length === 0) {
        console.log('⚠️ API\'den boş array geldi')
        setComments([])
        setLoading(false)
        return
      }
      
      // Tüm sunucuları al
      const guildsResponse = await axios.get('/api/guilds')
      const guilds = guildsResponse.data
      console.log('✅ API\'den gelen sunucular:', guilds)
      console.log('📊 Sunucu sayısı:', Array.isArray(guilds) ? guilds.length : 'Array değil!')
      
      const guildMap = new Map()
      if (Array.isArray(guilds)) {
        guilds.forEach(g => guildMap.set(g.guildId, g))
      }
      
      // Yorumlara sunucu bilgilerini ekle
      const commentsWithGuild = allComments.map(comment => {
        const guild = guildMap.get(comment.guildId)
        return {
          ...comment,
          guildName: guild?.name || 'Bilinmeyen Sunucu',
          guildIcon: guild?.iconURL,
          guildBanner: guild?.bannerURL,
          guildId: comment.guildId,
          guildCategory: guild?.category || 'public'
        }
      })
      
      console.log('✅ İşlenmiş yorumlar:', commentsWithGuild)
      console.log('📊 İşlenmiş yorum sayısı:', commentsWithGuild.length)
      setComments(commentsWithGuild)
    } catch (error) {
      console.error('❌ Yorumlar yüklenemedi:', error)
      console.error('❌ Hata detayı:', error.response?.data || error.message)
      console.error('❌ Hata status:', error.response?.status)
      console.error('❌ Hata headers:', error.response?.headers)
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  const sortedComments = [...comments].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt) - new Date(a.createdAt)
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt)
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      default:
        return 0
    }
  })

  const tabs = [
    { id: 'recent', name: localStorage.getItem('language') === 'en' ? 'Recent Comments' : 'Son Yorumlar', icon: '🕐', gradient: 'from-blue-500 via-cyan-500 to-teal-500' },
    { id: 'oldest', name: localStorage.getItem('language') === 'en' ? 'Oldest Comments' : 'Eski Yorumlar', icon: '📅', gradient: 'from-purple-500 via-violet-500 to-fuchsia-500' },
    { id: 'rating', name: localStorage.getItem('language') === 'en' ? 'Top Rated' : 'En Yüksek Puan', icon: '⭐', gradient: 'from-yellow-500 via-orange-500 to-red-500' }
  ]

  const isEn = localStorage.getItem('language') === 'en'

  const formatDate = (date) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (hours < 1) return 'Az önce'
    if (hours < 24) return `${hours} saat önce`
    if (days < 7) return `${days} gün önce`
    return d.toLocaleDateString('tr-TR')
  }

  if (loading) {
    return (
      <>
        <SEO 
          title={isEn ? 'Discord Server Comments - DcOyver.com' : 'Discord Sunucu Yorumları - DcOyver.com'}
          description={isEn ? 'Read and discover comments and ratings for Discord servers on DcOyver.' : 'DcOyver\'da Discord sunucuları için yorumları ve puanlamaları okuyun ve keşfedin.'}
          keywords="discord sunucu, discord server, discord oy ver, discord oy verme, discord vote, discord voting, discord oy botu, discord vote bot, discord voting bot, discord bot oy verme, oy verme discord bot, discord bot, discord bot listesi, discord bot list, discord sunucu listesi, discord server list, discord sunucu bul, discord server finder, discord sunucu arama, discord server search, discord topluluk, discord community, discord communities, discord servers, discord bots, discord türk, discord tr, discord türkiye, discord turkey, discord türkçe, discord turkish, discord oy verme botu, discord vote bot türkçe, discord bot türk, discord bot türkiye, discord bot türkçe, discord sunucu oy botu, discord server vote bot, discord oy sistemi, discord voting system, discord oy platformu, discord voting platform, discord sunucu tanıtım, discord server promotion, discord sunucu reklam, discord server advertisement, discord sunucu yorum, discord server comment, discord sunucu yorumları, discord server comments, discord sunucu puan, discord server rating, discord sunucu değerlendirme, discord server review, discord sunucu görüş, discord server opinion"
          url="https://dcoyver.com/yorumlar"
        />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Yorumlar yükleniyor...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SEO 
        title={isEn ? 'Discord Server Comments - DcOyver.com' : 'Discord Sunucu Yorumları - DcOyver.com'}
        description={isEn ? 'Read and discover comments and ratings for Discord servers on DcOyver. See what users say about their favorite Discord servers.' : 'DcOyver\'da Discord sunucuları için yorumları ve puanlamaları okuyun ve keşfedin. Kullanıcıların favori Discord sunucuları hakkında ne söylediklerini görün.'}
        keywords="discord sunucu, discord server, discord oy ver, discord oy verme, discord vote, discord voting, discord oy botu, discord vote bot, discord voting bot, discord bot oy verme, oy verme discord bot, discord bot, discord bot listesi, discord bot list, discord sunucu listesi, discord server list, discord sunucu bul, discord server finder, discord sunucu arama, discord server search, discord topluluk, discord community, discord communities, discord servers, discord bots, discord türk, discord tr, discord türkiye, discord turkey, discord türkçe, discord turkish, discord oy verme botu, discord vote bot türkçe, discord bot türk, discord bot türkiye, discord bot türkçe, discord sunucu oy botu, discord server vote bot, discord oy sistemi, discord voting system, discord oy platformu, discord voting platform, discord sunucu tanıtım, discord server promotion, discord sunucu reklam, discord server advertisement, discord sunucu yorum, discord server comment, discord sunucu yorumları, discord server comments, discord sunucu puan, discord server rating, discord sunucu değerlendirme, discord server review, discord sunucu görüş, discord server opinion"
        url="https://dcoyver.com/yorumlar"
      />
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] py-16 relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-900/20 via-pink-900/10 to-transparent"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Premium Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-8">
            <h1 className="text-7xl md:text-8xl font-black mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
              {localStorage.getItem('language') === 'en' ? 'Comments' : 'Yorumlar'}
            </h1>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="h-1 w-16 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <div className="h-1 w-16 bg-gradient-to-r from-transparent via-pink-500 to-transparent"></div>
            </div>
          </div>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {localStorage.getItem('language') === 'en' 
              ? 'Latest comments from all servers' 
              : 'Tüm sunuculardan son yorumlar'}
          </p>
        </div>

        {/* Premium Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSortBy(tab.id)}
              className={`group relative px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 overflow-hidden ${
                sortBy === tab.id
                  ? `bg-gradient-to-r ${tab.gradient} text-white scale-110 shadow-2xl`
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white hover:scale-105 border border-white/10 backdrop-blur-xl'
              }`}
            >
              {sortBy === tab.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-shimmer"></div>
              )}
              <span className="relative z-10 flex items-center gap-2">
                <span className="text-2xl">{tab.icon}</span>
                <span>{tab.name}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Comments Grid */}
        {!loading && sortedComments.length === 0 && comments.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-gray-400 text-xl">{localStorage.getItem('language') === 'en' ? 'No comments yet' : 'Henüz yorum yok'}</p>
          </div>
        ) : sortedComments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedComments.map((comment, index) => {
              const categoryColors = {
                public: { gradient: 'from-blue-500 via-cyan-500 to-teal-500' },
                private: { gradient: 'from-purple-500 via-violet-500 to-fuchsia-500' },
                game: { gradient: 'from-green-500 via-emerald-500 to-lime-500' }
              }
              const categoryInfo = categoryColors[comment.guildCategory] || categoryColors.public

              return (
                <div
                  key={comment._id || index}
                  className="group relative bg-[#1a1a24] rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/30 animate-fadeIn"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Banner Section with Guild Icon Centered */}
                  <div className={`relative h-32 bg-gradient-to-r ${categoryInfo.gradient} overflow-hidden`}>
                    {comment.guildBanner ? (
                      <img 
                        src={comment.guildBanner} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-r ${categoryInfo.gradient}`}></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50"></div>
                    
                    {/* Guild Icon - Centered */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="relative">
                        <div className={`absolute -inset-2 bg-gradient-to-r ${categoryInfo.gradient} rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500`}></div>
                        <div className="relative w-16 h-16 rounded-full border-4 border-[#1a1a24] bg-[#1a1a24] overflow-hidden">
                          {comment.guildIcon ? (
                            <img
                              src={comment.guildIcon}
                              alt={comment.guildName}
                              className="w-full h-full rounded-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className={`w-full h-full rounded-full bg-gradient-to-br ${categoryInfo.gradient} flex items-center justify-center text-xl font-black text-white group-hover:scale-110 transition-transform duration-500`}>
                              {comment.guildName?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="relative pt-4 pb-5 px-5">
                    {/* Guild Name */}
                    <div className="text-center mb-3">
                      <Link 
                        to={`/sunucu/${comment.guildId}`} 
                        className="text-base font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300 block"
                      >
                        {comment.guildName || 'Bilinmeyen Sunucu'}
                      </Link>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                      <img
                        src={comment.avatarUrl || `https://cdn.discordapp.com/embed/avatars/${parseInt(comment.userId) % 5}.png`}
                        alt={comment.username}
                        className="w-8 h-8 rounded-full border-2 border-purple-500/50"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{comment.username}</p>
                        <p className="text-gray-400 text-xs">{formatDate(comment.createdAt)}</p>
                      </div>
                    </div>

                    {/* Comment Content */}
                    <p className="text-gray-300 text-sm mb-3 leading-relaxed line-clamp-3 min-h-[60px]">
                      {comment.content}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-lg ${
                              star <= (comment.rating || 5)
                                ? 'text-yellow-400'
                                : 'text-gray-600'
                            }`}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                      <span className="text-gray-400 text-xs">({comment.rating || 5}/5)</span>
                    </div>

                    {/* Comment ID */}
                    <div className="pt-3 border-t border-white/10">
                      <p className="text-gray-500 text-xs text-center">
                        ID: {comment.commentId || comment._id?.slice(-6)} • {new Date(comment.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
    </>
  )
}

