export const translations = {
  tr: {
    nav: {
      home: 'Ana Sayfa',
      top100: 'Top 100',
      addServer: 'Sunucu Ekle',
      login: 'Giriş Yap',
      logout: 'Çıkış Yap'
    },
    hero: {
      title: 'Discord Sunucunu Büyüt',
      subtitle: 'Sunucunu listele, oy topla ve topluluğunu genişlet',
      search: 'Sunucu ara...'
    },
    categories: {
      all: 'Tümü',
      public: 'Genel',
      private: 'Özel',
      game: 'Oyun'
    },
    serverCard: {
      online: 'Çevrimiçi',
      voice: 'Sesli',
      boost: 'Boost',
      votes: 'Oy'
    },
    serverDetail: {
      vote: 'Oy Ver',
      voted: 'Oy Verildi',
      nextVote: 'Sonraki oy:',
      description: 'Açıklama',
      stats: 'İstatistikler',
      comments: 'Yorumlar',
      writeComment: 'Yorum yaz...',
      send: 'Gönder',
      loginToComment: 'Yorum yapmak için giriş yapın',
      loginToVote: 'Oy vermek için giriş yapın'
    },
    top100: {
      title: 'Top 100 Sunucular',
      subtitle: 'En çok oy alan sunucular'
    },
    footer: {
      about: 'Hakkımızda',
      terms: 'Kullanım Şartları',
      privacy: 'Gizlilik Politikası',
      contact: 'İletişim',
      rights: 'Tüm hakları saklıdır.'
    }
  },
  en: {
    nav: {
      home: 'Home',
      top100: 'Top 100',
      addServer: 'Add Server',
      login: 'Login',
      logout: 'Logout'
    },
    hero: {
      title: 'Grow Your Discord Server',
      subtitle: 'List your server, collect votes and expand your community',
      search: 'Search servers...'
    },
    categories: {
      all: 'All',
      public: 'Public',
      private: 'Private',
      game: 'Game'
    },
    serverCard: {
      online: 'Online',
      voice: 'Voice',
      boost: 'Boost',
      votes: 'Votes'
    },
    serverDetail: {
      vote: 'Vote',
      voted: 'Voted',
      nextVote: 'Next vote:',
      description: 'Description',
      stats: 'Statistics',
      comments: 'Comments',
      writeComment: 'Write a comment...',
      send: 'Send',
      loginToComment: 'Login to comment',
      loginToVote: 'Login to vote'
    },
    top100: {
      title: 'Top 100 Servers',
      subtitle: 'Most voted servers'
    },
    footer: {
      about: 'About',
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      contact: 'Contact',
      rights: 'All rights reserved.'
    }
  }
};

export const useTranslation = () => {
  const language = localStorage.getItem('language') || 'tr';
  return (key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };
};
