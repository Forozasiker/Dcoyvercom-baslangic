# DcOyver.com Web

Modern Discord sunucu listesi

## Kurulum

```bash
npm install
```

`.env` dosyası oluştur:
```
MONGODB_URI=mongodb://localhost:27017/dcoyver
PORT=5000
SESSION_SECRET=your-super-secret-session-key-here
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Development için
DISCORD_REDIRECT_URI=http://localhost:3000/auth/callback
NODE_ENV=development

# Production için (domain üzerinden bağlanırken kullanılır)
DISCORD_REDIRECT_URI_PRODUCTION=https://dcoyver.com/auth/callback
```

**Not:** Backend artık otomatik olarak request'in geldiği origin'e göre doğru redirect URI'yi seçer. Hem localhost hem domain çalışır.

## Çalıştırma

```bash
npm run dev
```

Bu komut hem backend API'yi (port 5000) hem de frontend'i (port 3000) çalıştırır.

Tarayıcıda: `http://localhost:3000`

## Teknolojiler

- React 18 + Vite
- Express API
- MongoDB + Mongoose
- Tailwind CSS
