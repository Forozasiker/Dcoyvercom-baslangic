import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Hero from '../components/Hero'
import ServerCard from '../components/ServerCard'
import PremiumServerCard from '../components/PremiumServerCard'
import SEO from '../components/SEO'
import { useTranslation } from '../lib/translations'

export default function Home() {
  const { category } = useParams()
  const navigate = useNavigate()
  const [servers, setServers] = useState([])
  const [advertisements, setAdvertisements] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
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
    setSelectedCategory(category || 'all')
    
    // 7 saniyede bir otomatik refresh
    const interval = setInterval(() => {
      fetchServers()
    }, 7000)
    
    return () => clearInterval(interval)
  }, [category])

  const fetchServers = async () => {
    try {
      const [serversData, adsData] = await Promise.all([
        axios.get('/api/guilds'),
        axios.get('/api/advertisements').catch(() => ({ data: [] }))
      ])
      setServers(serversData.data)
      setAdvertisements(adsData.data || [])
    } catch (error) {
      console.error('Sunucular yüklenemedi:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredServers = () => {
    if (selectedCategory === 'advertisements') {
      // Sponsorlar kategorisi için sponsor olan sunucuları göster
      const adGuildIds = advertisements.map(ad => ad.guildId)
      return servers.filter(server => adGuildIds.includes(server.guildId))
    }
    
    const filtered = servers.filter(server => {
      // Kategori filtresi
      const categoryMatch = selectedCategory === 'all' || server.category === selectedCategory
      
      // Arama filtresi
      const searchMatch = !searchQuery || 
        server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (server.description && server.description.toLowerCase().includes(searchQuery.toLowerCase()))
      
      return categoryMatch && searchMatch
    })
    
    return filtered
  }

  const filteredServers = getFilteredServers()
  
  // Sponsor ve normal sunucuları ayır
  const adGuildIds = advertisements.map(ad => ad.guildId)
  const sponsorServers = filteredServers.filter(server => adGuildIds.includes(server.guildId))
  const normalServers = filteredServers.filter(server => !adGuildIds.includes(server.guildId))

  const handleSearch = (query) => {
    setSearchQuery(query)
  }

  const categories = [
    { id: 'all', label: t('categories.all'), icon: '/emoji/tümü.ico' },
    { id: 'public', label: t('categories.public'), icon: '/emoji/genel.ico' },
    { id: 'game', label: t('categories.game'), icon: '/emoji/Oyun.ico' },
    { id: 'private', label: t('categories.private'), icon: '/emoji/Özel.ico' },
    { id: 'advertisements', label: localStorage.getItem('language') === 'en' ? 'Sponsors' : 'Sponsorlar', icon: '/emoji/Sponsorlar.ico' }
  ]

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat)
    if (cat === 'all') {
      navigate('/')
    } else {
      navigate(`/kategori/${cat}`)
    }
  }

  return (
    <>
      <SEO 
        title="DcOyver.com"
        description="DC Oyver, DcOyver, DC Oy Ver sistemi ile Discord sunucularınıza oy toplayın. En iyi Discord oy verme botu, oyver sistemi, dc oyver bot. Türkiye'nin #1 Discord oy verme ve sunucu listesi platformu. Ücretsiz Discord oy botu, oyver bot, dc oyver sistemi. Discord oy verme, oy verme discord, oy ver, discord public sunucular."
        keywords="dc oyver, dcoyver, dc oy ver, oyver sistemi, oyver bot, dc oyver bot, dc oyver sistemi, dc oyver discord, dcoyver.com, dc oyver botu, dc oyver discord bot, oyver discord bot, dc oyver sunucu, dc oyver liste, discord oy verme, oy verme discord, oy ver, discord public sunucular, discord oy ver, discord vote, discord voting, discord oy botu, discord vote bot, discord voting bot, discord bot oy verme, oy verme discord bot, discord sunucu, discord server, discord sunucu listesi, discord server list"
        url="https://dcoyver.com/"
      />
      <div className="page-transition min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-black dark:bg-black bg-gray-50 transition-colors duration-300"></div>
      </div>

      <Hero 
        onSearch={handleSearch} 
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      {/* Premium Stats Section */}
      <div className="relative py-12 sm:py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black dark:bg-black bg-gray-50 transition-colors duration-300"></div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
            <div className="group relative p-6">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <img src="/emoji/toplam.ico" alt="Toplam Sunucu" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                  <div className="text-3xl font-bold text-white">{servers.length}</div>
                </div>
                <div className="text-sm text-gray-400">{localStorage.getItem('language') === 'en' ? 'Total Servers' : 'Toplam Sunucu'}</div>
              </div>
            </div>
            
            <div className="group relative p-6">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <img src="/emoji/toplamuye.ico" alt="Toplam Üye" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                  <div className="text-3xl font-bold text-white">
                    {servers.reduce((sum, s) => sum + (s.memberCount || 0), 0).toLocaleString('tr-TR')}
                  </div>
                </div>
                <div className="text-sm text-gray-400">{localStorage.getItem('language') === 'en' ? 'Total Members' : 'Toplam Üye'}</div>
              </div>
            </div>
            
            <div className="group relative p-6">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <img src="/emoji/onlinekullanıcı.ico" alt="Online Kullanıcı" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                  <div className="text-3xl font-bold text-white">
                    {servers.reduce((sum, s) => sum + (s.onlineCount || 0), 0).toLocaleString('tr-TR')}
                  </div>
                </div>
                <div className="text-sm text-gray-400">{localStorage.getItem('language') === 'en' ? 'Online Users' : 'Online Kullanıcı'}</div>
              </div>
            </div>
            
            <div className="group relative p-6">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <img src="/emoji/toplamoy.ico" alt="Toplam Oy" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                  <div className="text-3xl font-bold text-white">
                    {servers.reduce((sum, s) => sum + (s.totalVotes || 0), 0).toLocaleString('tr-TR')}
                  </div>
                </div>
                <div className="text-sm text-gray-400">{localStorage.getItem('language') === 'en' ? 'Total Votes' : 'Toplam Oy'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 relative z-10">
        {/* Premium Category Navigation */}
        <div className="mb-8 sm:mb-12 md:mb-16">
          <div className="flex flex-wrap gap-3 sm:gap-4 justify-center mb-6 sm:mb-8 md:mb-10">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`group relative px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 overflow-hidden ${
                  selectedCategory === cat.id
                    ? `bg-gray-800 text-white scale-105 sm:scale-110 border border-gray-700`
                    : 'bg-gray-900/50 text-gray-300 hover:bg-gray-800 hover:text-white hover:scale-105 border border-gray-800'
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <img src={cat.icon} alt={cat.label} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
                  <span>{cat.label}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
                {categories.find(c => c.id === selectedCategory)?.label}
              </h2>
              <p className="text-gray-400 text-sm sm:text-base md:text-lg">
                {localStorage.getItem('language') === 'en' 
                  ? `Discover amazing ${selectedCategory === 'all' ? 'Discord servers' : selectedCategory + ' servers'}`
                  : `Harika ${selectedCategory === 'all' ? 'Discord sunucuları' : selectedCategory + ' sunucuları'} keşfedin`
                }
              </p>
            </div>

            <div className="hidden md:flex items-center gap-4">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-gray-400 text-sm font-medium transition"
                >
                  ✕ {localStorage.getItem('language') === 'en' ? 'Clear Search' : 'Aramayı Temizle'}
                </button>
              )}
              <div className="flex items-center gap-3 px-6 py-3 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-white font-semibold">
                  {filteredServers.length} {localStorage.getItem('language') === 'en' ? 'servers' : 'sunucu'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-32">
          <div className="inline-block relative">
            <div className="w-20 h-20 border-4 border-gray-800 border-t-gray-600 rounded-full animate-spin"></div>
          </div>
            <p className="text-gray-400 mt-6 text-lg">{localStorage.getItem('language') === 'en' ? 'Loading servers...' : 'Sunucular yükleniyor...'}</p>
          </div>
        ) : filteredServers.length === 0 ? (
          <div className="text-center py-32">
            <div className="relative inline-block mb-6">
              <div className="relative text-8xl">🔍</div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-3">{localStorage.getItem('language') === 'en' ? 'No servers found' : 'Sunucu bulunamadı'}</h3>
            <p className="text-gray-400 text-lg mb-6">{localStorage.getItem('language') === 'en' ? 'Try selecting a different category or search term' : 'Farklı bir kategori veya arama terimi deneyin'}</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105"
              >
                {localStorage.getItem('language') === 'en' ? 'Clear Search' : 'Aramayı Temizle'}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-12 sm:gap-16 md:gap-20">
            {/* Sponsor Sunucular Bölümü - Tüm kategorilerde göster */}
            {sponsorServers.length > 0 && (
              <div className="w-full">
                <div className="mb-6 sm:mb-8 md:mb-10">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-7 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{localStorage.getItem('language') === 'en' ? 'Sponsored Servers' : 'Sponsor Sunucular'}</span>
                  </h2>
                  <p className="text-gray-400 text-sm sm:text-base">{localStorage.getItem('language') === 'en' ? 'Featured premium servers' : 'Öne çıkan premium sunucular'}</p>
                </div>
                <div className="flex flex-col items-center gap-6 sm:gap-8">
                  {Array.from({ length: Math.ceil(sponsorServers.length / 4) }).map((_, rowIndex) => {
                    const rowServers = sponsorServers.slice(rowIndex * 4, (rowIndex + 1) * 4)
                    
                    return (
                      <div 
                        key={rowIndex}
                        className="server-card-row flex items-center justify-center gap-4 sm:gap-6 w-full max-w-7xl mx-auto px-4"
                      >
                        {rowServers.map((server, colIndex) => {
                          const globalIndex = rowIndex * 4 + colIndex
                          const isSmall = colIndex === 0 || colIndex === 3
                          const scaleClass = isSmall ? 'lg:scale-90' : 'lg:scale-100'
                          const adData = advertisements.find(ad => ad.guildId === server.guildId)
                          
                          return (
                            <div
                              key={server.guildId}
                              className={`flex-1 max-w-[280px] ${scaleClass} transition-transform duration-300 animate-fadeIn`}
                              style={{ animationDelay: `${globalIndex * 0.05}s` }}
                            >
                              <PremiumServerCard server={server} advertisement={adData} />
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Normal Sunucular Bölümü - Sponsorlar kategorisinde gösterilmez */}
            {selectedCategory !== 'advertisements' && normalServers.length > 0 && (
              <div className="w-full">
                {selectedCategory === 'all' && (
                  <div className="mb-6 sm:mb-8 md:mb-10">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                      {localStorage.getItem('language') === 'en' ? 'All Servers' : 'Tüm Sunucular'}
                    </h2>
                    <p className="text-gray-400 text-sm sm:text-base">{localStorage.getItem('language') === 'en' ? 'Discover all available servers' : 'Tüm mevcut sunucuları keşfedin'}</p>
                  </div>
                )}
                <div className="flex flex-col items-center gap-6 sm:gap-8">
                  {Array.from({ length: Math.ceil(normalServers.length / 4) }).map((_, rowIndex) => {
                    const rowServers = normalServers.slice(rowIndex * 4, (rowIndex + 1) * 4)
                    const startIndex = sponsorServers.length > 0 ? sponsorServers.length : 0
                    
                    return (
                      <div 
                        key={rowIndex}
                        className="server-card-row flex items-center justify-center gap-4 sm:gap-6 w-full max-w-7xl mx-auto px-4"
                      >
                        {rowServers.map((server, colIndex) => {
                          const globalIndex = startIndex + rowIndex * 4 + colIndex
                          const isSmall = colIndex === 0 || colIndex === 3
                          const scaleClass = isSmall ? 'lg:scale-90' : 'lg:scale-100'
                          
                          return (
                            <div
                              key={server.guildId}
                              className={`flex-1 max-w-[280px] ${scaleClass} transition-transform duration-300 animate-fadeIn`}
                              style={{ animationDelay: `${globalIndex * 0.05}s` }}
                            >
                              <ServerCard server={server} isPremium={false} />
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
        )}
      </div>
      </div>
    </>
  )
}
