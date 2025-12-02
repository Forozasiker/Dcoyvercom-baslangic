import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import SEO from '../components/SEO'

axios.defaults.withCredentials = true

export default function YoneticiPanel() {
  const navigate = useNavigate()
  const [guilds, setGuilds] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [editingGuild, setEditingGuild] = useState(null)
  const [formData, setFormData] = useState({
    description: '',
    category: 'public',
    inviteURL: ''
  })
  const [saving, setSaving] = useState(false)

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

  const handleDeleteGuild = async (guildId, guildName) => {
    const confirmMessage = localStorage.getItem('language') === 'en' 
      ? `Are you sure you want to delete the server "${guildName}"? This action cannot be undone.`
      : `"${guildName}" sunucusunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
    
    if (!confirm(confirmMessage)) return
    
    setDeleting(guildId)
    try {
      await axios.delete(`/api/admin/guilds/${guildId}`)
      setGuilds(guilds.filter(g => g.guildId !== guildId))
      alert(localStorage.getItem('language') === 'en' ? 'Server deleted successfully' : 'Sunucu başarıyla silindi')
    } catch (error) {
      console.error('Guild delete error:', error)
      alert(error.response?.data?.error || (localStorage.getItem('language') === 'en' ? 'Error occurred' : 'Hata oluştu'))
    } finally {
      setDeleting(null)
    }
  }

  const handleEditGuild = (guild) => {
    setEditingGuild(guild.guildId)
    setFormData({
      description: guild.description || '',
      category: guild.category || 'public',
      inviteURL: guild.inviteURL || ''
    })
  }

  const handleCancelEdit = () => {
    setEditingGuild(null)
    setFormData({
      description: '',
      category: 'public',
      inviteURL: ''
    })
  }

  const handleSaveGuild = async (guildId) => {
    if (saving) return
    
    // Validation
    const trimmedDescription = formData.description.trim()
    if (!trimmedDescription || trimmedDescription.length < 20 || trimmedDescription.length > 500) {
      alert(localStorage.getItem('language') === 'en' 
        ? 'Description must be between 20-500 characters' 
        : 'Açıklama 20-500 karakter arasında olmalı')
      return
    }
    
    if (!formData.category || !['public', 'private', 'game'].includes(formData.category)) {
      alert(localStorage.getItem('language') === 'en' 
        ? 'Category must be public, private or game' 
        : 'Kategori public, private veya game olmalı')
      return
    }
    
    const trimmedInviteURL = formData.inviteURL.trim()
    if (!trimmedInviteURL || (!trimmedInviteURL.includes('discord.gg/') && !trimmedInviteURL.includes('discord.com/invite/'))) {
      alert(localStorage.getItem('language') === 'en' 
        ? 'Invalid Discord invite link' 
        : 'Geçersiz Discord davet linki')
      return
    }
    
    if (trimmedInviteURL.length < 10 || trimmedInviteURL.length > 100) {
      alert(localStorage.getItem('language') === 'en' 
        ? 'Invite URL must be between 10-100 characters' 
        : 'Davet linki 10-100 karakter arasında olmalı')
      return
    }
    
    setSaving(true)
    try {
      const updateData = {
        description: trimmedDescription,
        category: formData.category,
        inviteURL: trimmedInviteURL
      }
      
      const response = await axios.put(`/api/admin/guilds/${guildId}`, updateData)
      
      // Listeyi güncelle
      setGuilds(guilds.map(g => 
        g.guildId === guildId 
          ? { ...g, ...updateData }
          : g
      ))
      
      setEditingGuild(null)
      setFormData({
        description: '',
        category: 'public',
        inviteURL: ''
      })
      
      alert(localStorage.getItem('language') === 'en' ? 'Server updated successfully' : 'Sunucu başarıyla güncellendi')
    } catch (error) {
      console.error('Guild update error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || (localStorage.getItem('language') === 'en' ? 'Error occurred' : 'Hata oluştu')
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <SEO
          title="Yönetici Panel | DcOyver.com"
          description="Yönetici paneli"
        />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">{localStorage.getItem('language') === 'en' ? 'Loading...' : 'Yükleniyor...'}</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SEO
        title="Yönetici Panel | DcOyver.com"
        description="Yönetici paneli"
      />
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">
            {localStorage.getItem('language') === 'en' ? 'Admin Panel' : 'Yönetici Panel'}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                      {guild.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-1">{guild.name}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2">{guild.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <span>👥 {guild.memberCount || 0}</span>
                  <span>❤️ {guild.totalVotes || 0}</span>
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                    {guild.category === 'public' ? '🌐 Public' : guild.category === 'private' ? '🔒 Private' : '🎮 Game'}
                  </span>
                </div>
                {guild.isSetup === false && (
                  <div className="mb-4">
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                      ⚠️ {localStorage.getItem('language') === 'en' ? 'Setup Not Completed' : 'Setup Yapılmamış'}
                    </span>
                  </div>
                )}

                {editingGuild === guild.guildId ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        {localStorage.getItem('language') === 'en' ? 'Description (20-500 characters)' : 'Açıklama (20-500 karakter)'}
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                        rows={4}
                        minLength={20}
                        maxLength={500}
                        placeholder={localStorage.getItem('language') === 'en' ? 'Enter server description...' : 'Sunucu açıklamasını girin...'}
                      />
                      <p className="text-gray-500 text-xs mt-1">
                        {formData.description.length}/500 {localStorage.getItem('language') === 'en' ? 'characters' : 'karakter'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        {localStorage.getItem('language') === 'en' ? 'Category' : 'Kategori'}
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="public">🌐 Public</option>
                        <option value="private">🔒 Private</option>
                        <option value="game">🎮 Game</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        {localStorage.getItem('language') === 'en' ? 'Invite URL' : 'Davet Linki'}
                      </label>
                      <input
                        type="text"
                        value={formData.inviteURL}
                        onChange={(e) => setFormData({ ...formData, inviteURL: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        placeholder="https://discord.gg/..."
                        minLength={10}
                        maxLength={100}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveGuild(guild.guildId)}
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving 
                          ? (localStorage.getItem('language') === 'en' ? 'Saving...' : 'Kaydediliyor...')
                          : (localStorage.getItem('language') === 'en' ? 'Save' : 'Kaydet')
                        }
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {localStorage.getItem('language') === 'en' ? 'Cancel' : 'İptal'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleEditGuild(guild)}
                      className="w-full px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 hover:border-blue-500 text-blue-400 rounded-lg transition-all font-semibold text-sm"
                    >
                      {localStorage.getItem('language') === 'en' ? 'Update Server' : 'Sunucuyu Güncelle'}
                    </button>
                    <button
                      onClick={() => handleDeleteGuild(guild.guildId, guild.name)}
                      disabled={deleting === guild.guildId}
                      className="w-full px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500 text-red-400 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
                    >
                      {deleting === guild.guildId 
                        ? (localStorage.getItem('language') === 'en' ? 'Deleting...' : 'Siliniyor...')
                        : (localStorage.getItem('language') === 'en' ? 'Delete Server' : 'Sunucuyu Kaldır')
                      }
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {guilds.length === 0 && !loading && (
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

