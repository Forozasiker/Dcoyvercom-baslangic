import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import SEO from '../components/SEO'
import PremiumServerCard from '../components/PremiumServerCard'

axios.defaults.withCredentials = true

export default function ReklamYonetim() {
  const navigate = useNavigate()
  const [guilds, setGuilds] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [selectedGuild, setSelectedGuild] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [showExtendModal, setShowExtendModal] = useState(false)
  const [extendAdId, setExtendAdId] = useState(null)
  const [extendDuration, setExtendDuration] = useState(null)

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    try {
      const { data } = await axios.get('/api/auth/user')
      if (data && data.isAdmin) {
        setIsAdmin(true)
        await fetchGuilds()
      } else {
        // Admin değilse ana sayfaya yönlendir
        navigate('/', { replace: true })
        setLoading(false)
      }
    } catch (error) {
      // Hata durumunda ana sayfaya yönlendir
      navigate('/', { replace: true })
      setLoading(false)
    }
  }

  const fetchGuilds = async () => {
    try {
      const { data } = await axios.get('/api/admin/guilds')
      setGuilds(data)
    } catch (error) {
      console.error('Guilds fetch error:', error)
      if (error.response?.status === 403) {
        navigate('/')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDefineAd = (guild) => {
    setSelectedGuild(guild)
    setSelectedDuration(null)
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!selectedDuration) return
    
    setSubmitting(true)
    try {
      await axios.post('/api/admin/advertisements', {
        guildId: selectedGuild.guildId,
        duration: selectedDuration
      })
      setShowModal(false)
      fetchGuilds()
    } catch (error) {
      console.error('Ad create error:', error)
      alert(error.response?.data?.error || 'Hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEndAd = async (adId) => {
    if (!confirm('Reklamı bitirmek istediğinize emin misiniz?')) return
    
    try {
      await axios.delete(`/api/admin/advertisements/${adId}`)
      fetchGuilds()
    } catch (error) {
      console.error('Ad end error:', error)
      alert(error.response?.data?.error || 'Hata oluştu')
    }
  }

  const handleExtendAd = async (adId, duration) => {
    try {
      await axios.put(`/api/admin/advertisements/${adId}/extend`, { duration })
      setShowExtendModal(false)
      setExtendAdId(null)
      setExtendDuration(null)
      setOpenMenuId(null)
      fetchGuilds()
    } catch (error) {
      console.error('Ad extend error:', error)
      alert(error.response?.data?.error || 'Hata oluştu')
    }
  }

  const handleExtendClick = (adId) => {
    setExtendAdId(adId)
    setExtendDuration(null)
    setShowExtendModal(true)
    setOpenMenuId(null)
  }

  const handleExtendSubmit = () => {
    if (!extendDuration) return
    handleExtendAd(extendAdId, extendDuration)
  }

  const durations = [
    { value: '5min', label: '5 Dakika' },
    { value: '1hour', label: '1 Saat' },
    { value: '1week', label: '1 Hafta' },
    { value: '1month', label: '1 Ay' },
    { value: '1year', label: '1 Yıl' }
  ]

  // Sponsor ve sponsor olmayan sunucuları ayır
  const sponsorGuilds = guilds.filter(guild => guild.hasActiveAd)
  const nonSponsorGuilds = guilds.filter(guild => !guild.hasActiveAd)

  // Kalan süreyi hesapla
  const getTimeRemaining = (endDate) => {
    if (!endDate) return ''
    const now = new Date()
    const end = new Date(endDate)
    const diff = end - now

    if (diff <= 0) {
      return localStorage.getItem('language') === 'en' ? 'Expired' : 'Süresi Doldu'
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
      return `${days} ${localStorage.getItem('language') === 'en' ? 'day' : 'gün'} ${hours} ${localStorage.getItem('language') === 'en' ? 'hour' : 'saat'}`
    } else if (hours > 0) {
      return `${hours} ${localStorage.getItem('language') === 'en' ? 'hour' : 'saat'} ${minutes} ${localStorage.getItem('language') === 'en' ? 'min' : 'dakika'}`
    } else {
      return `${minutes} ${localStorage.getItem('language') === 'en' ? 'min' : 'dakika'}`
    }
  }

  if (loading) {
    return (
      <>
        <SEO
          title="Reklam Yönetim | DcOyver.com"
          description="Reklam yönetim paneli"
        />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Yükleniyor...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SEO
        title="Reklam Yönetim | DcOyver.com"
        description="Reklam yönetim paneli"
      />
      <div className="min-h-screen bg-black dark:bg-black bg-gray-50 relative overflow-hidden transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 relative z-10 py-8">
          <h1 className="text-4xl font-bold text-white dark:text-white text-gray-900 mb-8 text-center">
            {localStorage.getItem('language') === 'en' ? 'Ad Management' : 'Reklam Yönetim'}
          </h1>

          {/* Sponsor Sunucular Bölümü - Üstte */}
          {sponsorGuilds.length > 0 && (
            <div className="w-full mb-12">
              <div className="mb-6 sm:mb-8 md:mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white dark:text-white text-gray-900 mb-2 flex items-center gap-3">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-7 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{localStorage.getItem('language') === 'en' ? 'Sponsored Servers' : 'Sponsor Sunucular'}</span>
                </h2>
                <p className="text-gray-400 dark:text-gray-400 text-gray-600 text-sm sm:text-base">{localStorage.getItem('language') === 'en' ? 'Manage sponsored servers' : 'Sponsor sunucuları yönetin'}</p>
              </div>
              <div className="flex flex-col items-center gap-6 sm:gap-8">
                {Array.from({ length: Math.ceil(sponsorGuilds.length / 4) }).map((_, rowIndex) => {
                  const rowServers = sponsorGuilds.slice(rowIndex * 4, (rowIndex + 1) * 4)
                
                return (
                  <div 
                    key={rowIndex}
                    className="server-card-row flex items-center justify-center gap-4 sm:gap-6 w-full max-w-7xl mx-auto px-4"
                  >
                    {rowServers.map((guild, colIndex) => {
                      const globalIndex = rowIndex * 4 + colIndex
                      const isSmall = colIndex === 0 || colIndex === 3
                      const scaleClass = isSmall ? 'lg:scale-90' : 'lg:scale-100'
                      
                      // Guild verilerini PremiumServerCard formatına çevir
                      const serverData = {
                        guildId: guild.guildId,
                        name: guild.name,
                        description: guild.description,
                        iconURL: guild.iconURL,
                        bannerURL: guild.bannerURL,
                        inviteURL: guild.inviteURL,
                        memberCount: guild.memberCount,
                        onlineCount: guild.onlineCount || 0,
                        voiceCount: guild.voiceCount || 0,
                        totalVotes: guild.totalVotes || 0,
                        category: guild.category,
                        ownerInfo: guild.ownerInfo || null
                      }
                      
                      const adData = guild.hasActiveAd ? {
                        endDate: guild.activeAd.endDate,
                        _id: guild.activeAd._id
                      } : null
                      
                      const timeRemaining = guild.hasActiveAd ? getTimeRemaining(guild.activeAd.endDate) : ''
                      
                      return (
                        <div
                          key={guild.guildId}
                          className={`flex-1 max-w-[280px] ${scaleClass} transition-transform duration-300 animate-fadeIn relative`}
                          style={{ animationDelay: `${globalIndex * 0.05}s` }}
                        >
                          {/* Süre Bilgisi - Sponsor sunucuların üstünde */}
                          {guild.hasActiveAd && timeRemaining && (
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-40 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-amber-300/50 whitespace-nowrap">
                              ⏱️ {timeRemaining}
                            </div>
                          )}
                          
                          {/* 3 Nokta Menü - Sağ Üst (Premium Badge'in yanında) */}
                          <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault()
                                  setOpenMenuId(openMenuId === guild.guildId ? null : guild.guildId)
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-black/70 hover:bg-black/90 backdrop-blur-md rounded-full border border-white/30 transition-all shadow-lg"
                              >
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                              
                              {/* Menü Dropdown */}
                              {openMenuId === guild.guildId && (
                                <div className="absolute right-0 top-10 w-48 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                                  {guild.hasActiveAd ? (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          e.preventDefault()
                                          handleExtendClick(guild.activeAd._id)
                                        }}
                                        className="w-full px-4 py-3 text-left text-sm text-green-400 hover:bg-gray-800/50 transition-colors flex items-center gap-2"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        {localStorage.getItem('language') === 'en' ? 'Extend Ad' : 'Reklamı Uzat'}
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          e.preventDefault()
                                          handleEndAd(guild.activeAd._id)
                                        }}
                                        className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-gray-800/50 transition-colors flex items-center gap-2"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        {localStorage.getItem('language') === 'en' ? 'End Ad' : 'Reklamı Bitir'}
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        e.preventDefault()
                                        handleDefineAd(guild)
                                        setOpenMenuId(null)
                                      }}
                                      className="w-full px-4 py-3 text-left text-sm text-purple-400 hover:bg-gray-800/50 transition-colors flex items-center gap-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                      {localStorage.getItem('language') === 'en' ? 'Define Ad' : 'Reklam Tanımla'}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <PremiumServerCard 
                            server={serverData} 
                            advertisement={adData}
                          />
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
          )}

          {/* Sponsor Olmayan Sunucular Bölümü - Altta */}
          {nonSponsorGuilds.length > 0 && (
            <div className="w-full mt-12">
              <div className="mb-6 sm:mb-8 md:mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white dark:text-white text-gray-900 mb-2 flex items-center gap-3">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-7 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{localStorage.getItem('language') === 'en' ? 'Other Servers' : 'Diğer Sunucular'}</span>
                </h2>
                <p className="text-gray-400 dark:text-gray-400 text-gray-600 text-sm sm:text-base">{localStorage.getItem('language') === 'en' ? 'Servers without active advertisements' : 'Aktif reklamı olmayan sunucular'}</p>
              </div>
              <div className="flex flex-col items-center gap-6 sm:gap-8">
                {Array.from({ length: Math.ceil(nonSponsorGuilds.length / 4) }).map((_, rowIndex) => {
                  const rowServers = nonSponsorGuilds.slice(rowIndex * 4, (rowIndex + 1) * 4)
                  
                  return (
                    <div 
                      key={rowIndex}
                      className="server-card-row flex items-center justify-center gap-4 sm:gap-6 w-full max-w-7xl mx-auto px-4"
                    >
                      {rowServers.map((guild, colIndex) => {
                        const globalIndex = rowIndex * 4 + colIndex
                        const isSmall = colIndex === 0 || colIndex === 3
                        const scaleClass = isSmall ? 'lg:scale-90' : 'lg:scale-100'
                        
                        // Guild verilerini PremiumServerCard formatına çevir
                        const serverData = {
                          guildId: guild.guildId,
                          name: guild.name,
                          description: guild.description,
                          iconURL: guild.iconURL,
                          bannerURL: guild.bannerURL,
                          inviteURL: guild.inviteURL,
                          memberCount: guild.memberCount,
                          onlineCount: guild.onlineCount || 0,
                          voiceCount: guild.voiceCount || 0,
                          totalVotes: guild.totalVotes || 0,
                          category: guild.category,
                          ownerInfo: guild.ownerInfo || null
                        }
                        
                        const adData = guild.hasActiveAd ? {
                          endDate: guild.activeAd.endDate,
                          _id: guild.activeAd._id
                        } : null
                        
                        return (
                          <div
                            key={guild.guildId}
                            className={`flex-1 max-w-[280px] ${scaleClass} transition-transform duration-300 animate-fadeIn relative`}
                            style={{ animationDelay: `${globalIndex * 0.05}s` }}
                          >
                            {/* 3 Nokta Menü - Sağ Üst */}
                            <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    setOpenMenuId(openMenuId === guild.guildId ? null : guild.guildId)
                                  }}
                                  className="w-8 h-8 flex items-center justify-center bg-black/70 hover:bg-black/90 backdrop-blur-md rounded-full border border-white/30 transition-all shadow-lg"
                                >
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </button>
                                
                                {/* Menü Dropdown */}
                                {openMenuId === guild.guildId && (
                                  <div className="absolute right-0 top-10 w-48 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        e.preventDefault()
                                        handleDefineAd(guild)
                                        setOpenMenuId(null)
                                      }}
                                      className="w-full px-4 py-3 text-left text-sm text-purple-400 hover:bg-gray-800/50 transition-colors flex items-center gap-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                      {localStorage.getItem('language') === 'en' ? 'Define Ad' : 'Reklam Tanımla'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <PremiumServerCard 
                              server={serverData} 
                              advertisement={adData}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reklam Tanımla Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-800" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-4">
              {localStorage.getItem('language') === 'en' ? 'Define Ad' : 'Reklam Tanımla'} - {selectedGuild?.name}
            </h2>

            <div className="space-y-3 mb-6">
              {durations.map((duration) => (
                <button
                  key={duration.value}
                  onClick={() => setSelectedDuration(duration.value)}
                  className={`w-full px-4 py-3 rounded-lg transition-all text-left ${
                    selectedDuration === duration.value
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {duration.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                {localStorage.getItem('language') === 'en' ? 'Cancel' : 'İptal'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedDuration || submitting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (localStorage.getItem('language') === 'en' ? 'Defining...' : 'Tanımlanıyor...') : (localStorage.getItem('language') === 'en' ? 'Define' : 'Tanımla')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reklam Uzat Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowExtendModal(false)}>
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-800" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-4">
              {localStorage.getItem('language') === 'en' ? 'Extend Ad' : 'Reklamı Uzat'}
            </h2>

            <div className="space-y-3 mb-6">
              {durations.filter(d => ['1week', '1month', '1year'].includes(d.value)).map((duration) => (
                <button
                  key={duration.value}
                  onClick={() => setExtendDuration(duration.value)}
                  className={`w-full px-4 py-3 rounded-lg transition-all text-left ${
                    extendDuration === duration.value
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {duration.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowExtendModal(false)
                  setExtendAdId(null)
                  setExtendDuration(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                {localStorage.getItem('language') === 'en' ? 'Cancel' : 'İptal'}
              </button>
              <button
                onClick={handleExtendSubmit}
                disabled={!extendDuration || submitting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (localStorage.getItem('language') === 'en' ? 'Extending...' : 'Uzatılıyor...') : (localStorage.getItem('language') === 'en' ? 'Extend' : 'Uzat')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menü dışına tıklanınca kapat */}
      {openMenuId && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </>
  )
}

