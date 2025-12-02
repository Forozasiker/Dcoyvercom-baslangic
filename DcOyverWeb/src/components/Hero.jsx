import { useState, useEffect } from 'react'
import { useTranslation } from '../lib/translations'

export default function Hero({ onSearch, searchValue, onSearchChange }) {
  const [search, setSearch] = useState('')
  const [t, setT] = useState(() => useTranslation())
  const [typewriterText1, setTypewriterText1] = useState('')
  const [typewriterText2, setTypewriterText2] = useState('')
  const [showCursor1, setShowCursor1] = useState(true)
  const [showCursor2, setShowCursor2] = useState(false)

  useEffect(() => {
    const handleLanguageChange = () => {
      setT(() => useTranslation())
    }
    
    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  useEffect(() => {
    // Ses efektleri kaldırıldı - sadece görsel efekt

    const lang = localStorage.getItem('language') || 'tr'
    const line1 = lang === 'en' 
      ? 'Discord Servers'
      : 'Discord Sunucuları'
    const line2 = lang === 'en'
      ? 'Discover, Find and Join!'
      : 'Keşfet, Bul ve Katıl!'

    let charIndex1 = 0
    let charIndex2 = 0
    let isDeleting = false
    let timeoutId

    const typeWriter = () => {
      if (!isDeleting) {
        if (charIndex1 < line1.length) {
          setTypewriterText1(line1.substring(0, charIndex1 + 1))
          setShowCursor1(true)
          setShowCursor2(false)
          
          charIndex1++
          timeoutId = setTimeout(typeWriter, 80)
        } else if (charIndex2 < line2.length) {
          setShowCursor1(false)
          setShowCursor2(true)
          setTypewriterText2(line2.substring(0, charIndex2 + 1))
          
          charIndex2++
          timeoutId = setTimeout(typeWriter, 80)
        } else {
          setShowCursor1(false)
          setShowCursor2(true)
          timeoutId = setTimeout(() => {
            isDeleting = true
            typeWriter()
          }, 2000)
        }
      } else {
        if (charIndex2 > 0) {
          setTypewriterText2(line2.substring(0, charIndex2 - 1))
          setShowCursor2(true)
          charIndex2--
          timeoutId = setTimeout(typeWriter, 40)
        } else if (charIndex1 > 0) {
          setShowCursor2(false)
          setShowCursor1(true)
          setTypewriterText1(line1.substring(0, charIndex1 - 1))
          charIndex1--
          timeoutId = setTimeout(typeWriter, 40)
        } else {
          isDeleting = false
          charIndex1 = 0
          charIndex2 = 0
          setShowCursor1(true)
          setShowCursor2(false)
          timeoutId = setTimeout(typeWriter, 500)
        }
      }
    }

    timeoutId = setTimeout(typeWriter, 500)

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  // Parent'tan gelen searchValue'yu kullan
  const currentSearch = searchValue !== undefined ? searchValue : search

  const handleInputChange = (value) => {
    if (onSearchChange) {
      onSearchChange(value)
    } else {
      setSearch(value)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(currentSearch)
    }
  }

  return (
    <div className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-black"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
        {/* Premium Title */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black mb-3 sm:mb-4">
            <span className="block text-white flex items-center justify-center gap-4 sm:gap-6">
              <img 
                src="/DcOyver.png" 
                alt="DcOyver Logo" 
                className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 object-contain"
              />
              <span>DcOyver</span>
            </span>
          </h1>
          <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4">
            <div className="h-1 w-12 sm:w-16 bg-gray-800"></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-700 rounded-full"></div>
            <div className="h-1 w-12 sm:w-16 bg-gray-800"></div>
          </div>
        </div>

        {/* Hero Text Content */}
        <div className="mb-8 sm:mb-10 md:mb-12 max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            <span className="block text-white mb-2">
              <span id="typewriter-line1">{typewriterText1}</span>
              {showCursor1 && <span className="typewriter-cursor" id="cursor-line1">|</span>}
            </span>
            <span className="block rgb-gradient-text mb-3">
              <span id="typewriter-line2">{typewriterText2}</span>
              {showCursor2 && <span className="typewriter-cursor" id="cursor-line2">|</span>}
            
            </span>
          </h2>
        </div>
        
        {/* Premium Search Bar */}
        <form onSubmit={handleSearch} className="max-w-3xl mx-auto px-4">
          <div className="relative group">
            <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl sm:rounded-2xl overflow-hidden group-hover:border-gray-700 transition-all duration-300">
              <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-10">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder={t('hero.search')}
                value={currentSearch}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-full pl-12 sm:pl-16 pr-4 sm:pr-6 py-3 sm:py-4 md:py-5 bg-transparent text-white placeholder-gray-400 focus:outline-none text-base sm:text-lg"
              />
              <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 sm:static sm:translate-y-0 sm:px-2 sm:py-1">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg sm:rounded-xl text-white text-sm sm:text-base font-semibold transition-all duration-300 hover:scale-105"
                >
                  {localStorage.getItem('language') === 'en' ? 'Search' : 'Ara'}
                </button>
              </div>
            </div>
          </div>
        </form>

      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 md:h-32 bg-gradient-to-t from-black to-transparent"></div>
    </div>
  )
}
