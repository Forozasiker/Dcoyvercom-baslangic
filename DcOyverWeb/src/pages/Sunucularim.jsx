import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useTranslation } from '../lib/translations'

axios.defaults.withCredentials = true

export default function Sunucularim() {
  const navigate = useNavigate()
  const [guilds, setGuilds] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [botInviteUrl, setBotInviteUrl] = useState('https://discord.com/oauth2/authorize?client_id=1444650958830178304&permissions=8&integration_type=0&scope=bot')
  const [t, setT] = useState(() => useTranslation())

  useEffect(() => {
    const handleLanguageChange = () => {
      setT(() => useTranslation())
    }
    
    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  useEffect(() => {
    fetchConfig()
    checkAuth()
  }, [])

  const fetchConfig = async () => {
    try {
      const { data } = await axios.get('/api/config')
      if (data.botInviteUrl) {
        setBotInviteUrl(data.botInviteUrl)
      }
    } catch (error) {
      console.error('Config fetch error:', error)
      // Hata durumunda varsayılan URL kullanılacak
    }
  }

  const checkAuth = async () => {
    try {
      const { data: userData } = await axios.get('/api/auth/user')
      setUser(userData)
      fetchGuilds()
    } catch (error) {
      // Giriş yapılmamış, ana sayfaya yönlendir
      navigate('/')
    }
  }

  const fetchGuilds = async () => {
    try {
      const { data } = await axios.get('/api/user/guilds')
      setGuilds(data.guilds || [])
    } catch (error) {
      console.error('Guilds fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBot = (guildId) => {
    const inviteUrl = `${botInviteUrl}&guild_id=${guildId}`
    window.open(inviteUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]">
        <div className="text-center">
            <div className="inline-block relative">
              <div className="w-20 h-20 border-4 border-gray-800 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
          <p className="text-gray-400 mt-6 text-lg">{localStorage.getItem('language') === 'en' ? 'Loading your servers...' : 'Sunucularınız yükleniyor...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen page-transition relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-black"></div>
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-black mb-6">
            <span className="block text-white">
              {localStorage.getItem('language') === 'en' ? 'My Servers' : 'Sunucularım'}
            </span>
          </h1>
          <div className="flex items-center justify-center gap-2 mt-4 mb-8">
            <div className="h-1 w-16 bg-gray-800"></div>
            <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
            <div className="h-1 w-16 bg-gray-800"></div>
          </div>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {localStorage.getItem('language') === 'en' 
              ? 'Manage your Discord servers and add DcOyver bot to grow your community!'
              : 'Discord sunucularınızı yönetin ve topluluğunuzu büyütmek için DcOyver botunu ekleyin!'}
          </p>
        </div>

        {/* Servers Table */}
        {guilds.length === 0 ? (
          <div className="text-center py-32">
            <div className="relative inline-block mb-6">
              <div className="relative text-8xl">📋</div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-3">
              {localStorage.getItem('language') === 'en' ? 'No Servers Found' : 'Sunucu Bulunamadı'}
            </h3>
            <p className="text-gray-400 text-lg mb-6">
              {localStorage.getItem('language') === 'en' 
                ? 'You need administrator permissions in at least one Discord server to see them here.'
                : 'Burada görmek için en az bir Discord sunucusunda yönetici yetkisine sahip olmanız gerekir.'}
            </p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-br from-[#1a1a24] to-[#0f0f1a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              {/* Table Header */}
              <div className="bg-white/5 border-b border-white/10 px-6 py-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1 text-white font-bold text-sm">#</div>
                  <div className="col-span-9 text-white font-bold text-sm">{localStorage.getItem('language') === 'en' ? 'Server Name' : 'Sunucu Adı'}</div>
                  <div className="col-span-2 text-right text-white font-bold text-sm">{localStorage.getItem('language') === 'en' ? 'Edit' : 'Düzenle'}</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-white/10">
                {guilds.map((guild, index) => (
                  <div
                    key={guild.guildId}
                    className="px-6 py-4 hover:bg-white/5 transition-all duration-200 group"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Rank */}
                      <div className="col-span-1">
                        <span className="text-gray-400 font-semibold">{index + 1}</span>
                      </div>

                      {/* Server Info */}
                      <div className="col-span-9 flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                          {guild.iconURL ? (
                            <img
                              src={guild.iconURL}
                              alt={guild.guildName}
                              className="w-12 h-12 rounded-xl border-2 border-white/20 group-hover:border-purple-500/50 transition-all"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg border-2 border-white/20 group-hover:border-purple-500/50 transition-all">
                              {guild.guildName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-bold text-lg truncate group-hover:text-gray-300 transition-all">
                              {guild.guildName}
                            </h3>
                            {!guild.hasBot && (
                              <span className="text-red-400 text-xs font-medium flex items-center gap-1">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                {localStorage.getItem('language') === 'en' ? 'Not online' : 'Yayında değil'}
                              </span>
                            )}
                          </div>
                          {guild.hasBot && (
                            <p className="text-gray-400 text-xs">
                              {guild.totalVotes || 0} {localStorage.getItem('language') === 'en' ? 'votes' : 'oy'} • {guild.memberCount?.toLocaleString('tr-TR') || 0} {localStorage.getItem('language') === 'en' ? 'members' : 'üye'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Edit */}
                      <div className="col-span-2 text-right">
                        {guild.hasBot ? (
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm font-medium">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {localStorage.getItem('language') === 'en' ? 'Bot Already Added' : 'Zaten Bot Sunucuda Var'}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddBot(guild.guildId)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white text-sm font-medium transition-all duration-300 hover:scale-105"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {localStorage.getItem('language') === 'en' ? 'Add' : 'Ekle'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

