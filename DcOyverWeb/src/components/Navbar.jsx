import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useTranslation } from '../lib/translations'

axios.defaults.withCredentials = true

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [language, setLanguage] = useState('tr')
  const [safeMode, setSafeMode] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [t, setT] = useState(() => useTranslation())
  const [onlineCount, setOnlineCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const settingsRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    checkAuth()
    fetchOnlineCount()
    
    // Load settings from localStorage
    const savedLanguage = localStorage.getItem('language')
    const savedSafeMode = localStorage.getItem('safeMode')
    const savedTheme = localStorage.getItem('theme') || 'dark'
    
    // Tema yükle
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      setDarkMode(false)
    } else {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
      setDarkMode(true)
    }
    
    if (savedLanguage) {
      setLanguage(savedLanguage)
      setT(() => useTranslation())
    }
    if (savedSafeMode !== null) setSafeMode(savedSafeMode === 'true')
    
    // Tema değişikliği event listener
    const handleThemeChange = () => {
      const currentTheme = localStorage.getItem('theme') || 'dark'
      if (currentTheme === 'light') {
        setDarkMode(false)
      } else {
        setDarkMode(true)
      }
    }
    
    window.addEventListener('themeChange', handleThemeChange)

    // Language change listener
    const handleLanguageChange = () => {
      setT(() => useTranslation())
    }
    
    window.addEventListener('languageChange', handleLanguageChange)
    
    // Pending count update listener
    const handlePendingCountUpdate = () => {
      if (isAdmin) {
        fetchPendingCount()
      }
    }
    window.addEventListener('pendingCountUpdate', handlePendingCountUpdate)

    // Click outside to close settings and profile menu
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('languageChange', handleLanguageChange)
      window.removeEventListener('pendingCountUpdate', handlePendingCountUpdate)
      window.removeEventListener('themeChange', handleThemeChange)
    }
  }, [])
  
  // Admin olduğunda başvuru sayısını çek ve periyodik güncelle
  useEffect(() => {
    if (isAdmin) {
      fetchPendingCount()
      // Her 30 saniyede bir başvuru sayısını güncelle
      const interval = setInterval(() => {
        fetchPendingCount()
      }, 30000)
      return () => clearInterval(interval)
    } else {
      setPendingCount(0)
    }
  }, [isAdmin])

  const fetchOnlineCount = async () => {
    try {
      const { data } = await axios.get('/api/guilds')
      const totalOnline = data.reduce((sum, server) => sum + (server.onlineCount || 0), 0)
      setOnlineCount(totalOnline)
    } catch (error) {
      console.error('Online count fetch error:', error)
    }
  }

  const fetchPendingCount = async () => {
    try {
      const { data } = await axios.get('/api/admin/pending-guilds-count')
      setPendingCount(data.count || 0)
    } catch (error) {
      console.error('Pending count fetch error:', error)
      setPendingCount(0)
    }
  }

  const checkAuth = async () => {
    try {
      const { data } = await axios.get('/api/auth/user', {
        withCredentials: true
      })
      setUser(data)
      setIsAdmin(data.isAdmin || false)
      if (data.isAdmin) {
        fetchPendingCount()
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (loginLoading) return // Çift tıklamayı önle
    
    try {
      setLoginLoading(true)
      const { data } = await axios.get('/api/auth/discord')
      if (data && data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Discord OAuth URL alınamadı')
      }
    } catch (error) {
      console.error('Login error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      const errorMessage = error.response?.data?.error || error.message || (localStorage.getItem('language') === 'en' ? 'Failed to login' : 'Giriş yapılamadı')
      alert(errorMessage)
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout')
      setUser(null)
    } catch (error) {
      alert('Çıkış yapılamadı')
    }
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-18 sm:h-20">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 sm:gap-2.5">
              <img 
                src="/DcOyver.png" 
                alt="DcOyver Logo" 
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
              <span className="text-sm sm:text-base font-bold text-white dark:text-white text-gray-900">DcOyver.com</span>
            </Link>

            {/* Online Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white/5 dark:bg-white/5 bg-gray-100 rounded-md border border-white/10 dark:border-white/10 border-gray-300 transition-colors duration-300">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-xs font-semibold text-white dark:text-white text-gray-900">{onlineCount} Online</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* Tema Toggle Butonu - Sağ Üst */}
            <button
              onClick={() => {
                const currentTheme = localStorage.getItem('theme') || 'dark'
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
                localStorage.setItem('theme', newTheme)
                
                if (newTheme === 'light') {
                  document.documentElement.classList.remove('dark')
                  document.documentElement.classList.add('light')
                } else {
                  document.documentElement.classList.remove('light')
                  document.documentElement.classList.add('dark')
                }
                
                window.dispatchEvent(new Event('themeChange'))
              }}
              className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white/10 dark:bg-white/10 hover:bg-white/20 dark:hover:bg-white/20 backdrop-blur-sm border border-white/20 dark:border-white/20 transition-all duration-300 group"
              title={localStorage.getItem('language') === 'en' ? 'Toggle Theme' : 'Tema Değiştir'}
            >
              {/* Güneş İkonu (Light Mode) */}
              <svg 
                className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 dark:hidden transition-all duration-300" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
              {/* Ay İkonu (Dark Mode) */}
              <svg 
                className="w-5 h-5 sm:w-6 sm:h-6 text-blue-300 hidden dark:block transition-all duration-300" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center text-white dark:text-white text-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Navigation Menu - Desktop */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/top100" className="text-sm font-bold text-white dark:text-white text-gray-900 hover:text-gray-300 dark:hover:text-gray-300 hover:text-gray-600 transition-colors">
                Top 100
              </Link>
              <Link to="/sunucular" className="text-sm font-bold text-white dark:text-white text-gray-900 hover:text-gray-300 dark:hover:text-gray-300 hover:text-gray-600 transition-colors">
                {localStorage.getItem('language') === 'en' ? 'Servers' : 'Sunucular'}
              </Link>
              <Link to="/kullanıcılar" className="text-sm font-bold text-white dark:text-white text-gray-900 hover:text-gray-300 dark:hover:text-gray-300 hover:text-gray-600 transition-colors">
                {localStorage.getItem('language') === 'en' ? 'Users' : 'Kullanıcılar'}
              </Link>
              <Link to="/kategori/advertisements" className="text-sm font-bold text-blue-400 dark:text-blue-400 text-blue-600 hover:text-blue-300 dark:hover:text-blue-300 hover:text-blue-700 transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{localStorage.getItem('language') === 'en' ? 'Sponsors' : 'Sponsorlar'}</span>
              </Link>
            </div>

            {/* Profile/Login Buttons */}
            {loading ? (
              <div className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowProfileMenu(!showProfileMenu)
                    }}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-600/80 hover:bg-purple-600 flex items-center justify-center transition border border-white/10 overflow-hidden"
                  >
                    <img 
                      src={user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                      alt={user.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </button>

                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-[#0a0a0f] border border-gray-800 rounded-2xl shadow-2xl z-[9999] overflow-hidden">
                    {/* Banner */}
                    <div className="relative h-32 bg-gray-900">
                      {user.banner && (
                        <img 
                          src={user.banner} 
                          alt="Banner" 
                          className="w-full h-full object-cover"
                        />
                      )}
                      {/* Profile Picture Overlay */}
                      <div className="absolute bottom-0 left-4 transform translate-y-1/2">
                        <div className="relative">
                          <div className="absolute inset-0 bg-[#0a0a0f] rounded-full p-1"></div>
                          <img 
                            src={user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                            alt={user.username}
                            className="relative w-20 h-20 rounded-full border-4 border-[#0a0a0f]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="pt-12 pb-4 px-4 bg-[#0a0a0f]">
                      {/* Username */}
                      <div className="mb-6">
                        <p className="text-gray-300 text-sm font-medium">@{user.username}</p>
                      </div>

                      {/* Menu Items */}
                      <div className="space-y-1">
                        {/* Sunucularım */}
                        <Link
                          to="/sunucularım"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-900/50 transition-all group"
                        >
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-300 group-hover:text-gray-200 transition-colors">
                            {localStorage.getItem('language') === 'en' ? 'My Servers' : 'Sunucularım'}
                          </span>
                        </Link>


                        {/* Sponsorlar Yönetim - Sadece admin için */}
                        {isAdmin && (
                          <Link
                            to="/reklam-yonetim"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-900/50 transition-all group"
                          >
                            <svg className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-300 group-hover:text-gray-200 transition-colors">
                              {localStorage.getItem('language') === 'en' ? 'Sponsor Management' : 'Sponsorlar Yönetim'}
                            </span>
                          </Link>
                        )}

                        {/* Başvuru Paneli - Sadece admin için */}
                        {isAdmin && (
                          <Link
                            to="/basvuru-paneli"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-900/50 transition-all group relative"
                          >
                            <svg className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-300 group-hover:text-gray-200 transition-colors">
                              {localStorage.getItem('language') === 'en' ? 'Application Panel' : 'Başvuru Paneli'}
                            </span>
                            {pendingCount > 0 && (
                              <span className="absolute right-2 top-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                                {pendingCount > 99 ? '99+' : pendingCount}
                              </span>
                            )}
                          </Link>
                        )}

                        {/* Yönetici Panel - Sadece admin için */}
                        {isAdmin && (
                          <Link
                            to="/yonetici-panel"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-900/50 transition-all group"
                          >
                            <svg className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-300 group-hover:text-gray-200 transition-colors">
                              {localStorage.getItem('language') === 'en' ? 'Admin Panel' : 'Yönetici Panel'}
                            </span>
                          </Link>
                        )}

                        {/* Dil */}
                        <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-900/50 transition-all group">
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-300 group-hover:text-gray-200 transition-colors">
                              {localStorage.getItem('language') === 'en' ? 'Language' : 'Dil'}
                            </span>
                          </div>
                          <span className="text-gray-400 font-semibold text-sm">{language.toUpperCase()}</span>
                        </div>

                        {/* Karanlık Mod */}
                        <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-900/50 transition-all group">
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                            </svg>
                            <span className="text-gray-300 group-hover:text-gray-200 transition-colors">
                              {localStorage.getItem('language') === 'en' ? 'Dark Mode' : 'Karanlık Mod'}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              const currentTheme = localStorage.getItem('theme') || 'dark'
                              const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
                              const newDarkMode = newTheme === 'dark'
                              
                              setDarkMode(newDarkMode)
                              localStorage.setItem('theme', newTheme)
                              
                              if (newDarkMode) {
                                document.documentElement.classList.remove('light')
                                document.documentElement.classList.add('dark')
                              } else {
                                document.documentElement.classList.add('light')
                                document.documentElement.classList.remove('dark')
                              }
                              
                              window.dispatchEvent(new Event('themeChange'))
                            }}
                            className={`relative w-12 h-6 rounded-full transition ${
                              darkMode ? 'bg-purple-500' : 'bg-yellow-400'
                            }`}
                          >
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-lg ${
                              darkMode ? 'translate-x-6' : ''
                            }`} />
                          </button>
                        </div>

                        {/* Güvenlik Filtresi */}
                        <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-900/50 transition-all group">
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-300 group-hover:text-gray-200 transition-colors">
                              {localStorage.getItem('language') === 'en' ? 'Security Filter' : 'Güvenlik Filtresi'}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setSafeMode(!safeMode)
                              localStorage.setItem('safeMode', (!safeMode).toString())
                            }}
                            className={`relative w-12 h-6 rounded-full transition ${
                              safeMode ? 'bg-purple-500' : 'bg-gray-700'
                            }`}
                          >
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-gray-900 rounded-full transition-transform ${
                              safeMode ? 'translate-x-6' : ''
                            }`} />
                          </button>
                        </div>

                        {/* Çıkış */}
                        <button
                          onClick={() => {
                            handleLogout()
                            setShowProfileMenu(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-900/30 transition-all group text-left"
                        >
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span className="text-gray-300 group-hover:text-red-400 transition-colors">
                            {localStorage.getItem('language') === 'en' ? 'Logout' : 'Çıkış'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                disabled={loginLoading}
                className="px-2.5 sm:px-3.5 py-1.5 bg-black/40 hover:bg-black/60 border border-white/10 rounded-lg text-xs sm:text-sm font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2 backdrop-blur-sm"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                {loginLoading ? (
                  <>
                    <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">{localStorage.getItem('language') === 'en' ? 'Loading...' : 'Yükleniyor...'}</span>
                  </>
                ) : (
                  <span className="hidden sm:inline">{localStorage.getItem('language') === 'en' ? 'Login' : 'Giriş'}</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4">
            <div className="flex flex-col gap-3">
              <Link 
                to="/top100" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold text-white hover:text-gray-300 transition-colors px-4 py-2"
              >
                Top 100
              </Link>
              <Link 
                to="/sunucular" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold text-white hover:text-gray-300 transition-colors px-4 py-2"
              >
                {localStorage.getItem('language') === 'en' ? 'Servers' : 'Sunucular'}
              </Link>
              <Link 
                to="/kullanıcılar" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold text-white hover:text-gray-300 transition-colors px-4 py-2"
              >
                {localStorage.getItem('language') === 'en' ? 'Users' : 'Kullanıcılar'}
              </Link>
              <Link 
                to="/kategori/advertisements" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors px-4 py-2 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{localStorage.getItem('language') === 'en' ? 'Sponsors' : 'Sponsorlar'}</span>
              </Link>
              {/* Mobile Online Badge */}
              <div className="flex items-center gap-1.5 px-4 py-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="text-xs font-semibold text-white">{onlineCount} Online</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
