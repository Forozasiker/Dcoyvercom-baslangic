import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import { useTranslation } from '../lib/translations'

export default function HizmetKosullari() {
  const [t, setT] = useState(() => useTranslation())

  useEffect(() => {
    const handleLanguageChange = () => {
      setT(() => useTranslation())
    }
    
    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  const isEn = localStorage.getItem('language') === 'en'

  return (
    <>
      <SEO 
        title={isEn ? 'Terms of Service - DcOyver.com' : 'Hizmet Koşulları - DcOyver.com'}
        description={isEn ? 'DcOyver Terms of Service - Read our terms and conditions for using our Discord bot and website services.' : 'DcOyver Hizmet Koşulları - Discord botumuzu ve web sitesi hizmetlerimizi kullanmak için şartlarımızı ve koşullarımızı okuyun.'}
        keywords="discord sunucu, discord server, discord oy ver, discord oy verme, discord vote, discord voting, discord oy botu, discord vote bot, discord voting bot, discord bot oy verme, oy verme discord bot, discord bot, discord bot listesi, discord bot list, discord sunucu listesi, discord server list, discord sunucu bul, discord server finder, discord sunucu arama, discord server search, discord topluluk, discord community, discord communities, discord servers, discord bots, discord türk, discord tr, discord türkiye, discord turkey, discord türkçe, discord turkish, discord oy verme botu, discord vote bot türkçe, discord bot türk, discord bot türkiye, discord bot türkçe, discord sunucu oy botu, discord server vote bot, discord oy sistemi, discord voting system, discord oy platformu, discord voting platform, discord sunucu tanıtım, discord server promotion, discord sunucu reklam, discord server advertisement, hizmet koşulları, terms of service, discord bot şartları, discord bot terms"
        url="https://dcoyver.com/hizmet-koşulları"
      />
      <div className="min-h-screen page-transition relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 left-0 w-full h-full bg-black"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 relative z-10">
          {/* Hero Section */}
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6">
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                {isEn ? 'Terms of Service' : 'Hizmet Koşulları'}
              </span>
            </h1>
            <div className="flex items-center justify-center gap-2 mt-4 mb-8">
              <div className="h-1 w-16 bg-gray-800"></div>
              <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
              <div className="h-1 w-16 bg-gray-800"></div>
            </div>
            <p className="text-gray-400 text-sm sm:text-base">
              {isEn ? 'Last Updated: January 2025' : 'Son Güncelleme: Ocak 2025'}
            </p>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            {/* Introduction */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {isEn ? '1. Acceptance of Terms' : '1. Koşulların Kabulü'}
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg">
                {isEn
                  ? 'By accessing or using DcOyver\'s Discord bot and website services ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.'
                  : 'DcOyver\'ın Discord botunu ve web sitesi hizmetlerini ("Hizmet") kullanarak veya erişerek, bu Hizmet Koşullarına ("Koşullar") bağlı kalmayı kabul edersiniz. Bu koşulların herhangi bir bölümüne katılmıyorsanız, Hizmete erişemezsiniz.'}
              </p>
            </div>

            {/* Description of Service */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {isEn ? '2. Description of Service' : '2. Hizmet Açıklaması'}
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg mb-4">
                {isEn
                  ? 'DcOyver provides a Discord bot and web platform that allows users to:'
                  : 'DcOyver, kullanıcıların aşağıdakileri yapmasına olanak tanıyan bir Discord botu ve web platformu sağlar:'}
              </p>
              <ul className="list-disc list-inside space-y-3 text-gray-300 text-sm sm:text-base ml-4">
                <li>{isEn ? 'List and promote Discord servers' : 'Discord sunucularını listelemek ve tanıtmak'}</li>
                <li>{isEn ? 'Vote for Discord servers' : 'Discord sunucuları için oy vermek'}</li>
                <li>{isEn ? 'View server rankings and statistics' : 'Sunucu sıralamalarını ve istatistiklerini görüntülemek'}</li>
                <li>{isEn ? 'Comment and rate Discord servers' : 'Discord sunucularına yorum yapmak ve puan vermek'}</li>
                <li>{isEn ? 'Receive vote notifications' : 'Oy bildirimleri almak'}</li>
              </ul>
            </div>

            {/* User Accounts */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {isEn ? '3. User Accounts' : '3. Kullanıcı Hesapları'}
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg mb-4">
                {isEn
                  ? 'To use certain features of our Service, you must authenticate through Discord OAuth2. By doing so, you agree to:'
                  : 'Hizmetimizin belirli özelliklerini kullanmak için Discord OAuth2 aracılığıyla kimlik doğrulaması yapmanız gerekir. Bunu yaparak, aşağıdakileri kabul edersiniz:'}
              </p>
              <ul className="list-disc list-inside space-y-3 text-gray-300 text-sm sm:text-base ml-4">
                <li>{isEn ? 'Provide accurate and complete information' : 'Doğru ve eksiksiz bilgi sağlamak'}</li>
                <li>{isEn ? 'Maintain the security of your account' : 'Hesabınızın güvenliğini korumak'}</li>
                <li>{isEn ? 'Accept responsibility for all activities under your account' : 'Hesabınız altındaki tüm faaliyetlerden sorumluluğu kabul etmek'}</li>
                <li>{isEn ? 'Notify us immediately of any unauthorized use' : 'Yetkisiz kullanımı derhal bize bildirmek'}</li>
              </ul>
            </div>

            {/* Acceptable Use */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {isEn ? '4. Acceptable Use' : '4. Kabul Edilebilir Kullanım'}
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg mb-4">
                {isEn
                  ? 'You agree NOT to use the Service to:'
                  : 'Hizmeti aşağıdakiler için KULLANMAYACAĞINIZI kabul edersiniz:'}
              </p>
              <ul className="list-disc list-inside space-y-3 text-gray-300 text-sm sm:text-base ml-4">
                <li>{isEn ? 'Violate any applicable laws or regulations' : 'Geçerli yasaları veya düzenlemeleri ihlal etmek'}</li>
                <li>{isEn ? 'Infringe upon the rights of others' : 'Başkalarının haklarını ihlal etmek'}</li>
                <li>{isEn ? 'Post false, misleading, or fraudulent information' : 'Yanlış, yanıltıcı veya sahte bilgiler yayınlamak'}</li>
                <li>{isEn ? 'Spam, abuse, or harass other users' : 'Diğer kullanıcıları spam, kötüye kullanmak veya taciz etmek'}</li>
                <li>{isEn ? 'Attempt to manipulate votes or rankings through automated means' : 'Otomatik araçlarla oyları veya sıralamaları manipüle etmeye çalışmak'}</li>
                <li>{isEn ? 'Upload malicious code, viruses, or harmful content' : 'Kötü amaçlı kod, virüs veya zararlı içerik yüklemek'}</li>
                <li>{isEn ? 'Impersonate others or provide false identity information' : 'Başkalarını taklit etmek veya yanlış kimlik bilgileri sağlamak'}</li>
                <li>{isEn ? 'Interfere with or disrupt the Service' : 'Hizmeti engellemek veya bozmak'}</li>
              </ul>
            </div>

            {/* Voting Rules */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {isEn ? '5. Voting Rules' : '5. Oy Verme Kuralları'}
              </h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg">
                  {isEn
                    ? 'When voting for Discord servers:'
                    : 'Discord sunucuları için oy verirken:'}
                </p>
                <ul className="list-disc list-inside space-y-3 text-gray-300 text-sm sm:text-base ml-4">
                  <li>{isEn ? 'You can vote once per server every 12 hours' : 'Her sunucu için 12 saatte bir oy verebilirsiniz'}</li>
                  <li>{isEn ? 'Votes must be genuine and not manipulated' : 'Oylar gerçek olmalı ve manipüle edilmemelidir'}</li>
                  <li>{isEn ? 'Multiple accounts or automated voting is strictly prohibited' : 'Çoklu hesaplar veya otomatik oylama kesinlikle yasaktır'}</li>
                  <li>{isEn ? 'We reserve the right to remove fraudulent votes' : 'Sahte oyları kaldırma hakkını saklı tutarız'}</li>
                </ul>
              </div>
            </div>

            {/* Content and Comments */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {isEn ? '6. User Content and Comments' : '6. Kullanıcı İçeriği ve Yorumlar'}
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg mb-4">
                {isEn
                  ? 'You are responsible for any content you post, including comments and ratings. You agree that:'
                  : 'Yorumlar ve puanlamalar dahil olmak üzere yayınladığınız herhangi bir içerikten siz sorumlusunuz. Aşağıdakileri kabul edersiniz:'}
              </p>
              <ul className="list-disc list-inside space-y-3 text-gray-300 text-sm sm:text-base ml-4">
                <li>{isEn ? 'Your content does not violate any laws or rights of others' : 'İçeriğiniz herhangi bir yasayı veya başkalarının haklarını ihlal etmez'}</li>
                <li>{isEn ? 'Your content is not offensive, abusive, or harmful' : 'İçeriğiniz saldırgan, kötüye kullanıcı veya zararlı değildir'}</li>
                <li>{isEn ? 'You grant us a license to use, display, and distribute your content' : 'Bize içeriğinizi kullanma, gösterme ve dağıtma lisansı verirsiniz'}</li>
                <li>{isEn ? 'We may remove content that violates these Terms' : 'Bu Koşulları ihlal eden içeriği kaldırabiliriz'}</li>
              </ul>
            </div>

            {/* Intellectual Property */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {isEn ? '7. Intellectual Property' : '7. Fikri Mülkiyet'}
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg">
                {isEn
                  ? 'The Service and its original content, features, and functionality are owned by DcOyver and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of our Service without our written permission.'
                  : 'Hizmet ve orijinal içeriği, özellikleri ve işlevselliği DcOyver\'a aittir ve uluslararası telif hakkı, marka, patent, ticari sır ve diğer fikri mülkiyet yasalarıyla korunmaktadır. Yazılı iznimiz olmadan Hizmetimizin herhangi bir bölümünü kopyalayamaz, değiştiremez, dağıtamaz, satamaz veya kiralayamazsınız.'}
              </p>
            </div>

            {/* Termination */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {isEn ? '8. Termination' : '8. Fesih'}
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg">
                {isEn
                  ? 'We may terminate or suspend your access to the Service immediately, without prior notice, for any reason, including if you breach these Terms. Upon termination, your right to use the Service will cease immediately.'
                  : 'Bu Koşulları ihlal etmeniz dahil olmak üzere herhangi bir nedenle, önceden haber vermeden Hizmete erişiminizi derhal sonlandırabilir veya askıya alabiliriz. Fesih üzerine, Hizmeti kullanma hakkınız derhal sona erecektir.'}
              </p>
            </div>

            {/* Disclaimer */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {isEn ? '9. Disclaimer' : '9. Sorumluluk Reddi'}
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg mb-4">
                {isEn
                  ? 'The Service is provided "as is" and "as available" without warranties of any kind. We do not guarantee that:'
                  : 'Hizmet "olduğu gibi" ve "mevcut olduğu şekilde" herhangi bir garanti olmadan sağlanmaktadır. Aşağıdakileri garanti etmiyoruz:'}
              </p>
              <ul className="list-disc list-inside space-y-3 text-gray-300 text-sm sm:text-base ml-4">
                <li>{isEn ? 'The Service will be uninterrupted or error-free' : 'Hizmetin kesintisiz veya hatasız olacağı'}</li>
                <li>{isEn ? 'Defects will be corrected' : 'Kusurların düzeltileceği'}</li>
                <li>{isEn ? 'The Service is free of viruses or harmful components' : 'Hizmetin virüs veya zararlı bileşenlerden arınmış olduğu'}</li>
              </ul>
            </div>

            {/* Limitation of Liability */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {isEn ? '10. Limitation of Liability' : '10. Sorumluluk Sınırlaması'}
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg">
                {isEn
                  ? 'In no event shall DcOyver, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.'
                  : 'Hiçbir durumda DcOyver, yöneticileri, çalışanları, ortakları, acenteleri, tedarikçileri veya bağlı kuruluşları, Hizmeti kullanmanızdan kaynaklanan, kar kaybı, veri, kullanım, itibar veya diğer maddi olmayan kayıplar dahil ancak bunlarla sınırlı olmamak üzere, dolaylı, arızi, özel, sonuç olarak ortaya çıkan veya cezai zararlardan sorumlu tutulamaz.'}
              </p>
            </div>

            {/* Changes to Terms */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {isEn ? '11. Changes to Terms' : '11. Koşullardaki Değişiklikler'}
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg">
                {isEn
                  ? 'We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.'
                  : 'Bu Koşulları istediğimiz zaman değiştirme veya değiştirme hakkını saklı tutarız. Bir revizyon önemliyse, yeni koşulların yürürlüğe girmesinden en az 30 gün önce bildirimde bulunacağız. Önemli bir değişikliğin ne oluşturduğu tek başımıza takdirimize bağlı olacaktır.'}
              </p>
            </div>

            {/* Contact */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {isEn ? '12. Contact Information' : '12. İletişim Bilgileri'}
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg mb-4">
                {isEn
                  ? 'If you have any questions about these Terms of Service, please contact us:'
                  : 'Bu Hizmet Koşulları hakkında herhangi bir sorunuz varsa, lütfen bizimle iletişime geçin:'}
              </p>
              <div className="space-y-2 text-gray-300 text-sm sm:text-base">
                <p><strong className="text-white">{isEn ? 'Email:' : 'E-posta:'}</strong> support@dcoyver.com</p>
                <p><strong className="text-white">{isEn ? 'Discord:' : 'Discord:'}</strong> <a href="https://discord.gg/dcoyver" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">discord.gg/dcoyver</a></p>
                <p><strong className="text-white">{isEn ? 'Website:' : 'Web Sitesi:'}</strong> <a href="https://dcoyver.com" className="text-blue-400 hover:text-blue-300 underline">dcoyver.com</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

