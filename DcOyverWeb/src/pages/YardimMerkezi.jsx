import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../lib/translations'
import SEO from '../components/SEO'

export default function YardimMerkezi() {
  const [t, setT] = useState(() => useTranslation())

  useEffect(() => {
    const handleLanguageChange = () => {
      setT(() => useTranslation())
    }
    
    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  const isEn = localStorage.getItem('language') === 'en'

  const faqs = [
    {
      question: localStorage.getItem('language') === 'en' ? 'How do I add my server?' : 'Sunucumu nasıl eklerim?',
      answer: localStorage.getItem('language') === 'en' 
        ? 'Use the /setup command in your Discord server. Fill in the required information and your server will be listed!'
        : 'Discord sunucunuzda /setup komutunu kullanın. Gerekli bilgileri doldurun ve sunucunuz listelenecek!'
    },
    {
      question: localStorage.getItem('language') === 'en' ? 'How does the voting system work?' : 'Oy verme sistemi nasıl çalışır?',
      answer: localStorage.getItem('language') === 'en' 
        ? 'Users can vote for your server every 12 hours. They need to solve a simple math captcha to prevent spam.'
        : 'Kullanıcılar sunucunuz için 12 saatte bir oy verebilir. Spam\'i önlemek için basit bir matematik captcha çözmeleri gerekir.'
    },
    {
      question: localStorage.getItem('language') === 'en' ? 'How do I enable notifications?' : 'Bildirimleri nasıl aktif ederim?',
      answer: localStorage.getItem('language') === 'en' 
        ? 'Click the "BİLDİRİM" button on the vote panel. You\'ll receive a DM when your 12-hour cooldown expires!'
        : 'Oy panelindeki "BİLDİRİM" butonuna tıklayın. 12 saatlik bekleme süreniz dolduğunda DM alacaksınız!'
    },
    {
      question: localStorage.getItem('language') === 'en' ? 'Can I comment on servers?' : 'Sunuculara yorum yapabilir miyim?',
      answer: localStorage.getItem('language') === 'en' 
        ? 'Yes! Click "YORUM YAP" on any vote panel, write your comment and rate the server (1-5 stars).'
        : 'Evet! Herhangi bir oy panelindeki "YORUM YAP" butonuna tıklayın, yorumunuzu yazın ve sunucuyu puanlayın (1-5 yıldız).'
    },
    {
      question: localStorage.getItem('language') === 'en' ? 'How are rankings calculated?' : 'Sıralamalar nasıl hesaplanır?',
      answer: localStorage.getItem('language') === 'en' 
        ? 'Rankings are based on total votes, member count, online users, voice channels, camera and stream statistics.'
        : 'Sıralamalar toplam oy, üye sayısı, online kullanıcılar, ses kanalları, kamera ve yayın istatistiklerine göre hesaplanır.'
    }
  ]

  return (
    <>
      <SEO 
        title={isEn ? 'Help Center - DcOyver.com' : 'Yardım Merkezi - DcOyver.com'}
        description={isEn ? 'DcOyver Help Center - Find answers to frequently asked questions about our Discord bot and server listing platform.' : 'DcOyver Yardım Merkezi - Discord botumuz ve sunucu listeleme platformumuz hakkında sık sorulan soruların yanıtlarını bulun.'}
        keywords="discord sunucu, discord server, discord oy ver, discord oy verme, discord vote, discord voting, discord oy botu, discord vote bot, discord voting bot, discord bot oy verme, oy verme discord bot, discord bot, discord bot listesi, discord bot list, discord sunucu listesi, discord server list, discord sunucu bul, discord server finder, discord sunucu arama, discord server search, discord topluluk, discord community, discord communities, discord servers, discord bots, discord türk, discord tr, discord türkiye, discord turkey, discord türkçe, discord turkish, discord oy verme botu, discord vote bot türkçe, discord bot türk, discord bot türkiye, discord bot türkçe, discord sunucu oy botu, discord server vote bot, discord oy sistemi, discord voting system, discord oy platformu, discord voting platform, discord sunucu tanıtım, discord server promotion, discord sunucu reklam, discord server advertisement, yardım merkezi, help center, discord bot yardım, discord bot help, sık sorulan sorular, faq, discord bot sorular, discord bot questions"
        url="https://dcoyver.com/yardım-merkezi"
      />
      <div className="min-h-screen page-transition relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-900/30 via-pink-900/20 to-transparent"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-6xl md:text-8xl font-black mb-6">
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent animate-gradient">
              {localStorage.getItem('language') === 'en' ? 'Help Center' : 'Yardım Merkezi'}
            </span>
          </h1>
          <div className="flex items-center justify-center gap-2 mt-4 mb-8">
            <div className="h-1 w-16 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <div className="h-1 w-16 bg-gradient-to-r from-transparent via-pink-500 to-transparent"></div>
          </div>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {localStorage.getItem('language') === 'en' 
              ? 'Find answers to frequently asked questions and get help with DcOyver'
              : 'Sık sorulan soruların cevaplarını bulun ve DcOyver ile ilgili yardım alın'}
          </p>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto space-y-6 mb-16">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-[#1a1a24] to-[#0f0f1a] border border-white/10 rounded-2xl p-8 shadow-2xl hover:border-purple-500/30 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">❓</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-red-500/20 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {localStorage.getItem('language') === 'en' ? 'Still Need Help?' : 'Hala Yardıma mı İhtiyacınız Var?'}
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              {localStorage.getItem('language') === 'en' 
                ? 'Join our Discord server and get support from our community!'
                : 'Discord sunucumuza katılın ve topluluğumuzdan destek alın!'}
            </p>
            <a
              href="https://discord.gg/Dcoyver"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/50"
            >
              {localStorage.getItem('language') === 'en' ? 'Join Discord Server' : 'Discord Sunucusuna Katıl'}
            </a>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

