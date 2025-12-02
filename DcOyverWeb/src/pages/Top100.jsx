import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import SEO from '../components/SEO'
import { useTranslation } from '../lib/translations'

axios.defaults.withCredentials = true

export default function Top100() {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('votes')
  const [t, setT] = useState(() => useTranslation())

  useEffect(() => {
    const handleLanguageChange = () => {
      setT(() => useTranslation())
    }
    
    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  useEffect(() => {
    fetchServers()
    
    // 7 saniyede bir otomatik refresh
    const interval = setInterval(() => {
      fetchServers()
    }, 7000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchServers = async () => {
    try {
      const { data } = await axios.get('/api/guilds')
      setServers(data)
    } catch (error) {
      console.error('Sunucular yüklenemedi:', error)
    } finally {
      setLoading(false)
    }
  }

  const sortedServers = [...servers].sort((a, b) => {
    switch (sortBy) {
      case 'votes':
        return (b.totalVotes || 0) - (a.totalVotes || 0)
      case 'members':
        return (b.memberCount || 0) - (a.memberCount || 0)
      case 'online':
        return (b.onlineCount || 0) - (a.onlineCount || 0)
      case 'voice':
        return (b.voiceCount || 0) - (a.voiceCount || 0)
      case 'voiceMuted':
        return (b.voiceMutedCount || 0) - (a.voiceMutedCount || 0)
      case 'voiceUnmuted':
        return (b.voiceUnmutedCount || 0) - (a.voiceUnmutedCount || 0)
      case 'voiceDeafened':
        return (b.voiceDeafenedCount || 0) - (a.voiceDeafenedCount || 0)
      case 'voiceUndeafened':
        return (b.voiceUndeafenedCount || 0) - (a.voiceUndeafenedCount || 0)
      case 'camera':
        return (b.cameraCount || 0) - (a.cameraCount || 0)
      case 'stream':
        return (b.streamCount || 0) - (a.streamCount || 0)
      default:
        return 0
    }
  }).slice(0, 100)

  const tabs = [
    { id: 'votes', name: localStorage.getItem('language') === 'en' ? 'Top 100 Votes' : 'Top 100 Oylar', icon: '❤️', emoji: null },
    { id: 'members', name: localStorage.getItem('language') === 'en' ? 'Top 100 Members' : 'Top 100 Üyeler', icon: null, emoji: '/emoji/member.png' },
    { id: 'online', name: localStorage.getItem('language') === 'en' ? 'Top 100 Online' : 'Top 100 Online', icon: '🟢', emoji: null },
    { id: 'voice', name: localStorage.getItem('language') === 'en' ? 'Top 100 Voice' : 'Top 100 Sesler', icon: null, emoji: '/emoji/voice.webp' },
    { id: 'voiceMuted', name: localStorage.getItem('language') === 'en' ? 'Top 100 Mic Off' : 'Top 100 Mic Kapalı', icon: null, emoji: '/emoji/MicKapalı.ico' },
    { id: 'voiceUnmuted', name: localStorage.getItem('language') === 'en' ? 'Top 100 Mic On' : 'Top 100 Mic Açık', icon: null, emoji: '/emoji/MicAçık.ico' },
    { id: 'voiceDeafened', name: localStorage.getItem('language') === 'en' ? 'Top 100 Deafened' : 'Top 100 Kulaklık Kapalı', icon: null, emoji: '/emoji/KulaklıkKapalı_1.ico' },
    { id: 'voiceUndeafened', name: localStorage.getItem('language') === 'en' ? 'Top 100 Undeafened' : 'Top 100 Kulaklık Açık', icon: null, emoji: '/emoji/KulaklıkAçık_1.ico' },
    { id: 'camera', name: localStorage.getItem('language') === 'en' ? 'Top 100 Camera' : 'Top 100 Kamera', icon: null, emoji: '/emoji/Kamera_1.ico' },
    { id: 'stream', name: localStorage.getItem('language') === 'en' ? 'Top 100 Stream' : 'Top 100 Yayın', icon: null, emoji: '/emoji/Yayin.ico' }
  ]

  const getRankBadge = (index) => {
    if (index === 0) {
      return (
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative w-14 h-14 rounded-xl bg-gray-800 border-2 border-yellow-500/40 group-hover:border-yellow-400/60 flex items-center justify-center font-bold text-xl shadow-lg shadow-yellow-500/20 transition-all duration-500">
            <img src="/emoji/tac.webp" alt="1. Sıra" className="w-10 h-10" />
          </div>
        </div>
      )
    } else if (index === 1) {
      return (
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-400/20 to-gray-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative w-14 h-14 rounded-xl bg-gray-800 border-2 border-gray-500/40 group-hover:border-gray-400/60 text-white flex items-center justify-center font-bold text-xl shadow-lg transition-all duration-500">
            🥈
          </div>
        </div>
      )
    } else if (index === 2) {
      return (
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-orange-700/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative w-14 h-14 rounded-xl bg-gray-800 border-2 border-orange-600/40 group-hover:border-orange-500/60 text-white flex items-center justify-center font-bold text-xl shadow-lg transition-all duration-500">
            🥉
          </div>
        </div>
      )
    } else {
      return (
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700/50 group-hover:border-gray-600/70 flex items-center justify-center font-bold text-lg text-white shadow-lg transition-all duration-500">
            {index + 1}
          </div>
        </div>
      )
    }
  }

  // Sayı formatlama
  const formatNumber = (num) => {
    if (!num) return '0'
    return num.toLocaleString('tr-TR')
  }

  return (
    <>
      <SEO 
        title="Top 100 Discord Sunucuları | En Popüler Discord Server Listesi | En Çok Oy Alan Discord Sunucuları - DcOyver.com"
        description="En popüler 100 Discord sunucusunu keşfet. En çok oy alan, en aktif Discord sunucuları listesi."
        url="https://dcoyver.com/top100"
      />
      <div className="min-h-screen py-8 page-transition relative overflow-hidden bg-black">
        {/* Premium Animated Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-950 via-black to-gray-950"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-900/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          {/* Premium Header */}
          <div className="text-center mb-12">
            <div className="inline-block relative">
              <h1 className="text-5xl sm:text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-white">
                {t('top100.title')}
              </h1>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
            </div>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mt-6">
              {t('top100.subtitle')}
            </p>
          </div>

          {/* Premium Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSortBy(tab.id)}
                className={`group relative px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 overflow-hidden ${
                  sortBy === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-2 border-purple-500 shadow-lg shadow-purple-500/50 scale-105'
                    : 'bg-gray-900/90 text-gray-400 hover:text-white border-2 border-gray-800 hover:border-gray-700 hover:bg-gray-800/90 backdrop-blur-sm'
                }`}
              >
                {sortBy === tab.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 animate-pulse"></div>
                )}
                {tab.emoji ? (
                  <img src={tab.emoji} alt={tab.name} className="w-5 h-5 relative z-10" />
                ) : (
                  <span className="text-lg relative z-10">{tab.icon}</span>
                )}
                <span className="relative z-10">{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Premium List */}
          {loading ? (
            <div className="text-center py-32">
              <div className="inline-block relative">
                <div className="w-20 h-20 border-4 border-gray-800 border-t-purple-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-indigo-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <p className="text-gray-400 mt-6 text-lg">Yükleniyor...</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-3">
              {sortedServers.map((server, index) => {
                const rank = index + 1
                
                return (
                  <Link
                    key={server.guildId}
                    to={`/sunucu/${server.guildId}`}
                    className="group block relative overflow-hidden rounded-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    {/* Premium Gradient Background - Tüm sunucular aynı görünümde */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-gray-900/95 group-hover:from-gray-800/95 group-hover:via-gray-700/90 group-hover:to-gray-800/95 transition-all duration-500"></div>
                    
                    {/* Premium Golden Border - Görseldeki gibi */}
                    <div className="absolute inset-0 border-2 border-yellow-600/40 group-hover:border-yellow-500/60 rounded-xl transition-all duration-500"></div>
                    
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                    
                    {/* Content */}
                    <div className="relative p-5">
                      <div className="flex items-center gap-5">
                        {/* Rank Badge - Premium */}
                        {getRankBadge(index)}

                        {/* Server Icon - Premium */}
                        <div className="flex-shrink-0 relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          {server.iconURL ? (
                            <img
                              src={server.iconURL}
                              alt={server.name}
                              className="relative w-16 h-16 rounded-xl border-2 border-yellow-600/30 group-hover:border-yellow-500/50 transition-all duration-500 shadow-lg group-hover:shadow-xl group-hover:scale-110"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex'
                                }
                              }}
                            />
                          ) : null}
                          {!server.iconURL && (
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-2xl font-bold border-2 border-yellow-600/30 group-hover:border-yellow-500/50 shadow-lg group-hover:shadow-xl transition-all duration-500">
                              {server.name.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* Server Name - Açıklama YOK */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors duration-300 truncate">
                            {server.name}
                          </h3>
                        </div>

                        {/* Statistics - Yan yana (Horizontal), görseldeki gibi */}
                        <div className="flex-shrink-0 flex items-center gap-4">
                          {/* Votes (Oy) - Yıldız ikonu */}
                          <div className="flex items-center gap-1.5 group/stat">
                            <span className="text-yellow-400 text-base font-bold">★</span>
                            <span className="text-red-400 font-bold text-sm whitespace-nowrap group-hover/stat:text-red-300 transition-colors duration-300">{server.totalVotes || 0}</span>
                          </div>

                          {/* Members (Üye) */}
                          <div className="flex items-center gap-1.5 group/stat">
                            <img src="/emoji/member.png" alt="Üye" className="w-4 h-4" />
                            <span className="text-gray-300 font-bold text-sm whitespace-nowrap group-hover/stat:text-white transition-colors duration-300">{formatNumber(server.memberCount)}</span>
                          </div>

                          {/* Online */}
                          <div className="flex items-center gap-1.5 group/stat">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-400 font-bold text-sm whitespace-nowrap group-hover/stat:text-green-300 transition-colors duration-300">{server.onlineCount || 0}</span>
                          </div>

                          {/* Voice (Ses) */}
                          <div className="flex items-center gap-1.5 group/stat">
                            <img src="/emoji/voice.webp" alt="Ses" className="w-4 h-4" />
                            <span className="text-purple-400 font-bold text-sm whitespace-nowrap group-hover/stat:text-purple-300 transition-colors duration-300">{server.voiceCount || 0}</span>
                          </div>

                          {/* Mic Kapalı */}
                          <div className="flex items-center gap-1.5 group/stat">
                            <img src="/emoji/MicKapalı.ico" alt="Mic Kapalı" className="w-4 h-4" />
                            <span className="text-red-400 font-bold text-sm whitespace-nowrap group-hover/stat:text-red-300 transition-colors duration-300">{server.voiceMutedCount || 0}</span>
                          </div>

                          {/* Mic Açık */}
                          <div className="flex items-center gap-1.5 group/stat">
                            <img src="/emoji/MicAçık.ico" alt="Mic Açık" className="w-4 h-4" />
                            <span className="text-green-400 font-bold text-sm whitespace-nowrap group-hover/stat:text-green-300 transition-colors duration-300">{server.voiceUnmutedCount || 0}</span>
                          </div>

                          {/* Kulaklık Kapalı */}
                          <div className="flex items-center gap-1.5 group/stat">
                            <img src="/emoji/KulaklıkKapalı_1.ico" alt="Kulaklık Kapalı" className="w-4 h-4" />
                            <span className="text-orange-400 font-bold text-sm whitespace-nowrap group-hover/stat:text-orange-300 transition-colors duration-300">{server.voiceDeafenedCount || 0}</span>
                          </div>

                          {/* Kulaklık Açık */}
                          <div className="flex items-center gap-1.5 group/stat">
                            <img src="/emoji/KulaklıkAçık_1.ico" alt="Kulaklık Açık" className="w-4 h-4" />
                            <span className="text-blue-400 font-bold text-sm whitespace-nowrap group-hover/stat:text-blue-300 transition-colors duration-300">{server.voiceUndeafenedCount || 0}</span>
                          </div>

                          {/* Camera (Kamera) */}
                          <div className="flex items-center gap-1.5 group/stat">
                            <img src="/emoji/Kamera_1.ico" alt="Kamera" className="w-4 h-4" />
                            <span className="text-orange-400 font-bold text-sm whitespace-nowrap group-hover/stat:text-orange-300 transition-colors duration-300">{server.cameraCount || 0}</span>
                          </div>

                          {/* Stream (Yayın) */}
                          <div className="flex items-center gap-1.5 group/stat">
                            <img src="/emoji/Yayin.ico" alt="Yayın" className="w-4 h-4" />
                            <span className="text-purple-400 font-bold text-sm whitespace-nowrap group-hover/stat:text-purple-300 transition-colors duration-300">{server.streamCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
