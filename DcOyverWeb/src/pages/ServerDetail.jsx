import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import SEO from '../components/SEO'

axios.defaults.withCredentials = true

export default function ServerDetail() {
  const { guildId } = useParams()
  const navigate = useNavigate()
  const [server, setServer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: '' })
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [deletingComment, setDeletingComment] = useState(null)

  useEffect(() => {
    // Sayfa yüklendiğinde en üste kaydır
    window.scrollTo(0, 0)
    fetchServer()
    checkAuth()
    fetchComments()
  }, [guildId])


  const checkAuth = async () => {
    try {
      const { data } = await axios.get('/api/auth/user')
      setUser(data)
      setIsAdmin(data?.isAdmin || false)
    } catch (error) {
      setUser(null)
      setIsAdmin(false)
    }
  }

  const fetchServer = async () => {
    try {
      const { data } = await axios.get(`/api/guilds/${guildId}`)
      if (!data || !data.guildId) {
        // Sunucu bulunamadı, 404 sayfasına yönlendir
        navigate('/404', { replace: true })
        return
      }
      setServer(data)
    } catch (error) {
      console.error('Sunucu yüklenemedi:', error)
      // Hata durumunda 404 sayfasına yönlendir
      if (error.response?.status === 404 || !error.response) {
        navigate('/404', { replace: true })
        return
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    setLoadingComments(true)
    try {
      const { data } = await axios.get(`/api/guilds/${guildId}/comments`)
      setComments(data || [])
    } catch (error) {
      console.error('Yorumlar yüklenemedi:', error)
      setComments([])
    } finally {
      setLoadingComments(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!isAdmin) return
    
    const confirmMessage = localStorage.getItem('language') === 'en' 
      ? 'Are you sure you want to delete this comment?'
      : 'Bu yorumu silmek istediğinize emin misiniz?'
    
    if (!confirm(confirmMessage)) return
    
    setDeletingComment(commentId)
    try {
      await axios.delete(`/api/comments/${commentId}`)
      setComments(comments.filter(c => (c._id || c.id) !== commentId))
      alert(localStorage.getItem('language') === 'en' ? 'Comment deleted successfully' : 'Yorum başarıyla silindi')
    } catch (error) {
      console.error('Yorum silme hatası:', error)
      alert(error.response?.data?.error || (localStorage.getItem('language') === 'en' ? 'Error occurred' : 'Hata oluştu'))
    } finally {
      setDeletingComment(null)
    }
  }


  const formatDate = (dateString) => {
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
      return `${days} gün önce`
    } else if (hours > 0) {
      return `${hours} saat önce`
    } else if (minutes > 0) {
      return `${minutes} dakika önce`
    } else {
      return 'Az önce'
    }
  }

  const getAvatarURL = (avatar, userId) => {
    if (!userId) {
      return `https://cdn.discordapp.com/embed/avatars/0.png`
    }
    if (avatar) {
      return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=128`
    }
    const avatarIndex = parseInt(userId) % 5
    return `https://cdn.discordapp.com/embed/avatars/${avatarIndex}.png`
  }


  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.floor(Math.random() * 10) + 1
    setCaptcha({ num1, num2, answer: '' })
    return { num1, num2 }
  }

  const handleVote = async () => {
    if (!user) {
      alert('Oy vermek için Discord ile giriş yapmalısınız!')
      return
    }

    // Generate captcha
    const { num1, num2 } = generateCaptcha()
    setShowCaptcha(true)
  }

  const submitVote = async () => {
    const correctAnswer = captcha.num1 + captcha.num2
    
    if (parseInt(captcha.answer) !== correctAnswer) {
      alert('Yanlış cevap! Lütfen tekrar deneyin.')
      generateCaptcha()
      return
    }

    setVoting(true)
    setShowCaptcha(false)
    
    try {
      await axios.post(`/api/guilds/${guildId}/vote`, {
        userId: user.id
      })
      alert('Oyunuz kaydedildi! ✅')
      fetchServer()
    } catch (error) {
      alert(error.response?.data?.error || 'Oy verilemedi')
    } finally {
      setVoting(false)
    }
  }

  const categoryColors = {
    public: 'from-gray-800 to-gray-900',
    private: 'from-gray-800 to-gray-900',
    game: 'from-gray-800 to-gray-900'
  }

  const categoryNames = {
    public: 'Genel',
    private: 'Özel',
    game: 'Oyun'
  }

  if (loading) {
    return (
      <>
        <SEO 
          title="Discord Sunucu Detayları - DcOyver.com"
          description="Discord sunucu detayları yükleniyor..."
        />
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500/30 border-r-blue-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <p className="mt-4 text-gray-400 text-sm animate-pulse">Yükleniyor...</p>
          </div>
        </div>
      </>
    )
  }

  if (!server) {
    return (
      <>
        <SEO 
          title="Discord Sunucu Bulunamadı - DcOyver.com"
          description="Aradığınız Discord sunucusu bulunamadı."
        />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-400 text-lg">Sunucu bulunamadı</p>
        </div>
      </>
    )
  }

  return (
    <>
      <SEO 
        title={`${server.name} - Discord Sunucu | Discord Server | ${server.memberCount?.toLocaleString('tr-TR')} Üye - DcOyver.com`}
        description={`${server.name} Discord sunucusu - ${server.memberCount?.toLocaleString('tr-TR') || 0} üye, ${server.onlineCount || 0} online. ${server.description || 'Discord sunucu detayları, üye sayısı, online sayısı, oy sayısı ve daha fazlası.'} Discord sunucuya katıl, Discord server join, Discord sunucu oy ver.`}
        keywords={`${server.name}, ${server.name} discord, ${server.name} discord sunucu, ${server.name} discord server, discord sunucu, discord server, discord oy ver, discord oy verme, discord vote, discord voting, discord oy botu, discord vote bot, discord voting bot, discord bot oy verme, oy verme discord bot, discord bot, discord bot listesi, discord bot list, discord sunucu listesi, discord server list, discord sunucu bul, discord server finder, discord sunucu arama, discord server search, ${server.category || ''} discord, discord topluluk, discord community, discord communities, discord servers, discord bots, ${server.name} discord sunucusu, ${server.name} discord server, discord sunucu detayları, discord server details, discord sunucu bilgileri, discord server info, discord sunucu üye sayısı, discord server member count, discord sunucu online, discord server online, discord sunucu oy, discord server vote, discord sunucu oy ver, discord server vote now, discord sunucu oy verme, discord server voting, discord sunucu katıl, discord server join, discord sunucu davet, discord server invite, discord sunucu link, discord server link, discord sunucu türk, discord server turkish, discord sunucu türkiye, discord server turkey, discord sunucu türkçe, discord server turkish language, discord türk, discord tr, discord türkiye, discord turkey, discord türkçe, discord turkish, discord oy verme botu, discord vote bot türkçe, discord bot türk, discord bot türkiye, discord bot türkçe, discord sunucu oy botu, discord server vote bot, discord oy sistemi, discord voting system, discord oy platformu, discord voting platform, discord sunucu tanıtım, discord server promotion, discord sunucu reklam, discord server advertisement, discord sunucu yorum, discord server comment, discord sunucu puan, discord server rating, discord sunucu sıralama, discord server ranking, discord sunucu top, discord server top, discord sunucu en iyi, discord server best, discord sunucu popüler, discord server popular, discord sunucu aktif, discord server active, discord sunucu büyük, discord server large, discord sunucu küçük, discord server small, discord sunucu orta, discord server medium, discord sunucu genel, discord server public, discord sunucu özel, discord server private, discord sunucu oyun, discord server game, discord sunucu eğlence, discord server entertainment, discord sunucu sohbet, discord server chat, discord sunucu müzik, discord server music, discord sunucu teknoloji, discord server technology, discord sunucu programlama, discord server programming, discord sunucu tasarım, discord server design, discord sunucu sanat, discord server art, discord sunucu eğitim, discord server education, discord sunucu iş, discord server business, discord sunucu oyunlar, discord server games, discord sunucu minecraft, discord server minecraft, discord sunucu valorant, discord server valorant, discord sunucu csgo, discord server csgo, discord sunucu lol, discord server lol, discord sunucu fortnite, discord server fortnite, discord sunucu apex, discord server apex, discord sunucu gta, discord server gta, discord sunucu roblox, discord server roblox, discord sunucu among us, discord server among us, discord sunucu fivem, discord server fivem, discord sunucu roleplay, discord server roleplay, discord sunucu rp, discord server rp`}
        url={`https://dcoyver.com/sunucu/${server.guildId}`}
        image={server.bannerURL || (server.iconURL ? `${server.iconURL}?size=1024` : 'https://dcoyver.com/og-image.png')}
      />
      <div className="min-h-screen page-transition relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-black"></div>
        {/* Subtle animated gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-transparent to-blue-900/5 animate-pulse"></div>
      </div>

      {/* Premium Banner - Hero Section */}
      <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden group">
        {/* Banner Image with Premium Effects */}
        {server.bannerURL ? (
          <>
            <img 
              src={server.bannerURL.includes('?size=') ? server.bannerURL.replace(/\?size=\d+/, '?size=2048') : `${server.bannerURL}?size=2048`} 
              alt={server.name}
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110" 
              loading="eager"
              onError={(e) => {
                e.target.src = '/banner.png'
              }}
            />
            {/* Animated overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            {/* Hafif Gizlenme Efekti - Siyah Tema */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/40"></div>
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </>
        ) : (
          <>
            {/* Premium Fallback Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_70%)] animate-pulse"></div>
            </div>
          </>
        )}
        
        {/* Premium Online/Member Count Badge */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex items-center gap-2 bg-black/90 backdrop-blur-2xl border border-white/20 px-3 py-1.5 rounded-xl shadow-lg group hover:border-white/40 hover:bg-black/95 hover:scale-105 transition-all duration-300 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
              <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
            </div>
            <span className="text-green-400 font-bold text-xs sm:text-sm group-hover:text-green-300 transition-colors duration-300">{server.onlineCount || 0}</span>
          </div>
          <div className="w-px h-4 bg-white/20 group-hover:bg-white/30 transition-colors duration-300"></div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-gray-300 group-hover:text-white group-hover:rotate-12 transition-all duration-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span className="text-white font-bold text-xs sm:text-sm group-hover:scale-110 transition-transform duration-300">{server.memberCount?.toLocaleString('tr-TR')}</span>
          </div>
        </div>

      </div>

      {/* Content - Premium Layout */}
      <div className="container mx-auto px-3 sm:px-4 pb-2 -mt-20 sm:-mt-24 md:-mt-28 relative z-10">
        {/* Server Name & Info Section - Premium Design */}
        <div className="mb-3 server-name-section pt-20 sm:pt-24 md:pt-28 animate-fadeIn">
          <div className="flex items-center gap-3 mb-2">
            {/* Premium Icon with Glow Effect */}
            <div className="relative flex-shrink-0 group">
              {server.iconURL ? (
                <>
                  <img
                    src={server.iconURL.includes('?size=') ? server.iconURL.replace(/\?size=\d+/, '?size=512') : `${server.iconURL}?size=512`}
                    alt={server.name}
                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-black bg-black shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-purple-500/20"
                    loading="eager"
                    onError={(e) => {
                      e.target.src = 'https://cdn.discordapp.com/embed/avatars/2.png'
                    }}
                  />
                </>
              ) : (
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-black bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center text-xl sm:text-2xl font-black text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-purple-500/20">
                  {server.name.charAt(0)}
                </div>
              )}
              
              {/* Premium Verified Badge */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-2 border-black shadow-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight mb-1 drop-shadow-lg hover:drop-shadow-xl transition-all duration-300">
                {server.name}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-gray-800/90 to-gray-900/90 backdrop-blur-sm border border-gray-700/50 text-white hover:border-gray-600/70 hover:from-gray-800/95 hover:to-gray-900/95 transition-all duration-300 hover:scale-105">
                  {categoryNames[server.category] || 'Genel'}
                </span>
                {server.guildCreatedAt && (
                  <div className="flex items-center gap-1 text-gray-300 bg-gray-900/70 backdrop-blur-sm px-2 py-1 rounded-full border border-gray-800/50 hover:border-gray-700/70 hover:bg-gray-900/80 transition-all duration-300 hover:scale-105">
                    <svg className="w-3 h-3 transition-transform duration-300 hover:rotate-12" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-medium">
                      {new Date(server.guildCreatedAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout - Premium Design */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 animate-fadeIn" style={{ animationDelay: '0.15s' }}>
          {/* Left - Description & Additional Info */}
          <div className="lg:col-span-2 space-y-2">
            {/* Description Card */}
            <div className="bg-black/60 backdrop-blur-sm border border-gray-800/50 rounded-lg p-3 hover:border-purple-500/50 hover:bg-black/70 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:scale-[1.01] animate-fadeIn group" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-start gap-2 mb-1">
                <svg className="w-3 h-3 text-purple-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-xs sm:text-sm group-hover:text-gray-200 transition-colors duration-300 flex-1">
                  {server.isSetup === false ? (
                    <span className="text-yellow-400 font-semibold animate-pulse">⚠️ Henüz kurulu değil</span>
                  ) : server.description ? (
                    server.description
                  ) : (
                    <span className="text-gray-500 italic">Açıklama yok</span>
                  )}
                </p>
              </div>
            </div>

            {/* Owner Info Card */}
            {server.ownerInfo && (server.ownerInfo.id || server.ownerId) && (
              <a
                href={`https://discord.com/users/${server.ownerInfo.id || server.ownerId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-black/60 backdrop-blur-sm border border-gray-800/50 rounded-lg p-3 hover:border-blue-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] animate-fadeIn group"
                style={{ animationDelay: '0.2s' }}
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <img 
                      src={server.ownerInfo.avatarURL || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                      alt={server.ownerInfo.globalName || server.ownerInfo.username || 'Kurucu'}
                      className="w-8 h-8 rounded-lg border border-gray-800 transition-all duration-300 group-hover:scale-110 group-hover:border-blue-500/50"
                      onError={(e) => {
                        e.target.src = 'https://cdn.discordapp.com/embed/avatars/0.png'
                      }}
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-gray-900 animate-pulse"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors duration-300">
                      {server.ownerInfo.globalName || server.ownerInfo.username || 'Bilinmiyor'}
                    </h3>
                    <p className="text-gray-400 text-xs group-hover:text-gray-300 transition-colors duration-300">Kurucu</p>
                  </div>
                  <svg className="w-3 h-3 text-gray-500 group-hover:text-blue-400 transition-all duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            )}

            {/* Comments Section */}
            <div className="bg-black/60 backdrop-blur-sm border border-gray-800/50 rounded-lg overflow-hidden hover:border-purple-500/50 hover:bg-black/70 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
              {/* Header */}
              <div className="border-b border-gray-800/50 px-3 py-2 hover:border-gray-700/50 transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-purple-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-xs font-semibold text-gray-300 hover:text-purple-400 transition-colors duration-300">
                      {comments.length} Yorum
                    </span>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="p-3">
                {loadingComments ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="relative">
                      <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <div className="absolute inset-0 w-5 h-5 border-2 border-purple-500/30 border-r-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    </div>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-6 animate-fadeIn">
                    <div className="w-12 h-12 mx-auto mb-2 bg-gray-800/30 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-xs">
                      Henüz yorum yok
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {comments.map((comment, index) => (
                      <div
                        key={comment._id || comment.id}
                        className="bg-gray-900/40 border border-gray-800/50 rounded-lg p-2.5 hover:border-purple-500/50 hover:bg-gray-900/70 hover:scale-[1.02] transition-all duration-300 animate-fadeIn group relative"
                        style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                      >
                        {/* User Info */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="relative group/avatar">
                            <img
                              src={getAvatarURL(comment.avatar || comment.avatarUrl, comment.userId)}
                              alt={comment.username || 'Kullanıcı'}
                              className="w-6 h-6 rounded-full border border-gray-700 group-hover/avatar:border-purple-500/50 transition-all duration-300 group-hover/avatar:scale-110"
                              onError={(e) => {
                                const avatarIndex = comment.userId ? (parseInt(comment.userId) % 5) : 0
                                e.target.src = `https://cdn.discordapp.com/embed/avatars/${avatarIndex}.png`
                              }}
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-gray-900 animate-pulse"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-xs truncate group-hover:text-purple-400 transition-colors duration-300">
                              {comment.username || 'Anonim'}
                            </p>
                            <p className="text-gray-500 text-xs group-hover:text-gray-400 transition-colors duration-300">{formatDate(comment.createdAt)}</p>
                          </div>
                          {/* Admin Delete Button */}
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteComment(comment._id || comment.id)}
                              disabled={deletingComment === (comment._id || comment.id)}
                              className="p-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500 rounded-lg transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed group/delete"
                              title={localStorage.getItem('language') === 'en' ? 'Delete comment' : 'Yorumu sil'}
                            >
                              {deletingComment === (comment._id || comment.id) ? (
                                <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg className="w-3.5 h-3.5 text-red-400 group-hover/delete:text-red-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Comment Content */}
                        <p className="text-gray-300 text-xs mb-1.5 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                          {comment.content}
                        </p>

                        {/* Rating */}
                        {comment.rating && (
                          <div className="flex items-center gap-1">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-xs transition-all duration-300 ${
                                    star <= (comment.rating || 5)
                                      ? 'text-yellow-400 group-hover:scale-110'
                                      : 'text-gray-700'
                                  }`}
                                >
                                  ⭐
                                </span>
                              ))}
                            </div>
                            <span className="text-gray-500 text-xs group-hover:text-gray-400 transition-colors duration-300">({comment.rating}/5)</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right - Stats & Actions */}
          <div className="lg:col-span-1 space-y-2">
            {/* Stats Card */}
            <div className="bg-black/60 backdrop-blur-sm border border-gray-800/50 rounded-lg p-3 hover:border-gray-700/70 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.01] animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              <div className="space-y-2">
                {/* Stats Header */}
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-800/30">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-xs font-bold text-gray-300">İstatistikler</span>
                </div>
                <div className="flex items-center justify-between py-2.5 px-3 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg hover:border-blue-500/40 hover:from-blue-500/15 hover:to-blue-600/15 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 group cursor-default hover:scale-[1.02]">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50 group-hover:shadow-blue-500/80"></div>
                      <div className="absolute inset-0 w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <span className="font-semibold text-xs text-gray-300 group-hover:text-blue-400 transition-colors duration-300">Online</span>
                  </div>
                  <span className="text-blue-400 font-bold text-sm transition-all duration-300 group-hover:scale-110 group-hover:text-blue-300">{server.onlineCount || 0}</span>
                </div>

                <div className="flex items-center justify-between py-2.5 px-3 bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-gray-800/50 rounded-lg hover:border-gray-700/70 hover:from-gray-900/70 hover:to-gray-800/70 hover:shadow-lg transition-all duration-300 group cursor-default hover:scale-[1.02]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 bg-gray-800/50 rounded group-hover:bg-gray-700/50 transition-all duration-300 group-hover:rotate-12">
                      <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                    </div>
                    <span className="font-semibold text-xs text-gray-300 group-hover:text-white transition-colors duration-300">Üye</span>
                  </div>
                  <span className="text-white font-bold text-sm transition-all duration-300 group-hover:scale-110">{server.memberCount?.toLocaleString('tr-TR') || 0}</span>
                </div>

                <div className="flex items-center justify-between py-2.5 px-3 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-lg hover:border-yellow-500/40 hover:from-yellow-500/15 hover:to-yellow-600/15 hover:shadow-lg hover:shadow-yellow-500/20 transition-all duration-300 group cursor-default hover:scale-[1.02]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 bg-yellow-500/10 rounded group-hover:bg-yellow-500/20 transition-all duration-300 group-hover:rotate-12">
                      <svg className="w-3.5 h-3.5 text-yellow-400 group-hover:text-yellow-300 transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <span className="font-semibold text-xs text-gray-300 group-hover:text-yellow-400 transition-colors duration-300">Oy</span>
                  </div>
                  <span className="text-yellow-400 font-bold text-sm transition-all duration-300 group-hover:scale-110 group-hover:text-yellow-300">{server.totalVotes || 0}</span>
                </div>

                <div className="flex items-center justify-between py-2.5 px-3 bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg hover:border-green-500/40 hover:from-green-500/15 hover:to-green-600/15 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 group cursor-default hover:scale-[1.02]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 bg-green-500/10 rounded group-hover:bg-green-500/20 transition-all duration-300 group-hover:rotate-12">
                      <svg className="w-3.5 h-3.5 text-green-400 group-hover:text-green-300 transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      </svg>
                    </div>
                    <span className="font-semibold text-xs text-gray-300 group-hover:text-green-400 transition-colors duration-300">Ses</span>
                  </div>
                  <span className="text-green-400 font-bold text-sm transition-all duration-300 group-hover:scale-110 group-hover:text-green-300">{server.voiceCount || 0}</span>
                </div>

                <div className="flex items-center justify-between py-2.5 px-3 bg-gradient-to-r from-pink-500/10 to-pink-600/10 border border-pink-500/20 rounded-lg hover:border-pink-500/40 hover:from-pink-500/15 hover:to-pink-600/15 hover:shadow-lg hover:shadow-pink-500/20 transition-all duration-300 group cursor-default hover:scale-[1.02]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 bg-pink-500/10 rounded group-hover:bg-pink-500/20 transition-all duration-300 group-hover:rotate-12">
                      <svg className="w-3.5 h-3.5 text-pink-400 group-hover:text-pink-300 transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-semibold text-xs text-gray-300 group-hover:text-pink-400 transition-colors duration-300">Boost</span>
                  </div>
                  <span className="text-pink-400 font-bold text-sm transition-all duration-300 group-hover:scale-110 group-hover:text-pink-300">{server.boostCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Vote Button Card */}
            <div className="bg-black/60 backdrop-blur-sm border border-gray-800/50 rounded-lg p-3 space-y-2 hover:border-yellow-500/50 hover:bg-black/70 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20 hover:scale-[1.01] animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              {!showCaptcha ? (
                <>
                  <button
                    onClick={handleVote}
                    disabled={voting || !user}
                    className="relative w-full px-4 py-2.5 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-xs text-white transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] hover:shadow-lg hover:shadow-yellow-500/30 active:scale-[0.98] overflow-hidden group/btn"
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                    {voting ? (
                      <>
                        <div className="relative z-10 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="relative z-10">Oy veriliyor...</span>
                      </>
                    ) : (
                      <>
                        <svg className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover/btn:rotate-12" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a1 1 0 001.367.93l4.236-2.118a1 1 0 00.633-.923v-3.584a1 1 0 00-.633-.923L7.367 9.403a1 1 0 00-1.367.93zM16.5 10a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-3 0v-3a1.5 1.5 0 011.5-1.5z" />
                        </svg>
                        <span className="relative z-10">Oy Ver</span>
                      </>
                    )}
                  </button>
                  
                  {server.inviteURL ? (
                    <a
                      href={server.inviteURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold text-xs text-white transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] overflow-hidden group/link"
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/link:translate-x-full transition-transform duration-1000"></div>
                      <svg className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                      <span className="relative z-10">Sunucuya Git</span>
                    </a>
                  ) : (
                    <div className="w-full px-4 py-2.5 bg-gray-800 rounded-lg font-semibold text-xs text-gray-400 flex items-center justify-center gap-2">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Davet linki yok</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-3 bg-gray-900/40 border border-gray-800/50 rounded-lg hover:border-yellow-500/30 transition-all duration-300">
                  <p className="text-white text-center mb-2 font-semibold text-xs animate-pulse">
                    {captcha.num1} + {captcha.num2} = ?
                  </p>
                  <input
                    type="number"
                    value={captcha.answer}
                    onChange={(e) => setCaptcha({ ...captcha, answer: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && submitVote()}
                    placeholder="Cevap"
                    className="w-full px-3 py-2 bg-black/60 border border-gray-800/50 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 focus:bg-black/80 mb-2 transition-all duration-300"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={submitVote}
                      className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-xs font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/30 active:scale-95"
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => setShowCaptcha(false)}
                      className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-semibold text-white transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}

