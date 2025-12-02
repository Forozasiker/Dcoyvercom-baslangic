import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import SEO from '../components/SEO'
import UserCard from '../components/UserCard'

axios.defaults.withCredentials = true

export default function Kullanicilar() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0
  })
  const [stats, setStats] = useState({
    totalSystemUsers: 0,
    totalBackedUpUsers: 0
  })
  const [onlineCount, setOnlineCount] = useState(0)
  const searchTimeoutRef = useRef(null)

  const fetchUsers = async (page = 1, search = '') => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 100
      }
      
      if (search && search.trim() !== '') {
        params.search = search.trim()
      }
      
      console.log('🔄 Kullanıcılar çekiliyor...', params)
      const { data } = await axios.get('/api/users', { params })
      console.log('✅ API\'den gelen veri:', data)
      console.log('📊 Stats verisi:', data?.stats)
      
      // Yeni response formatı: { users: [], pagination: {}, stats: {} }
      if (data && typeof data === 'object' && 'users' in data) {
        setUsers(data.users || [])
        setPagination(data.pagination || {
          page: 1,
          limit: 100,
          total: 0,
          totalPages: 0
        })
        // Stats verisini set et - API'den gelen veriyi kullan
        if (data.stats) {
          console.log('📊 Stats set ediliyor:', data.stats)
          setStats({
            totalSystemUsers: data.stats.totalSystemUsers || 0,
            totalBackedUpUsers: data.stats.totalBackedUpUsers || 0
          })
        } else {
          console.warn('⚠️ Stats verisi bulunamadı!')
          setStats({
            totalSystemUsers: 0,
            totalBackedUpUsers: 0
          })
        }
        console.log(`✅ ${data.users?.length || 0} kullanıcı yüklendi (Sayfa: ${data.pagination?.page || 1}/${data.pagination?.totalPages || 0})`)
      } else if (Array.isArray(data)) {
        // Eski format desteği (geriye dönük uyumluluk)
        setUsers(data)
        setPagination({
          page: 1,
          limit: 100,
          total: data.length,
          totalPages: 1
        })
      } else {
        console.error('❌ Geçersiz veri formatı:', data)
        setUsers([])
        setPagination({
          page: 1,
          limit: 100,
          total: 0,
          totalPages: 0
        })
      }
    } catch (error) {
      console.error('❌ Kullanıcılar yüklenemedi:', error)
      console.error('❌ Error response:', error.response?.data)
      setUsers([])
      setPagination({
        page: 1,
        limit: 100,
        total: 0,
        totalPages: 0
      })
    } finally {
      setLoading(false)
    }
  }

  // Online count'u çek
  const fetchOnlineCount = async () => {
    try {
      const { data } = await axios.get('/api/guilds')
      const totalOnline = data.reduce((sum, server) => sum + (server.onlineCount || 0), 0)
      setOnlineCount(totalOnline)
    } catch (error) {
      console.error('Online count fetch error:', error)
    }
  }

  // İlk yüklemede tüm kullanıcıları getir (sayfa 1)
  useEffect(() => {
    fetchUsers(1, '')
    fetchOnlineCount()
    
    // Her 30 saniyede bir online count'u güncelle
    const interval = setInterval(() => {
      fetchOnlineCount()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Arama değiştiğinde otomatik arama yap (debounce ile)
  useEffect(() => {
    // İlk yüklemede arama yapma
    if (!hasSearched && searchQuery.trim() === '') {
      return
    }

    // Debounce: Kullanıcı yazmayı bıraktıktan 500ms sonra arama yap
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1)
      setHasSearched(true)
      fetchUsers(1, searchQuery.trim())
    }, 500) // 500ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  // Arama değiştiğinde sayfa 1'e dön ve arama yap
  const handleSearch = () => {
    setCurrentPage(1)
    setHasSearched(true)
    fetchUsers(1, searchQuery.trim())
  }

  // Sayfa değiştiğinde
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage)
      fetchUsers(newPage, searchQuery)
      // Sayfanın üstüne kaydır
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Sayfa numaralarını oluştur
  const getPageNumbers = () => {
    const pages = []
    const totalPages = pagination.totalPages
    const current = currentPage
    
    if (totalPages <= 7) {
      // 7 veya daha az sayfa varsa hepsini göster
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Daha fazla sayfa varsa akıllı gösterim
      if (current <= 4) {
        // İlk sayfalardaysak: 1 2 3 4 5 ... son
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (current >= totalPages - 3) {
        // Son sayfalardaysak: 1 ... (n-4) (n-3) (n-2) (n-1) n
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Ortadaysak: 1 ... (c-1) c (c+1) ... n
        pages.push(1)
        pages.push('...')
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  return (
    <>
      <SEO
        title="Kullanıcılar | DcOyver.com"
        description="Discord kullanıcılarını ara ve keşfet"
      />
      <div className="page-transition min-h-screen relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 left-0 w-full h-full bg-black dark:bg-black bg-gray-50 transition-colors duration-300"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10 py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
              {localStorage.getItem('language') === 'en' ? 'Users' : 'Kullanıcılar'}
            </h1>
            <p className="text-gray-400 text-lg mb-4">
              {localStorage.getItem('language') === 'en' 
                ? 'Search for Discord users by username or display name'
                : 'Kullanıcı adı veya görünen isim ile Discord kullanıcılarını ara'}
            </p>
            
            {/* Statistics */}
            <div className="flex flex-wrap justify-center items-center gap-4 text-sm">
              {/* Online Count */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-md border border-white/10">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="text-white font-semibold">
                  {onlineCount.toLocaleString('tr-TR')} Online
                </span>
              </div>
              
              {/* Total System Users */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-md border border-white/10">
                <span className="text-white font-semibold">
                  {stats.totalSystemUsers ? stats.totalSystemUsers.toLocaleString('tr-TR') : '0'} {localStorage.getItem('language') === 'en' ? 'Total Users' : 'Toplam Kullanıcı'}
                </span>
              </div>
              
              {/* System Users (Backed Up) */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-md border border-white/10">
                <span className="text-white font-semibold">
                  {stats.totalBackedUpUsers ? stats.totalBackedUpUsers.toLocaleString('tr-TR') : '0'} {localStorage.getItem('language') === 'en' ? 'Backed Up' : 'Yedeklenmiş'}
                </span>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="relative flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={localStorage.getItem('language') === 'en' ? 'Search by username or display name...' : 'Kullanıcı adı veya görünen isim ile ara...'}
                className="flex-1 px-6 py-4 bg-black border-2 border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700 transition-all duration-300"
              />
              
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-4 bg-black border-2 border-gray-800 hover:border-gray-700 hover:bg-gray-950 disabled:bg-gray-900 disabled:border-gray-900 disabled:cursor-not-allowed rounded-xl text-white font-semibold shadow-2xl hover:shadow-black/50 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
                <span>{localStorage.getItem('language') === 'en' ? 'Search' : 'Ara'}</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-20">
              <div className="inline-block w-16 h-16 border-4 border-gray-700 border-t-gray-500 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400 text-lg">
                {localStorage.getItem('language') === 'en' ? 'Loading...' : 'Yükleniyor...'}
              </p>
            </div>
          )}

          {/* Users List */}
          {!loading && (
            <>
              {users.length > 0 ? (
                <>
                  {/* Results Info */}
                  <div className="mb-8 text-center">
                    <p className="text-gray-400 text-lg">
                      {localStorage.getItem('language') === 'en' 
                        ? `Showing ${users.length} of ${pagination.total.toLocaleString('tr-TR')} users (Page ${pagination.page}/${pagination.totalPages})`
                        : `${pagination.total.toLocaleString('tr-TR')} kullanıcıdan ${users.length} tanesi gösteriliyor (Sayfa ${pagination.page}/${pagination.totalPages})`}
                    </p>
                  </div>

                  {/* User Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-12">
                    {users.map((user) => (
                      <UserCard key={user.discordId} user={user} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mb-12">
                      {/* Önceki Sayfa */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                        className="px-4 py-2 bg-black border-2 border-gray-800 hover:border-gray-700 hover:bg-gray-950 disabled:bg-gray-900 disabled:border-gray-900 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-all duration-300"
                      >
                        {localStorage.getItem('language') === 'en' ? 'Previous' : 'Önceki'}
                      </button>

                      {/* Sayfa Numaraları */}
                      <div className="flex gap-2">
                        {getPageNumbers().map((pageNum, index) => {
                          if (pageNum === '...') {
                            return (
                              <span key={`ellipsis-${index}`} className="px-4 py-2 text-gray-500">
                                ...
                              </span>
                            )
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              disabled={loading}
                              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                                currentPage === pageNum
                                  ? 'bg-gray-800 border-2 border-gray-700 text-white'
                                  : 'bg-black border-2 border-gray-800 hover:border-gray-700 hover:bg-gray-950 text-white'
                              } disabled:bg-gray-900 disabled:border-gray-900 disabled:cursor-not-allowed`}
                            >
                              {pageNum}
                            </button>
                          )
                        })}
                      </div>

                      {/* Sonraki Sayfa */}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.totalPages || loading}
                        className="px-4 py-2 bg-black border-2 border-gray-800 hover:border-gray-700 hover:bg-gray-950 disabled:bg-gray-900 disabled:border-gray-900 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-all duration-300"
                      >
                        {localStorage.getItem('language') === 'en' ? 'Next' : 'Sonraki'}
                      </button>
                    </div>
                  )}

                  {/* Statistics */}
                  <div className="mt-12 text-center">
                    <div className="inline-flex items-center gap-8 bg-black border-2 border-gray-800 rounded-xl px-8 py-6 shadow-2xl">
                      <div>
                        <div className="text-3xl font-bold text-white">{pagination.total.toLocaleString('tr-TR')}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {localStorage.getItem('language') === 'en' ? 'Total Users' : 'Toplam Kullanıcı'}
                        </div>
                      </div>
                      <div className="w-px h-16 bg-gray-800"></div>
                      <div>
                        <div className="text-3xl font-bold text-white">
                          {users.reduce((sum, u) => sum + (u.totalVotes || 0), 0).toLocaleString('tr-TR')}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {localStorage.getItem('language') === 'en' ? 'Total Votes' : 'Toplam Oy'}
                        </div>
                      </div>
                      <div className="w-px h-16 bg-gray-800"></div>
                      <div>
                        <div className="text-3xl font-bold text-white">
                          {users.reduce((sum, u) => sum + (u.totalGuilds || 0), 0).toLocaleString('tr-TR')}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {localStorage.getItem('language') === 'en' ? 'Total Servers' : 'Toplam Sunucu'}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-20">
                  <div className="relative inline-block mb-6">
                    <div className="relative text-8xl opacity-50">👥</div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-3">
                    {localStorage.getItem('language') === 'en' ? 'No Users Found' : 'Kullanıcı Bulunamadı'}
                  </h3>
                  <p className="text-gray-400 text-lg mb-6 max-w-md mx-auto">
                    {searchQuery 
                      ? (localStorage.getItem('language') === 'en' 
                          ? `No users found matching "${searchQuery}". Try a different search term.`
                          : `"${searchQuery}" için kullanıcı bulunamadı. Farklı bir arama terimi deneyin.`)
                      : (localStorage.getItem('language') === 'en'
                          ? 'No users have been backed up yet. Please wait a few minutes and refresh the page.'
                          : 'Henüz kullanıcı yedeklenmemiş. Lütfen birkaç dakika bekleyin ve sayfayı yenileyin.')}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
