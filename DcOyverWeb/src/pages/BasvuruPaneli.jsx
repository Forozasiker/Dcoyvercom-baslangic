import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import SEO from '../components/SEO'

axios.defaults.withCredentials = true

export default function BasvuruPaneli() {
  const navigate = useNavigate()
  const [guilds, setGuilds] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [processing, setProcessing] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingGuild, setRejectingGuild] = useState(null)

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    try {
      const { data } = await axios.get('/api/auth/user')
      if (data && data.isAdmin) {
        setIsAdmin(true)
        await fetchPendingGuilds()
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

  const fetchPendingGuilds = async () => {
    try {
      const { data } = await axios.get('/api/admin/pending-guilds')
      setGuilds(data)
      // Başvuru sayısını güncellemek için window event gönder (Navbar'ı güncellemek için)
      window.dispatchEvent(new CustomEvent('pendingCountUpdate'))
    } catch (error) {
      console.error('Pending guilds fetch error:', error)
      if (error.response?.status === 403) {
        navigate('/')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (guildId, guildName) => {
    const confirmMessage = localStorage.getItem('language') === 'en' 
      ? `Are you sure you want to approve the server "${guildName}"?`
      : `"${guildName}" sunucusunu onaylamak istediğinize emin misiniz?`
    
    if (!confirm(confirmMessage)) return
    
    setProcessing(guildId)
    try {
      await axios.post(`/api/admin/guilds/${guildId}/approve`)
      setGuilds(guilds.filter(g => g.guildId !== guildId))
      // Badge'i güncelle
      window.dispatchEvent(new CustomEvent('pendingCountUpdate'))
      alert(localStorage.getItem('language') === 'en' ? 'Server approved successfully' : 'Sunucu başarıyla onaylandı')
    } catch (error) {
      console.error('Approve error:', error)
      alert(error.response?.data?.error || (localStorage.getItem('language') === 'en' ? 'Error occurred' : 'Hata oluştu'))
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (guildId, guildName) => {
    if (!rejectReason.trim()) {
      alert(localStorage.getItem('language') === 'en' 
        ? 'Please provide a rejection reason' 
        : 'Lütfen reddetme nedeni girin')
      return
    }
    
    const confirmMessage = localStorage.getItem('language') === 'en' 
      ? `Are you sure you want to reject the server "${guildName}"?`
      : `"${guildName}" sunucusunu reddetmek istediğinize emin misiniz?`
    
    if (!confirm(confirmMessage)) return
    
    setProcessing(guildId)
    try {
      await axios.post(`/api/admin/guilds/${guildId}/reject`, {
        reason: rejectReason.trim()
      })
      setGuilds(guilds.filter(g => g.guildId !== guildId))
      setRejectingGuild(null)
      setRejectReason('')
      // Badge'i güncelle
      window.dispatchEvent(new CustomEvent('pendingCountUpdate'))
      alert(localStorage.getItem('language') === 'en' ? 'Server rejected successfully' : 'Sunucu başarıyla reddedildi')
    } catch (error) {
      console.error('Reject error:', error)
      alert(error.response?.data?.error || (localStorage.getItem('language') === 'en' ? 'Error occurred' : 'Hata oluştu'))
    } finally {
      setProcessing(null)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Bilinmiyor'
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <>
        <SEO
          title="Başvuru Paneli | DcOyver.com"
          description="Sunucu başvurularını yönetin"
        />
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center text-white">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              <p className="mt-4 text-gray-400">Yükleniyor...</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SEO
        title="Başvuru Paneli | DcOyver.com"
        description="Sunucu başvurularını yönetin"
      />
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 text-center">
              {localStorage.getItem('language') === 'en' ? 'Application Panel' : 'Başvuru Paneli'}
            </h1>
            <p className="text-gray-400 text-center">
              {localStorage.getItem('language') === 'en' 
                ? 'Review and approve or reject server applications' 
                : 'Sunucu başvurularını inceleyin, onaylayın veya reddedin'}
            </p>
          </div>

          {guilds.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block p-4 rounded-full bg-gray-900/50 mb-4">
                <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-400 text-lg">
                {localStorage.getItem('language') === 'en' 
                  ? 'No pending applications' 
                  : 'Bekleyen başvuru yok'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {guilds.map((guild) => (
                <div
                  key={guild.guildId}
                  className="bg-gray-900/50 rounded-xl p-6 hover:bg-gray-900/70 transition-all border border-gray-800"
                >
                  <div className="flex items-start gap-4 mb-4">
                    {guild.iconURL ? (
                      <img
                        src={guild.iconURL}
                        alt={guild.name}
                        className="w-20 h-20 rounded-full"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl">
                        {guild.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-xl mb-1">{guild.name}</h3>
                      <p className="text-gray-400 text-sm">ID: {guild.guildId}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <span>{guild.memberCount?.toLocaleString('tr-TR') || 0} üye</span>
                    </div>
                    {guild.onlineCount > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{guild.onlineCount?.toLocaleString('tr-TR') || 0} çevrimiçi</span>
                      </div>
                    )}
                    {guild.voiceCount > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                        <span>{guild.voiceCount?.toLocaleString('tr-TR') || 0} seste</span>
                      </div>
                    )}
                    {guild.ownerUsername && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span>Sahip: {guild.ownerUsername} {guild.ownerGlobalName ? `(${guild.ownerGlobalName})` : ''}</span>
                      </div>
                    )}
                    {guild.inviteURL && (
                      <div className="flex items-center gap-2 text-sm">
                        <a
                          href={guild.inviteURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                          </svg>
                          Davet Linki
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span>Başvuru: {formatDate(guild.requestedAt)}</span>
                    </div>
                  </div>

                  {rejectingGuild === guild.guildId ? (
                    <div className="space-y-3">
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reddetme nedeni..."
                        className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-700 focus:border-purple-500 focus:outline-none resize-none"
                        rows={3}
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReject(guild.guildId, guild.name)}
                          disabled={processing === guild.guildId}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processing === guild.guildId ? 'İşleniyor...' : 'Reddet'}
                        </button>
                        <button
                          onClick={() => {
                            setRejectingGuild(null)
                            setRejectReason('')
                          }}
                          disabled={processing === guild.guildId}
                          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(guild.guildId, guild.name)}
                        disabled={processing === guild.guildId}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing === guild.guildId ? 'İşleniyor...' : '✅ Onayla'}
                      </button>
                      <button
                        onClick={() => setRejectingGuild(guild.guildId)}
                        disabled={processing === guild.guildId}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ❌ Reddet
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

