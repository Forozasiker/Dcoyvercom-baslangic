import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'

axios.defaults.withCredentials = true

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    handleCallback()
  }, [])

  const handleCallback = async () => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    
    if (!code) {
      navigate('/')
      return
    }

    try {
      const response = await axios.post('/api/auth/callback', { code, state })
      
      // Eğer yorum yetkilendirmesi ise
      if (response.data.commentAuthorized && state) {
        try {
          const stateData = JSON.parse(atob(state))
          if (stateData.type === 'comment') {
            setSuccess(true)
            setLoading(false)
            return
          }
        } catch (e) {
          // State decode hatası, normal akışa devam et
        }
      }
      
      // Başarılı giriş - kullanıcı bilgilerini kontrol et
      if (response.data.success && response.data.user) {
        // Session başarıyla oluşturuldu
        setLoading(false)
        // Sayfayı yenile ve kullanıcı bilgilerini yükle
        setTimeout(() => {
          window.location.href = '/'
        }, 300)
      } else {
        // Beklenmeyen response formatı
        setLoading(false)
        setTimeout(() => {
          window.location.href = '/'
        }, 500)
      }
    } catch (error) {
      console.error('Auth error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      setLoading(false)
      
      // Code expired hatası için özel mesaj
      if (error.response?.data?.codeExpired) {
        setTimeout(() => {
          navigate('/')
        }, 3000)
        return
      }
      
      // Hata mesajını göster
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Giriş yapılamadı'
      alert(errorMessage)
      
      setTimeout(() => {
        navigate('/')
      }, 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Giriş yapılıyor...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Yetkilendirme Başarılı!</h2>
            <p className="text-gray-400 mb-6">
              Hesabınız başarıyla yetkilendirildi. Şimdi Discord'a geri dönüp <strong className="text-purple-400">"YORUM YAP"</strong> butonuna tekrar tıklayabilirsiniz.
            </p>
            <button
              onClick={() => {
                window.location.href = `discord://`
                setTimeout(() => {
                  navigate('/')
                }, 2000)
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
            >
              Discord'a Dön
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]">
      <div className="text-center">
        <p className="text-gray-400">Yönlendiriliyor...</p>
      </div>
    </div>
  )
}
