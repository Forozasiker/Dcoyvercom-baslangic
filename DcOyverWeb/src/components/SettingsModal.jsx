import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose }) => {
  const [language, setLanguage] = useState('tr');
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'tr';
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setLanguage(savedLanguage);
    setTheme(savedTheme);
    
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    window.dispatchEvent(new Event('languageChange'));
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#1a1a2e] rounded-2xl p-6 w-full max-w-md mx-4 border border-purple-500/20" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Ayarlar</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Dil / Language</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleLanguageChange('tr')}
                className={`p-3 rounded-lg border transition-all ${
                  language === 'tr'
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-[#0f0f1e] border-gray-700 text-gray-400 hover:border-purple-500/50'
                }`}
              >
                🇹🇷 Türkçe
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`p-3 rounded-lg border transition-all ${
                  language === 'en'
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-[#0f0f1e] border-gray-700 text-gray-400 hover:border-purple-500/50'
                }`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Tema / Theme</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-3 rounded-lg border transition-all ${
                  theme === 'dark'
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-[#0f0f1e] border-gray-700 text-gray-400 hover:border-purple-500/50'
                }`}
              >
                🌙 Karanlık
              </button>
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-3 rounded-lg border transition-all ${
                  theme === 'light'
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-[#0f0f1e] border-gray-700 text-gray-400 hover:border-purple-500/50'
                }`}
              >
                ☀️ Aydınlık
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
