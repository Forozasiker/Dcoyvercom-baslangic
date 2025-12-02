import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0f] border-t border-white/10 mt-12 sm:mt-16 md:mt-20">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Logo & Description */}
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/DcOyver.png" 
                alt="DcOyver Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold text-white">DcOyver.com</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              DcOyver, Discord sunucularınızı tanıtmak ve keşfetmek için tasarlanmış modern bir oy verme botudur. 
              Sunucunuzu listeleyin, oy toplayın ve topluluğunuzu büyütün. 
              Kolay kurulum, detaylı istatistikler ve güçlü özelliklerle Discord sunucunuzu bir üst seviyeye taşıyın.
            </p>
          </div>

          {/* Bağlantılar */}
          <div>
            <h3 className="text-white font-bold mb-4">Bağlantılar</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-gray-300 transition text-sm">
                  Tüm Sunucular
                </Link>
              </li>
              <li>
                <Link to="/kategori/public" className="text-gray-400 hover:text-purple-400 transition text-sm">
                  Public Sunucular
                </Link>
              </li>
              <li>
                <Link to="/kategori/game" className="text-gray-400 hover:text-purple-400 transition text-sm">
                  Oyun Sunucuları
                </Link>
              </li>
              <li>
                <Link to="/kategori/private" className="text-gray-400 hover:text-purple-400 transition text-sm">
                  Priv Sunucuları
                </Link>
              </li>
              <li>
                <Link to="/top100" className="text-gray-400 hover:text-purple-400 transition text-sm">
                  Top 100
                </Link>
              </li>
            </ul>
          </div>

          {/* Şirket */}
          <div>
            <h3 className="text-white font-bold mb-4">Şirket</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/hakkımızda" className="text-gray-400 hover:text-purple-400 transition text-sm">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-400 hover:text-purple-400 transition text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/yardım-merkezi" className="text-gray-400 hover:text-purple-400 transition text-sm">
                  Yardım Merkezi
                </Link>
              </li>
              <li>
                <Link to="/iletişim" className="text-gray-400 hover:text-purple-400 transition text-sm">
                  İletişim
                </Link>
              </li>
              <li>
                <Link to="/servis-durumu" className="text-gray-400 hover:text-purple-400 transition text-sm">
                  Servis Durumu
                </Link>
              </li>
              <li>
                <Link to="/gizlilik-politikası" className="text-gray-400 hover:text-purple-400 transition text-sm">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link to="/hizmet-koşulları" className="text-gray-400 hover:text-purple-400 transition text-sm">
                  Hizmet Koşulları
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social & Copyright */}
        <div className="border-t border-white/10 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © 2025 DcOyver.com - Tüm hakları saklıdır.
          </p>

          <div className="flex items-center gap-4">
            <a 
              href="https://discord.gg/dcoyver" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-purple-400 transition"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a>
            <a 
              href="https://twitter.com/dcoyver" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-purple-400 transition"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a 
              href="https://instagram.com/dcoyver" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-purple-400 transition"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
