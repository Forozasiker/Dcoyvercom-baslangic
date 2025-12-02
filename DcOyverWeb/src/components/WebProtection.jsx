import { useEffect } from 'react'

export default function WebProtection() {
  useEffect(() => {
    // Sağ tık engelleme
    const handleContextMenu = (e) => {
      e.preventDefault()
      return false
    }

    // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S engelleme
    const handleKeyDown = (e) => {
      // F12
      if (e.keyCode === 123) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      
      // Ctrl+Shift+I (Inspect)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      
      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      
      // Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      
      // Ctrl+U (View Source)
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      
      // Ctrl+S (Save Page)
      if (e.ctrlKey && e.keyCode === 83) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      
      // Ctrl+P (Print - genelde inspect için kullanılır)
      if (e.ctrlKey && e.keyCode === 80) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      
      // Ctrl+Shift+P (Command Palette - DevTools)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 80) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    // Text seçim engelleme (opsiyonel - daha agresif)
    const handleSelectStart = (e) => {
      // Sadece bazı elementlerde seçimi engelle (örneğin kod blokları)
      if (e.target.tagName === 'CODE' || e.target.tagName === 'PRE') {
        return true
      }
      // Diğer yerlerde seçime izin ver
      return true
    }

    // Drag engelleme (görselleri sürükleyip indirmeyi engelle)
    const handleDragStart = (e) => {
      // Sadece görselleri koru
      if (e.target.tagName === 'IMG') {
        e.preventDefault()
        return false
      }
    }

    // Developer Tools açıldığını tespit et (gelişmiş yöntem)
    let devtools = { open: false, orientation: null }
    let devtoolsCheckCount = 0
    
    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160
      const heightThreshold = window.outerHeight - window.innerHeight > 160
      const orientation = widthThreshold ? 'vertical' : 'horizontal'

      // Firebug kontrolü
      const firebugDetected = window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized
      
      // DevTools açık mı kontrol et
      if (
        !(heightThreshold && widthThreshold) &&
        (firebugDetected || widthThreshold || heightThreshold)
      ) {
        if (!devtools.open || devtools.orientation !== orientation) {
          devtools.open = true
          devtools.orientation = orientation
          devtoolsCheckCount++
          
          // Developer Tools açıldıysa uyarı ver
          console.clear()
          console.log('%c⚠️ UYARI!', 'color: red; font-size: 50px; font-weight: bold;')
          console.log('%cBu site korumalıdır. Developer Tools kullanımı yasaktır!', 'color: red; font-size: 20px;')
          console.log('%cEğer bu siteyi test ediyorsanız, lütfen Developer Tools\'u kapatın.', 'color: orange; font-size: 16px;')
          
          // 3 kez tespit edilirse sayfayı yenile (spam'i önlemek için)
          if (devtoolsCheckCount >= 3) {
            // Sayfayı yenile
            window.location.reload()
          }
        }
      } else {
        if (devtools.open) {
          devtools.open = false
          devtools.orientation = null
          devtoolsCheckCount = 0 // Reset counter
        }
      }
      
      // Debugger statement ile kontrol (sadece production'da)
      if (process.env.NODE_ENV === 'production') {
        try {
          // Bu kod DevTools açıkken yavaş çalışır
          const start = performance.now()
          // eslint-disable-next-line no-debugger
          debugger
          const end = performance.now()
          
          // Eğer debugger çok hızlı geçildiyse DevTools açık demektir
          if (end - start > 100) {
            if (!devtools.open) {
              devtools.open = true
              devtoolsCheckCount++
              console.clear()
              console.log('%c⚠️ Developer Tools tespit edildi!', 'color: red; font-size: 30px; font-weight: bold;')
            }
          }
        } catch (e) {
          // Hata olursa DevTools açık olabilir
        }
      }
    }

    // Developer Tools kontrolünü periyodik olarak çalıştır
    const devToolsInterval = setInterval(detectDevTools, 500)

    // Event listener'ları ekle
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('selectstart', handleSelectStart)
    document.addEventListener('dragstart', handleDragStart)

    // Console.log'u override et (sadece production'da)
    let originalLog, originalClear, originalWarn, originalError
    if (process.env.NODE_ENV === 'production') {
      originalLog = console.log
      originalClear = console.clear
      originalWarn = console.warn
      originalError = console.error
      
      console.log = function() {
        // Production'da console.log'u engelle
        return
      }
      
      console.clear = function() {
        // Production'da console.clear'i engelle
        return
      }
      
      console.warn = function() {
        // Production'da console.warn'i engelle
        return
      }
      
      console.error = function() {
        // Production'da console.error'i engelle (opsiyonel - hataları görmek isterseniz kaldırın)
        return
      }
    }

    // Cleanup
    return () => {
      clearInterval(devToolsInterval)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('selectstart', handleSelectStart)
      document.removeEventListener('dragstart', handleDragStart)
      
      // Console'u geri yükle (sadece production'da override edildiyse)
      if (process.env.NODE_ENV === 'production' && originalLog) {
        console.log = originalLog
        console.clear = originalClear
        if (originalWarn) console.warn = originalWarn
        if (originalError) console.error = originalError
      }
    }
  }, [])

  return null // Bu bileşen görsel bir şey render etmiyor
}

