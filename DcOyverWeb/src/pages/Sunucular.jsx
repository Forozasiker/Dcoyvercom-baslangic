import { useState, useEffect } from 'react'
import axios from 'axios'
import SEO from '../components/SEO'
import ServerCard from '../components/ServerCard'
import PremiumServerCard from '../components/PremiumServerCard'

axios.defaults.withCredentials = true

export default function Sunucular() {
  const [guilds, setGuilds] = useState([])
  const [advertisements, setAdvertisements] = useState([])
  const [filteredGuilds, setFilteredGuilds] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchGuilds()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredGuilds(guilds)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = guilds.filter(guild =>
        guild.name.toLowerCase().includes(query) ||
        guild.description?.toLowerCase().includes(query) ||
        guild.category?.toLowerCase().includes(query)
      )
      setFilteredGuilds(filtered)
    }
  }, [searchQuery, guilds])

  const fetchGuilds = async () => {
    try {
      const [serversData, adsData] = await Promise.all([
        axios.get('/api/guilds'),
        axios.get('/api/advertisements').catch(() => ({ data: [] }))
      ])
      setGuilds(serversData.data)
      setAdvertisements(adsData.data || [])
      setFilteredGuilds(serversData.data)
    } catch (error) {
      console.error('Guilds fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sponsor ve normal sunucuları ayır
  const adGuildIds = advertisements.map(ad => ad.guildId)
  const sponsorServers = filteredGuilds.filter(server => adGuildIds.includes(server.guildId))
  const normalServers = filteredGuilds.filter(server => !adGuildIds.includes(server.guildId))

  if (loading) {
    return (
      <>
        <SEO
          title="Sunucular | DcOyver.com"
          description="Tüm Discord sunucularını keşfet"
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
        title="Sunucular | DcOyver.com"
        description="Tüm Discord sunucularını keşfet"
      />
      <div className="min-h-screen bg-black dark:bg-black bg-gray-50 relative overflow-hidden transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 relative z-10 py-8">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">
            {localStorage.getItem('language') === 'en' ? 'Servers' : 'Sunucular'}
          </h1>

          {/* Arama */}
          <div className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={localStorage.getItem('language') === 'en' ? 'Search servers...' : 'Sunucu ara...'}
                className="w-full px-6 py-4 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <svg
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Sponsor Sunucular Bölümü */}
          {sponsorServers.length > 0 && (
            <div className="w-full mb-12">
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

          {/* Normal Sunucular Bölümü */}
          {normalServers.length > 0 && (
            <div className="w-full">
              <div className="mb-6 sm:mb-8 md:mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                  {localStorage.getItem('language') === 'en' ? 'All Servers' : 'Tüm Sunucular'}
                </h2>
                <p className="text-gray-400 text-sm sm:text-base">{localStorage.getItem('language') === 'en' ? 'Discover all available servers' : 'Tüm mevcut sunucuları keşfedin'}</p>
                  </div>
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

          {sponsorServers.length === 0 && normalServers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">
                {localStorage.getItem('language') === 'en' ? 'No servers found' : 'Sunucu bulunamadı'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

