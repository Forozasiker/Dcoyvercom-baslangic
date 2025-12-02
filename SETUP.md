# DcOyver.com - Discord Sunucu Listesi

Modern ve animasyonlu Discord sunucu listesi platformu.

## Özellikler

### Bot Sistemi (DiscordSystem/)
- ✅ Prefix komutları: `oyver`, `oylar`, `setup`, `setupsil`
- ✅ MongoDB entegrasyonu
- ✅ Gerçek zamanlı istatistik güncelleme (her dakika)
- ✅ Sesli kanal takibi (anlık)
- ✅ Kategori sistemi (public/private/game)
- ✅ Modal builder ile setup sistemi

### Web Frontend (web/)
- ✅ React + Vite
- ✅ Express backend
- ✅ Discord OAuth girişi
- ✅ Oy verme sistemi (captcha korumalı)
- ✅ Yorum sistemi
- ✅ Top 100 sıralaması
- ✅ Kategori navigasyonu
- ✅ Çoklu dil desteği (TR/EN)
- ✅ Dark/Light mode
- ✅ Animasyonlu UI
- ✅ Responsive tasarım

## Kurulum

### 1. Discord Bot

```bash
cd DiscordSystem
npm install
```

`settings.json` dosyasını düzenleyin:
```json
{
  "token": "DISCORD_BOT_TOKEN",
  "clientId": "DISCORD_CLIENT_ID",
  "mongoUri": "mongodb://localhost:27017/dcoyver"
}
```

Botu başlatın:
```bash
node bot.js
```

### 2. Web Uygulaması

```bash
cd web
npm install
```

`.env` dosyasını oluşturun:
```env
MONGODB_URI=mongodb://localhost:27017/dcoyver
SESSION_SECRET=your-secret-key-here
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_REDIRECT_URI=http://localhost:5000/api/auth/callback
```

Uygulamayı başlatın:
```bash
npm run dev
```

Bu komut hem Express server'ı (port 5000) hem de Vite dev server'ı (port 5173) başlatır.

## Kullanım

### Bot Komutları

**Setup (Sadece Yöneticiler)**
```
oyver setup
```
Modal açılır ve şunları ayarlarsınız:
- Sunucu kategorisi (public/private/game)
- Açıklama
- Davet linki

**Setup Silme**
```
oyver setupsil
```
Onay butonu çıkar:
- ✅ **Evet, Sil**: Sunucuyu, tüm oyları ve yorumları siler
- ❌ **İptal**: İşlemi iptal eder

**Oy Verme**
```
oyver <sunucu_id>
```

**Oy Listesi**
```
oylar
```

### Web Özellikleri

1. **Ana Sayfa**: Tüm sunucuları görüntüle, kategorilere göre filtrele
2. **Top 100**: En çok oy alan sunucular
3. **Sunucu Detay**: Oy ver, yorum yap, istatistikleri gör
4. **Ayarlar**: Dil değiştir (TR/EN), tema değiştir (Dark/Light)

### Gerçek Zamanlı Güncellemeler

Bot her dakika şunları günceller:
- Online üye sayısı
- Sesli kanaldaki üye sayısı
- Boost sayısı

Sesli kanal değişiklikleri anlık güncellenir.

## Teknolojiler

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- Discord.js v14
- Express Session

### Frontend
- React 18
- Vite
- React Router v6
- Axios
- Tailwind CSS

## Veritabanı Şemaları

### Guild (Sunucu)
- guildId, name, description
- category (public/private/game)
- memberCount, onlineCount, voiceCount, boostCount
- totalVotes, iconURL, bannerURL, inviteURL

### Vote (Oy)
- userId, guildId
- votedAt (12 saat cooldown)

### Comment (Yorum)
- userId, guildId, username, avatar
- content, createdAt

## Port Bilgileri

- Express Server: `http://localhost:5000`
- Vite Dev Server: `http://localhost:5173`
- MongoDB: `mongodb://localhost:27017`

## Notlar

- Oy verme cooldown: 12 saat
- Captcha koruması aktif
- Discord OAuth gerekli
- MongoDB bağlantısı gerekli
