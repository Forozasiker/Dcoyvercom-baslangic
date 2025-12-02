import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import { useTranslation } from '../lib/translations'

export default function GizlilikPolitikasi() {
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
        title={isEn ? 'Privacy Policy - DcOyver.com' : 'Gizlilik Politikası - DcOyver.com'}
        description={isEn ? 'DcOyver Privacy Policy - Learn how we collect, use, and protect your data.' : 'DcOyver Gizlilik Politikası - Verilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu öğrenin.'}
        keywords="discord sunucu, discord server, discord oy ver, discord oy verme, discord vote, discord voting, discord oy botu, discord vote bot, discord voting bot, discord bot oy verme, oy verme discord bot, discord bot, discord bot listesi, discord bot list, discord sunucu listesi, discord server list, discord sunucu bul, discord server finder, discord sunucu arama, discord server search, discord topluluk, discord community, discord communities, discord servers, discord bots, discord türk, discord tr, discord türkiye, discord turkey, discord türkçe, discord turkish, discord oy verme botu, discord vote bot türkçe, discord bot türk, discord bot türkiye, discord bot türkçe, discord sunucu oy botu, discord server vote bot, discord oy sistemi, discord voting system, discord oy platformu, discord voting platform, discord sunucu tanıtım, discord server promotion, discord sunucu reklam, discord server advertisement, gizlilik politikası, privacy policy, discord bot gizlilik, discord bot privacy"
        url="https://dcoyver.com/gizlilik-politikası"
      />
      <div className="min-h-screen page-transition relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 left-0 w-full h-full bg-black"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 relative z-10">
          {/* Hero Section */}
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6">
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {isEn ? 'Privacy Policy' : 'Gizlilik Politikası'}
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
                {isEn ? '1. Introduction' : '1. Giriş'}
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg">
                {isEn 
                  ? 'DcOyver ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Discord bot and website services.'
                  : 'DcOyver ("biz", "bizim" veya "biz") gizliliğinizi korumaya kararlıyız. Bu Gizlilik Politikası, Discord botumuzu ve web sitesi hizmetlerimizi kullandığınızda bilgilerinizi nasıl topladığımızı, kullandığımızı, açıkladığımızı ve koruduğumuzu açıklar.'}
              </p>
            </div>

            {/* Information We Collect */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {isEn ? '2. Information We Collect' : '2. Topladığımız Bilgiler'}
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {isEn ? '2.1 Discord User Data' : '2.1 Discord Kullanıcı Verileri'}
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                    {isEn
                      ? 'When you use our Discord bot, we may collect the following information:'
                      : 'Discord botumuzu kullandığınızda, aşağıdaki bilgileri toplayabiliriz:'}
                  </p>
                  <ul className="list-disc list-inside mt-3 space-y-2 text-gray-300 text-sm sm:text-base ml-4">
                    <li>{isEn ? 'Discord User ID' : 'Discord Kullanıcı ID\'si'}</li>
                    <li>{isEn ? 'Discord Username and Display Name' : 'Discord Kullanıcı Adı ve Görünen İsim'}</li>
                    <li>{isEn ? 'Discord Avatar URL' : 'Discord Avatar URL\'si'}</li>
                    <li>{isEn ? 'Server (Guild) IDs where the bot is used' : 'Botun kullanıldığı Sunucu (Guild) ID\'leri'}</li>
                    <li>{isEn ? 'Vote data and timestamps' : 'Oy verileri ve zaman damgaları'}</li>
                    <li>{isEn ? 'Comments and ratings you submit' : 'Gönderdiğiniz yorumlar ve puanlamalar'}</li>
                  </ul>
                </div>
                <div className="mt-6">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {isEn ? '2.2 Website Usage Data' : '2.2 Web Sitesi Kullanım Verileri'}
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                    {isEn
                      ? 'When you visit our website, we may collect:'
                      : 'Web sitemizi ziyaret ettiğinizde, toplayabileceğimiz veriler:'}
                  </p>
                  <ul className="list-disc list-inside mt-3 space-y-2 text-gray-300 text-sm sm:text-base ml-4">
                    <li>{isEn ? 'IP address' : 'IP adresi'}</li>
                    <li>{isEn ? 'Browser type and version' : 'Tarayıcı türü ve sürümü'}</li>
                    <li>{isEn ? 'Pages visited and time spent' : 'Ziyaret edilen sayfalar ve harcanan süre'}</li>
                    <li>{isEn ? 'Referral source' : 'Yönlendirme kaynağı'}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How We Use Information */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {isEn ? '3. How We Use Your Information' : '3. Bilgilerinizi Nasıl Kullanıyoruz'}
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg mb-4">
                {isEn
                  ? 'We use the collected information for the following purposes:'
                  : 'Toplanan bilgileri aşağıdaki amaçlar için kullanıyoruz:'}
              </p>
              <ul className="list-disc list-inside space-y-3 text-gray-300 text-sm sm:text-base ml-4">
                <li>{isEn ? 'To provide and maintain our Discord bot and website services' : 'Discord botumuzu ve web sitesi hizmetlerimizi sağlamak ve sürdürmek'}</li>
                <li>{isEn ? 'To process votes and display server rankings' : 'Oyları işlemek ve sunucu sıralamalarını göstermek'}</li>
                <li>{isEn ? 'To allow users to comment and rate Discord servers' : 'Kullanıcıların Discord sunucularına yorum yapmasına ve puan vermesine izin vermek'}</li>
                <li>{isEn ? 'To improve our services and user experience' : 'Hizmetlerimizi ve kullanıcı deneyimini geliştirmek'}</li>
                <li>{isEn ? 'To send notifications about vote cooldowns (if enabled)' : 'Oy bekleme süreleri hakkında bildirimler göndermek (etkinleştirilirse)'}</li>
                <li>{isEn ? 'To prevent fraud and abuse' : 'Dolandırıcılığı ve kötüye kullanımı önlemek'}</li>
              </ul>
            </div>

            {/* Data Sharing */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {isEn ? '4. Data Sharing and Disclosure' : '4. Veri Paylaşımı ve Açıklama'}
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg mb-4">
                {isEn
                  ? 'We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:'
                  : 'Kişisel bilgilerinizi üçüncü taraflara satmıyor, takas etmiyor veya kiralamıyoruz. Bilgilerinizi yalnızca aşağıdaki durumlarda paylaşabiliriz:'}
              </p>
              <ul className="list-disc list-inside space-y-3 text-gray-300 text-sm sm:text-base ml-4">
                <li>{isEn ? 'With your explicit consent' : 'Açık rızanızla'}</li>
                <li>{isEn ? 'To comply with legal obligations or court orders' : 'Yasal yükümlülükleri veya mahkeme kararlarını yerine getirmek için'}</li>
                <li>{isEn ? 'To protect our rights, privacy, safety, or property' : 'Haklarımızı, gizliliğimizi, güvenliğimizi veya mülkümüzü korumak için'}</li>
                <li>{isEn ? 'With service providers who assist us in operating our services (under strict confidentiality agreements)' : 'Hizmetlerimizi işletmemize yardımcı olan hizmet sağlayıcılarla (katı gizlilik anlaşmaları altında)'}</li>
              </ul>
            </div>

            {/* Data Security */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {isEn ? '5. Data Security' : '5. Veri Güvenliği'}
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg">
                {isEn
                  ? 'We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.'
                  : 'Kişisel bilgilerinizi yetkisiz erişime, değişikliğe, açıklamaya veya yok edilmeye karşı korumak için uygun teknik ve organizasyonel güvenlik önlemleri uyguluyoruz. Ancak, İnternet üzerinden iletilme veya elektronik depolama yöntemi %100 güvenli değildir.'}
              </p>
            </div>

            {/* Your Rights */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {isEn ? '6. Your Rights' : '6. Haklarınız'}
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg mb-4">
                {isEn
                  ? 'You have the right to:'
                  : 'Aşağıdaki haklara sahipsiniz:'}
              </p>
              <ul className="list-disc list-inside space-y-3 text-gray-300 text-sm sm:text-base ml-4">
                <li>{isEn ? 'Access your personal data' : 'Kişisel verilerinize erişmek'}</li>
                <li>{isEn ? 'Request correction of inaccurate data' : 'Yanlış verilerin düzeltilmesini talep etmek'}</li>
                <li>{isEn ? 'Request deletion of your data' : 'Verilerinizin silinmesini talep etmek'}</li>
                <li>{isEn ? 'Object to processing of your data' : 'Verilerinizin işlenmesine itiraz etmek'}</li>
                <li>{isEn ? 'Request data portability' : 'Veri taşınabilirliği talep etmek'}</li>
              </ul>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg mt-4">
                {isEn
                  ? 'To exercise these rights, please contact us at: support@dcoyver.com or through our Discord server.'
                  : 'Bu haklarınızı kullanmak için lütfen bizimle iletişime geçin: support@dcoyver.com veya Discord sunucumuz aracılığıyla.'}
              </p>
            </div>

            {/* Cookies */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {isEn ? '7. Cookies and Tracking' : '7. Çerezler ve İzleme'}
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg">
                {isEn
                  ? 'We use cookies and similar tracking technologies to track activity on our website and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.'
                  : 'Web sitemizdeki aktiviteyi takip etmek ve belirli bilgileri saklamak için çerezler ve benzer izleme teknolojileri kullanıyoruz. Tarayıcınıza tüm çerezleri reddetmesini veya bir çerez gönderildiğinde belirtmesini söyleyebilirsiniz. Ancak, çerezleri kabul etmezseniz, hizmetimizin bazı bölümlerini kullanamayabilirsiniz.'}
              </p>
            </div>

            {/* Children's Privacy */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {isEn ? '8. Children\'s Privacy' : '8. Çocukların Gizliliği'}
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg">
                {isEn
                  ? 'Our services are not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.'
                  : 'Hizmetlerimiz 13 yaşın altındaki çocuklar için tasarlanmamıştır. 13 yaşın altındaki çocuklardan bilerek kişisel bilgi toplamıyoruz. Eğer bir ebeveyn veya vasisiniz ve çocuğunuzun bize kişisel bilgi sağladığına inanıyorsanız, lütfen derhal bizimle iletişime geçin.'}
              </p>
            </div>

            {/* Changes to Policy */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {isEn ? '9. Changes to This Privacy Policy' : '9. Bu Gizlilik Politikasındaki Değişiklikler'}
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg">
                {isEn
                  ? 'We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.'
                  : 'Gizlilik Politikamızı zaman zaman güncelleyebiliriz. Değişiklikleri bu sayfada yeni Gizlilik Politikasını yayınlayarak ve "Son Güncelleme" tarihini güncelleyerek bildireceğiz. Bu Gizlilik Politikasını periyodik olarak gözden geçirmeniz önerilir.'}
              </p>
            </div>

            {/* Contact */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {isEn ? '10. Contact Us' : '10. Bize Ulaşın'}
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base md:text-lg mb-4">
                {isEn
                  ? 'If you have any questions about this Privacy Policy, please contact us:'
                  : 'Bu Gizlilik Politikası hakkında herhangi bir sorunuz varsa, lütfen bizimle iletişime geçin:'}
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

