import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import axios from 'axios'
import helmet from 'helmet'
// import rateLimit, { MemoryStore } from 'express-rate-limit' // Rate limit tamamen kaldırıldı
import mongoSanitize from 'express-mongo-sanitize'
import { body, param, validationResult } from 'express-validator'
import xss from 'xss'
import { createServer } from 'http'
import { Server } from 'socket.io'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://dcoyver.com', 'http://dcoyver.com', 'https://www.dcoyver.com', 'http://www.dcoyver.com']
      : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Socket.io'yu global olarak erişilebilir yap
global.io = io

const PORT = process.env.PORT || 5000

// Güvenlik başlıkları
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "https://cdn.discordapp.com", "data:"],
      connectSrc: ["'self'", "https://discord.com"],
    },
  },
  crossOriginEmbedderPolicy: false
}))

// CORS ayarları
app.use(cors({
  origin: function (origin, callback) {
    // Production'da Cloudflare'den gelen istekler için özel kontrol
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? ['https://dcoyver.com', 'http://dcoyver.com', 'https://www.dcoyver.com', 'http://www.dcoyver.com']
      : ['http://0.0.0.0:80', 'http://localhost:80', 'http://127.0.0.1:80', 'http://0.0.0.0:3000', 'http://localhost:3000', 'https://dcoyver.com', 'http://dcoyver.com', 'http://13.91.84.221:84',"188.3.112.122"]
    
    // Origin yoksa (örn: Postman, curl) veya allowed origins'de varsa izin ver
    if (!origin || allowedOrigins.some(allowed => {
      try {
        if (origin.includes(allowed.replace(/^https?:\/\//, '').replace(/^www\./, ''))) return true
        const originUrl = new URL(origin)
        const allowedUrl = new URL(allowed)
        return originUrl.hostname === allowedUrl.hostname || 
               originUrl.hostname.replace(/^www\./, '') === allowedUrl.hostname.replace(/^www\./, '')
      } catch {
        return origin.includes(allowed)
      }
    })) {
      callback(null, true)
    } else {
      callback(new Error('CORS policy violation'))
    }
  },
  credentials: true
}))

// Body parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// MongoDB injection koruması
app.use(mongoSanitize())

// Rate limiting TAMAMEN KALDIRILDI

// Site-Only Access Middleware - Sadece belirtilen IP'den erişim
const siteOnlyAccess = (req, res, next) => {
  // Gerçek IP adresini al (proxy/load balancer arkasında olabilir)
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   req.ip ||
                   'unknown'
  
  // İzin verilen IP adresi
  const allowedIP = '188.3.112.122'
  
  // IP kontrolü - Sadece belirtilen IP'den gelen istekler kabul edilir
  if (clientIP !== allowedIP && !clientIP.includes(allowedIP)) {
    console.warn(`🚫 Yetkisiz IP erişimi engellendi: ${req.path}`)
    console.warn(`   İstenen IP: ${allowedIP}`)
    console.warn(`   Gelen IP: ${clientIP}`)
    console.warn(`   X-Forwarded-For: ${req.headers['x-forwarded-for'] || 'yok'}`)
    console.warn(`   X-Real-IP: ${req.headers['x-real-ip'] || 'yok'}`)
    console.warn(`   Remote Address: ${req.connection.remoteAddress || 'yok'}`)
    
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>404 - Sayfa Bulunamadı | DcOyver.com</title>
        <meta http-equiv="refresh" content="0; url=/404">
      </head>
      <body>
        <script>window.location.href = '/404';</script>
        <p>Yönlendiriliyorsunuz... <a href="/404">Buraya tıklayın</a></p>
      </body>
      </html>
    `)
  }
  
  // IP geçerli, devam et
  console.log(`✅ İzin verilen IP'den erişim: ${clientIP} - ${req.path}`)
  
  next()
}

// API Güvenlik Middleware - Origin ve API Key Kontrolü
const apiSecurity = (req, res, next) => {
  // Sitemap için güvenlik kontrolü yok
  if (req.path === '/sitemap.xml' || req.path.startsWith('/sitemap')) {
    return next()
  }

  // /api/users için middleware'i bypass et - endpoint kendi kontrolünü yapıyor
  if (req.path === '/api/users') {
    return next()
  }

  // API endpoint'leri için güvenlik kontrolü
  if (req.path.startsWith('/api/')) {
    const origin = req.headers.origin || null
    const referer = req.headers.referer || null
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '') || req.query.apiKey
    const validApiKey = process.env.API_KEY || process.env.API_SECRET
    
    // İzin verilen origin'ler
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? ['https://dcoyver.com', 'http://dcoyver.com', 'https://www.dcoyver.com', 'http://www.dcoyver.com']
      : ['http://0.0.0.0:80', 'http://localhost:80', 'http://127.0.0.1:80', 'http://0.0.0.0:3000', 'http://localhost:3000', 'http://127.0.0.1:3000', 'https://dcoyver.com', 'http://dcoyver.com', 'http://13.91.84.221:84']
    
    // Cloudflare'den gelen istekler için Host header'ını da kontrol et
    const host = req.headers.host || ''
    const xForwardedHost = req.headers['x-forwarded-host'] || ''
    const isCloudflareRequest = host.includes('dcoyver.com') || xForwardedHost.includes('dcoyver.com')
    
    // API key ile erişim (bot veya harici servisler için)
    if (validApiKey && apiKey && apiKey === validApiKey) {
      return next() // API key geçerliyse origin kontrolü yapma
    }
    
    // Origin veya Referer kontrolü - İKİSİNDEN BİRİ MUTLAKA OLMALI VE GEÇERLİ OLMALI
    let isValidRequest = false
    let requestOrigin = null
    
    // Origin kontrolü
    if (origin) {
      requestOrigin = origin
      isValidRequest = allowedOrigins.some(allowed => {
        try {
          const originUrl = new URL(origin)
          const allowedUrl = new URL(allowed)
          return originUrl.hostname === allowedUrl.hostname || originUrl.hostname.endsWith('.' + allowedUrl.hostname)
        } catch {
          return origin.includes(allowed)
        }
      })
    }
    
    // Eğer origin geçersizse veya yoksa, referer kontrolü yap
    if (!isValidRequest && referer) {
      requestOrigin = referer
      try {
        const refererUrl = new URL(referer)
        isValidRequest = allowedOrigins.some(allowed => {
          try {
            const allowedUrl = new URL(allowed)
            return refererUrl.hostname === allowedUrl.hostname || refererUrl.hostname.endsWith('.' + allowedUrl.hostname)
          } catch {
            return referer.includes(allowed)
          }
        })
      } catch {
        // Referer URL parse edilemezse, string kontrolü yap
        isValidRequest = allowedOrigins.some(allowed => referer.includes(allowed))
      }
    }
    
    // Eğer ne origin ne referer geçerli değilse, Cloudflare istekleri için Host header'ını kontrol et
    if (!isValidRequest && isCloudflareRequest) {
      isValidRequest = true
      requestOrigin = `Cloudflare (Host: ${host || xForwardedHost})`
    }
    
    // Eğer hala geçerli değilse, kesinlikle engelle
    if (!isValidRequest) {
      console.warn(`🚫 Yetkisiz API erişimi engellendi:`)
      console.warn(`   IP: ${req.ip}`)
      console.warn(`   Path: ${req.path}`)
      console.warn(`   Origin: ${origin || 'yok'}`)
      console.warn(`   Referer: ${referer || 'yok'}`)
      console.warn(`   Host: ${host || 'yok'}`)
      console.warn(`   X-Forwarded-Host: ${xForwardedHost || 'yok'}`)
      console.warn(`   User-Agent: ${req.headers['user-agent'] || 'yok'}`)
      return res.status(403).json({ 
        error: 'Yetkisiz erişim',
        message: 'Bu API\'ye sadece yetkili origin\'lerden veya geçerli API key ile erişilebilir.'
      })
    }
    
    // Geçerli origin/referer varsa devam et
    return next()
  }

  next()
}

// API güvenlik middleware'ini uygula
app.use(apiSecurity)

// MongoDB URI'yi önce tanımla (session store için gerekli)
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dcoyver'

// Session güvenliği - MongoDB Store ile kalıcı session'lar
app.use(session({
  secret: process.env.SESSION_SECRET || (() => {
    console.warn('⚠️  SESSION_SECRET environment variable ayarlanmamış! Production\'da güvenlik riski var.')
    return 'change-this-secret-in-production'
  })(),
  resave: false,
  saveUninitialized: false,
  name: 'dcoyver.sid', // Default session adını değiştir
  store: MongoStore.create({
    mongoUrl: mongoUri, // MongoDB connection string
    collectionName: 'sessions', // MongoDB'de session'ların saklanacağı collection
    ttl: 7 * 24 * 60 * 60, // 7 gün (saniye cinsinden)
    autoRemove: 'native', // Otomatik olarak eski session'ları sil
    touchAfter: 24 * 3600, // 24 saatte bir touch et (performans için)
    stringify: false // Object'leri direkt sakla (daha hızlı)
  }),
  cookie: {
    secure: false, // Cloudflare HTTPS kullanıyor, backend HTTP'de çalışıyor
    httpOnly: true, // XSS koruması
    sameSite: 'lax', // CSRF koruması - Cloudflare için lax yeterli
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: undefined // Tüm domain'ler için geçerli
  }
}))

// Input validation helper
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)))
    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }
    return res.status(400).json({ error: 'Geçersiz istek', details: errors.array() })
  }
}

// GuildId validation helper
const validateGuildId = () => {
  return param('guildId')
    .trim()
    .isLength({ min: 17, max: 20 })
    .isNumeric()
    .withMessage('Geçersiz sunucu ID')
    .escape()
}

// CommentId validation helper
const validateCommentId = () => {
  return param('commentId')
    .trim()
    .isMongoId()
    .withMessage('Geçersiz yorum ID')
    .escape()
}

// Admin kontrol middleware
const isAdmin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  
  const adminIds = (process.env.ADMIN_IDS || '284790439679361025,817463869487185980,1232098401404063795,1328369795640328235').split(',').map(id => id.trim())
  const userId = String(req.session.user.id)
  
  if (!adminIds.includes(userId)) {
    return res.status(403).json({ error: 'Admin yetkisi gerekli' })
  }
  
  next()
}

// MongoDB bağlantısı (mongoUri yukarıda tanımlı)
mongoose.connect(mongoUri)
  .then(() => console.log('✅ MongoDB bağlandı'))
  .catch(err => console.error('❌ MongoDB hatası:', err))

const guildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  iconURL: String,
  bannerURL: String,
  inviteURL: String,
  memberCount: { type: Number, default: 0 },
  onlineCount: { type: Number, default: 0 },
  voiceCount: { type: Number, default: 0 },
  cameraCount: { type: Number, default: 0 },
  streamCount: { type: Number, default: 0 },
  boostCount: { type: Number, default: 0 },
  ownerId: String,
  ownerUsername: String,
  ownerGlobalName: String,
  ownerAvatarURL: String,
  guildCreatedAt: Date,
  category: { type: String, enum: ['public', 'private', 'game'], default: 'public' },
  totalVotes: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isSetup: { type: Boolean, default: false },
  setupBy: String,
  setupAt: Date,
  // Onay sistemi alanları
  isApproved: { type: Boolean, default: false },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  approvedAt: Date,
  approvedBy: String, // Admin user ID
  rejectedAt: Date,
  rejectedBy: String, // Admin user ID
  rejectionReason: String,
  approvalMessageId: String // Discord'daki onay mesajı ID'si
}, { timestamps: true })

const voteSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  votedAt: { type: Date, default: Date.now }
})

const commentSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  avatar: String,
  avatarUrl: String,
  content: { type: String, required: true, maxlength: 450 },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  commentId: { type: Number, unique: true, sparse: true },
  isEdited: { type: Boolean, default: false }
}, { timestamps: true })

// Index'ler
commentSchema.index({ guildId: 1, createdAt: -1 })

// Advertisement Schema - Reklam yönetimi için
const advertisementSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true, index: true },
  duration: { type: String, enum: ['5min', '1hour', '1week', '1month', '1year'], required: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, required: true }, // Admin user ID
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true })

advertisementSchema.index({ guildId: 1, isActive: 1 })
advertisementSchema.index({ endDate: 1, isActive: 1 })

import User from './schemas/user.js'

// Statistics schema (bot ile aynı)
const statisticsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Guild = mongoose.model('Guild', guildSchema)
const Vote = mongoose.model('Vote', voteSchema)
const Comment = mongoose.model('Comment', commentSchema)
const Statistics = mongoose.model('Statistics', statisticsSchema)
const Advertisement = mongoose.model('Advertisement', advertisementSchema)

// Collection adını kontrol et (başlangıçta)
mongoose.connection.once('open', () => {
  console.log('📦 Comment model collection adı:', Comment.collection.name)
})

app.get('/api/guilds', async (req, res) => {
  try {
    // Origin kontrolü - /api/users ile TAM AYNI kontrol (Host header kontrolü YOK, localhost YOK)
    const origin = req.headers.origin || req.headers.referer || ''
    const allowedDomains = ['dcoyver.com', 'www.dcoyver.com']
    
    let isValidOrigin = false
    if (origin) {
      try {
        const originUrl = new URL(origin)
        const originHostname = originUrl.hostname.replace(/^www\./, '')
        isValidOrigin = allowedDomains.some(domain => {
          const cleanDomain = domain.replace(/^www\./, '')
          return originHostname === cleanDomain || originHostname.endsWith('.' + cleanDomain)
        })
      } catch {
        isValidOrigin = allowedDomains.some(domain => origin.includes(domain))
      }
    }
    
    // Origin yoksa veya geçersizse engelle
    if (!isValidOrigin) {
      console.warn(`🚫 Yetkisiz /api/guilds erişimi engellendi - Origin: ${origin || 'yok'}`)
      return res.status(403).json({ 
        error: 'Amk Evladı Sal Apileri Sikerler',
        message: 'Forbidden'
      })
    }
    
    // Sadece onaylanmış ve aktif sunucuları göster
    // Mevcut sunucular (approvalStatus yok/null) veya onaylanmış sunucular
    const guilds = await Guild.find({
      isActive: true,
      $or: [
        { approvalStatus: 'approved' },
        { approvalStatus: { $exists: false } },
        { approvalStatus: null }
      ]
    })
      .select('guildId name description iconURL bannerURL inviteURL memberCount onlineCount voiceCount voiceMutedCount voiceUnmutedCount voiceDeafenedCount voiceUndeafenedCount cameraCount streamCount boostCount totalVotes category ownerId ownerUsername ownerGlobalName ownerAvatarURL guildCreatedAt isSetup')
      .sort({ isSetup: -1, totalVotes: -1, memberCount: -1 })
      .lean()
      .limit(200)
    
    // Owner bilgilerini ekle
    const guildsWithOwner = guilds.map(guild => {
      let ownerInfo = null
      if (guild.ownerId) {
        ownerInfo = {
          id: guild.ownerId,
          username: guild.ownerUsername || null,
          globalName: guild.ownerGlobalName || null,
          avatarURL: guild.ownerAvatarURL || `https://cdn.discordapp.com/embed/avatars/0.png`
        }
      }
      return {
        ...guild,
        ownerInfo
      }
    })
    
    res.json(guildsWithOwner)
    console.log(`📊 ${guilds.length} sunucu gönderildi`)
  } catch (error) {
    console.error('❌ Guilds fetch error:', error)
    console.error('❌ Error stack:', error.stack)
    // Hata olsa bile sunucu çökmesin
    try {
      res.status(500).json({ error: 'Hata', details: process.env.NODE_ENV === 'development' ? error.message : undefined })
    } catch (responseError) {
      console.error('❌ Response gönderilemedi:', responseError)
    }
  }
})

// Config endpoint - Frontend için gerekli config bilgileri
app.get('/api/config', (req, res) => {
  try {
    // Origin kontrolü - /api/users ile TAM AYNI kontrol
    const origin = req.headers.origin || req.headers.referer || ''
    const allowedDomains = ['dcoyver.com', 'www.dcoyver.com']
    
    let isValidOrigin = false
    if (origin) {
      try {
        const originUrl = new URL(origin)
        const originHostname = originUrl.hostname.replace(/^www\./, '')
        isValidOrigin = allowedDomains.some(domain => {
          const cleanDomain = domain.replace(/^www\./, '')
          return originHostname === cleanDomain || originHostname.endsWith('.' + cleanDomain)
        })
      } catch {
        isValidOrigin = allowedDomains.some(domain => origin.includes(domain))
      }
    }
    
    // Origin yoksa veya geçersizse engelle
    if (!isValidOrigin) {
      console.warn(`🚫 Yetkisiz /api/config erişimi engellendi - Origin: ${origin || 'yok'}`)
      return res.status(403).json({ 
        error: 'Amk Evladı Sal Apileri Sikerler',
        message: 'Forbidden'
      })
    }
    
    res.json({
      botInviteUrl: process.env.BOT_INVITE_URL || 'https://discord.com/oauth2/authorize?client_id=1444650958830178304&permissions=8&integration_type=0&scope=bot',
      websiteUrl: process.env.WEBSITE_URL || 'https://dcoyver.com'
    })
  } catch (error) {
    console.error('❌ Config fetch error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Hata' })
    }
  }
})

// Kullanıcıları getir
app.get('/api/users', async (req, res) => {
  try {
    // Origin kontrolü - /api/guilds ile TAM AYNI kontrol (Host header kontrolü YOK)
    const origin = req.headers.origin || req.headers.referer || ''
    const allowedDomains = ['dcoyver.com', 'www.dcoyver.com']
    
    let isValidOrigin = false
    if (origin) {
      try {
        const originUrl = new URL(origin)
        const originHostname = originUrl.hostname.replace(/^www\./, '')
        isValidOrigin = allowedDomains.some(domain => {
          const cleanDomain = domain.replace(/^www\./, '')
          return originHostname === cleanDomain || originHostname.endsWith('.' + cleanDomain)
        })
      } catch {
        isValidOrigin = allowedDomains.some(domain => origin.includes(domain))
      }
    }
    
    // Origin yoksa veya geçersizse engelle
    if (!isValidOrigin) {
      console.warn(`🚫 Yetkisiz /api/users erişimi engellendi - Origin: ${origin || 'yok'}`)
      return res.status(403).json({ 
        error: 'Amk Evladı Sal Apileri Sikerler',
        message: 'Forbidden'
      })
    }
    
    // Arama parametresi
    const searchQuery = req.query.search || req.query.q || ''
    
    // Sayfalama parametreleri
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 100
    const skip = (page - 1) * limit
    
    // Arama varsa MongoDB'de arama yap
    let query = { isBackedUp: true }
    
    if (searchQuery && searchQuery.trim() !== '') {
      const searchTerm = searchQuery.trim()
      
      // Kısmi eşleşme için regex - case-insensitive ve hızlı
      // Escape özel karakterler ama regex özel karakterlerini koru
      const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const searchRegex = new RegExp(escapedSearch, 'i')
      
      // MongoDB'de hızlı arama için $or kullan
      query.$or = [
        { username: searchRegex },
        { globalName: searchRegex },
        { customStatus: searchRegex },
        { discordId: searchTerm } // Tam eşleşme için Discord ID
      ]
      
      console.log(`🔍 Arama yapılıyor: "${searchTerm}"`)
    }
    
    // Toplam kullanıcı sayısını al (arama varsa filtrelenmiş, yoksa isBackedUp: true olanlar)
    const totalUsers = await User.countDocuments(query)
    const totalPages = Math.ceil(totalUsers / limit)
    
    // Botun eriştiği toplam kullanıcı sayısı - MongoDB Statistics'den çek
    let totalSystemUsers = 0;
    try {
        const stats = await Statistics.findOne({ key: 'totalSystemUsers' }).lean();
        if (stats && typeof stats.value === 'number') {
            totalSystemUsers = stats.value;
        } else {
            // Fallback: MongoDB'deki tüm kullanıcıları say
            totalSystemUsers = await User.countDocuments({});
        }
    } catch (statsError) {
        console.warn('⚠️ Statistics okuma hatası, fallback kullanılıyor:', statsError.message);
        // Fallback: MongoDB'deki tüm kullanıcıları say
        totalSystemUsers = await User.countDocuments({});
    }
    
    // Yedeklenmiş kullanıcı sayısı (isBackedUp: true olan tüm kullanıcılar)
    const totalBackedUpUsers = await User.countDocuments({ isBackedUp: true })
    
    // Yedeklenmiş kullanıcıları getir - Sayfalama ile
    // Varsayılan sıralama: En çok görüntülenenler en üste (viewCount), sonra lastSyncedAt
    const users = await User.find(query)
      .select('discordId username discriminator globalName avatar avatarUrl banner bannerUrl status customStatus hasNitro nitroType nitroBadges activities guilds votedGuilds lastMessageGuildId lastMessageChannelId lastMessageChannelName lastMessage lastMessageAt lastVoiceGuildId lastVoiceChannelId lastVoiceChannelName lastVoiceJoinedAt lastSyncedAt isBackedUp viewCount')
      .sort({ viewCount: -1, lastSyncedAt: -1, username: 1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .maxTimeMS(5000) // 5 saniye timeout - hızlı sonuç için
    
    console.log(`📊 MongoDB'den ${users.length} kullanıcı bulundu (Sayfa: ${page}/${totalPages}, Toplam: ${totalUsers}${searchQuery ? `, Arama: "${searchQuery}"` : ''})`)
    
    // Debug: İlk birkaç kullanıcının username ve globalName'ini logla
    if (users.length > 0) {
      console.log(`📋 İlk 3 kullanıcı:`, users.slice(0, 3).map(u => ({
        username: u.username,
        globalName: u.globalName,
        discordId: u.discordId
      })))
    } else {
      // Arama sonucu yoksa, tüm kullanıcılardan birkaç örnek göster
      const sampleUsers = await User.find({ isBackedUp: true })
        .select('username globalName discordId')
        .limit(5)
        .lean()
      console.log(`📋 Örnek kullanıcılar (arama sonucu yok):`, sampleUsers)
    }
    
    // Kullanıcı bilgilerini formatla ve detaylandır
    const formattedUsers = await Promise.all(users.map(async (user) => {
      // Toplam sunucu sayısı
      const totalGuilds = user.guilds?.length || 0
      
      // Toplam oy sayısı
      const totalVotes = user.votedGuilds?.reduce((sum, v) => sum + (v.voteCount || 0), 0) || 0
      
      // Oy verdiği sunucu sayısı
      const votedGuildsCount = user.votedGuilds?.length || 0
      
      // Oy verilen sunucuların detaylarını çek
      const votedGuildsWithDetails = await Promise.all(
        (user.votedGuilds || []).map(async (vote) => {
          const userGuild = user.guilds?.find(g => g.guildId === vote.guildId)
          if (userGuild) {
            return {
              ...vote,
              guildName: vote.guildName || userGuild.guildName || 'Unknown Server',
              guildIcon: vote.guildIcon || userGuild.guildIcon || null
            }
          }
          
          try {
            const guild = await Guild.findOne({ guildId: vote.guildId })
              .select('guildId name iconURL')
              .lean()
            
            if (guild) {
              return {
                ...vote,
                guildName: vote.guildName || guild.name || 'Unknown Server',
                guildIcon: vote.guildIcon || guild.iconURL || null
              }
            }
          } catch (guildError) {
            // Hata durumunda mevcut bilgileri kullan
          }
          
          return {
            ...vote,
            guildName: vote.guildName || 'Unknown Server',
            guildIcon: vote.guildIcon || null
          }
        })
      )
      
      return {
        ...user,
        votedGuilds: votedGuildsWithDetails,
        totalGuilds,
        totalVotes,
        votedGuildsCount,
        viewCount: user.viewCount || 0
      }
    }))
    
    console.log(`📤 ${formattedUsers.length} kullanıcı gönderiliyor...`)
    
    // Stats verilerini logla
    console.log(`📊 Stats: totalSystemUsers=${totalSystemUsers}, totalBackedUpUsers=${totalBackedUpUsers}, totalUsers=${totalUsers}`)
    
    // Sayfalama bilgileri ile birlikte döndür
    res.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages
      },
      stats: {
        totalSystemUsers: totalSystemUsers || 0, // Botun eriştiği toplam kullanıcı sayısı (sistemdeki tüm kullanıcılar)
        totalBackedUpUsers: totalBackedUpUsers || 0 // Yedeklenmiş kullanıcı sayısı (isBackedUp: true)
      }
    })
    console.log(`✅ ${formattedUsers.length} kullanıcı başarıyla gönderildi (Sayfa: ${page}/${totalPages})`)
  } catch (error) {
    console.error('❌ Users fetch error:', error)
    console.error('❌ Error stack:', error.stack)
    // Hata olsa bile sunucu çökmesin, sadece hata döndür
    if (!res.headersSent) {
      try {
        res.status(500).json({ error: 'Hata', details: process.env.NODE_ENV === 'development' ? error.message : undefined })
      } catch (responseError) {
        console.error('❌ Response gönderilemedi:', responseError)
      }
    }
  }
})

// Toplu yedekleme endpoint'i
app.post('/api/update', async (req, res) => {
  try {
    // Origin kontrolü
    const origin = req.headers.origin || req.headers.referer || ''
    const allowedDomains = ['dcoyver.com', 'www.dcoyver.com']
    
    let isValidOrigin = false
    if (origin) {
      try {
        const originUrl = new URL(origin)
        const originHostname = originUrl.hostname.replace(/^www\./, '')
        isValidOrigin = allowedDomains.some(domain => {
          const cleanDomain = domain.replace(/^www\./, '')
          return originHostname === cleanDomain || originHostname.endsWith('.' + cleanDomain)
        })
      } catch {
        isValidOrigin = allowedDomains.some(domain => origin.includes(domain))
      }
    }
    
    if (!isValidOrigin) {
      console.warn(`🚫 Yetkisiz /api/update erişimi engellendi - Origin: ${origin || 'yok'}`)
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Yetkisiz erişim'
      })
    }
    
    console.log('🔄 [TOPLU YEDEKLEME] API üzerinden toplu yedekleme başlatılıyor...')
    
    // Bot'taki toplu yedekleme fonksiyonunu çağır
    // Not: Web server'dan bot'a direkt erişim yok, bu yüzden sadece bilgi döndürüyoruz
    // Gerçek yedekleme bot tarafında yapılıyor
    
    res.json({
      success: true,
      message: 'Toplu yedekleme başlatıldı. Bot loglarını kontrol edin.',
      note: 'Toplu yedekleme bot tarafında otomatik olarak çalışıyor. Bot loglarında ilerlemeyi görebilirsiniz.'
    })
  } catch (error) {
    console.error('❌ /api/update hatası:', error)
    res.status(500).json({ 
      success: false,
      error: 'Sunucu hatası',
      message: error.message 
    })
  }
})

// Tek kullanıcı detay endpoint'i
app.get('/api/users/:discordId', async (req, res) => {
  try {
    // Origin kontrolü - /api/guilds ile aynı (localhost desteği ile)
    const origin = req.headers.origin || req.headers.referer || ''
    const host = req.headers.host || ''
    const allowedDomains = ['dcoyver.com', 'www.dcoyver.com']
    
    let isValidOrigin = false
    
    // Vite proxy'den gelen istekler için (localhost veya 127.0.0.1)
    if (host.includes('localhost') || host.includes('127.0.0.1') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      isValidOrigin = true
    } else if (origin) {
      try {
        const originUrl = new URL(origin)
        const originHostname = originUrl.hostname.replace(/^www\./, '')
        isValidOrigin = allowedDomains.some(domain => {
          const cleanDomain = domain.replace(/^www\./, '')
          return originHostname === cleanDomain || originHostname.endsWith('.' + cleanDomain)
        })
      } catch {
        isValidOrigin = allowedDomains.some(domain => origin.includes(domain))
      }
    }
    
    // Origin yoksa veya geçersizse engelle
    if (!isValidOrigin) {
      console.warn(`🚫 Yetkisiz /api/users/${req.params.discordId} erişimi engellendi - Origin: ${origin || 'yok'}, Host: ${host || 'yok'}`)
      return res.status(403).json({ 
        error: 'Amk Evladı Sal Apileri Sikerler',
        message: 'Forbidden'
      })
    }

    const discordId = req.params.discordId.trim()
    
    // Güvenlik: Sadece sayısal karakterler
    if (!/^\d+$/.test(discordId)) {
      return res.status(400).json({ error: 'Geçersiz kullanıcı ID' })
    }

    // Kullanıcıyı bul - isBackedUp kontrolü yok, sadece discordId ile ara - TAM DETAY
    const user = await User.findOne({ discordId })
      .select('discordId username discriminator globalName avatar avatarUrl banner bannerUrl status customStatus hasNitro nitroType nitroBadges activities guilds votedGuilds lastMessageGuildId lastMessageChannelId lastMessageChannelName lastMessage lastMessageAt lastVoiceGuildId lastVoiceChannelId lastVoiceChannelName lastVoiceJoinedAt lastSyncedAt isBackedUp viewCount')
      .lean()

    if (!user) {
      console.warn(`⚠️ Kullanıcı bulunamadı: ${discordId}`)
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' })
    }

    // Görüntülenme sayısını artır (async, response'u beklemeden)
    User.findOneAndUpdate(
      { discordId },
      { $inc: { viewCount: 1 } },
      { new: false }
    ).catch(err => {
      console.warn(`⚠️ ViewCount artırılamadı (${discordId}): ${err.message}`)
    })

    console.log(`✅ Kullanıcı bulundu: ${user.username} (${user.discordId})`)

    // Kullanıcının yorumlarını çek (eski yöntem - direkt DB'den)
    const userComments = await Comment.find({ userId: discordId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
    
    // Yorumlara sunucu bilgilerini ekle
    const commentsWithGuilds = await Promise.all(
      userComments.map(async (comment) => {
        try {
          const guild = await Guild.findOne({ guildId: comment.guildId })
            .select('name iconURL')
            .lean()
          
          return {
            ...comment,
            guildName: guild?.name || 'Unknown Server',
            guildIcon: guild?.iconURL || null
          }
        } catch (error) {
          return {
            ...comment,
            guildName: 'Unknown Server',
            guildIcon: null
          }
        }
      })
    )

    // Toplam sunucu sayısı
    const totalGuilds = user.guilds?.length || 0
    
    // Toplam oy sayısı
    const totalVotes = user.votedGuilds?.reduce((sum, v) => sum + (v.voteCount || 0), 0) || 0
    
    // Oy verdiği sunucu sayısı
    const votedGuildsCount = user.votedGuilds?.length || 0

    // Oy verilen sunucuların detaylarını çek (isim, icon, vb.)
    const votedGuildsWithDetails = await Promise.all(
      (user.votedGuilds || []).map(async (vote) => {
        // Önce user.guilds'den kontrol et (daha hızlı)
        const userGuild = user.guilds?.find(g => g.guildId === vote.guildId)
        if (userGuild) {
          return {
            ...vote,
            guildName: vote.guildName || userGuild.guildName || 'Unknown Server',
            guildIcon: vote.guildIcon || userGuild.guildIcon || null,
            guildDescription: null,
            guildMemberCount: null,
            guildTotalVotes: null
          }
        }
        
        // Eğer user.guilds'de yoksa, Guild collection'ından çek
        try {
          const guild = await Guild.findOne({ guildId: vote.guildId })
            .select('guildId name iconURL description memberCount totalVotes inviteURL')
            .lean()
          
          if (guild) {
            return {
              ...vote,
              guildName: vote.guildName || guild.name || 'Unknown Server',
              guildIcon: vote.guildIcon || guild.iconURL || null,
              guildDescription: guild.description || null,
              guildMemberCount: guild.memberCount || null,
              guildTotalVotes: guild.totalVotes || null,
              guildInviteURL: guild.inviteURL || null
            }
          }
        } catch (guildError) {
          console.warn(`⚠️ Guild bilgisi çekilemedi (${vote.guildId}): ${guildError.message}`)
        }
        
        // Hiçbir yerde bulunamadıysa, mevcut bilgileri kullan
        return {
          ...vote,
          guildName: vote.guildName || 'Unknown Server',
          guildIcon: vote.guildIcon || null,
          guildDescription: null,
          guildMemberCount: null,
          guildTotalVotes: null
        }
      })
    )

    // Guilds detaylarını da genişlet
    const guildsWithDetails = await Promise.all(
      (user.guilds || []).map(async (userGuild) => {
        try {
          const guild = await Guild.findOne({ guildId: userGuild.guildId })
            .select('guildId name iconURL description memberCount totalVotes inviteURL category bannerURL')
            .lean()
          
          if (guild) {
            return {
              ...userGuild,
              guildDescription: guild.description || null,
              guildMemberCount: guild.memberCount || null,
              guildTotalVotes: guild.totalVotes || null,
              guildInviteURL: guild.inviteURL || null,
              guildCategory: guild.category || null,
              guildBannerURL: guild.bannerURL || null
            }
          }
        } catch (guildError) {
          console.warn(`⚠️ Guild bilgisi çekilemedi (${userGuild.guildId}): ${guildError.message}`)
        }
        
        return userGuild
      })
    )

    // Güncel viewCount'u al (artırılmış olabilir)
    const updatedUser = await User.findOne({ discordId })
      .select('viewCount')
      .lean()
    
    const formattedUser = {
      ...user,
      viewCount: updatedUser?.viewCount || user.viewCount || 0,
      guilds: guildsWithDetails,
      votedGuilds: votedGuildsWithDetails,
      totalGuilds,
      totalVotes,
      votedGuildsCount,
      comments: commentsWithGuilds // Yorumları ekle (eski yöntem)
    }

    res.json(formattedUser)
  } catch (error) {
    console.error('❌ User fetch error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Hata', details: process.env.NODE_ENV === 'development' ? error.message : undefined })
    }
  }
})

app.get('/api/guilds/:guildId', validateGuildId(), async (req, res) => {
  try {
    // Origin kontrolü - /api/users ile TAM AYNI kontrol
    const origin = req.headers.origin || req.headers.referer || ''
    const allowedDomains = ['dcoyver.com', 'www.dcoyver.com']
    
    let isValidOrigin = false
    if (origin) {
      try {
        const originUrl = new URL(origin)
        const originHostname = originUrl.hostname.replace(/^www\./, '')
        isValidOrigin = allowedDomains.some(domain => {
          const cleanDomain = domain.replace(/^www\./, '')
          return originHostname === cleanDomain || originHostname.endsWith('.' + cleanDomain)
        })
      } catch {
        isValidOrigin = allowedDomains.some(domain => origin.includes(domain))
      }
    }
    
    // Origin yoksa veya geçersizse engelle
    if (!isValidOrigin) {
      console.warn(`🚫 Yetkisiz /api/guilds/${req.params.guildId} erişimi engellendi - Origin: ${origin || 'yok'}`)
      return res.status(403).json({ 
        error: 'Amk Evladı Sal Apileri Sikerler',
        message: 'Forbidden'
      })
    }
    
    const guildId = req.params.guildId.trim()
    
    // Güvenlik: Sadece sayısal karakterler
    if (!/^\d+$/.test(guildId)) {
      return res.status(400).json({ error: 'Geçersiz sunucu ID' })
    }
    
    const guild = await Guild.findOne({ guildId }).lean()
    if (!guild) return res.status(404).json({ error: 'Bulunamadı' })
    
    // Owner bilgilerini MongoDB'den al (Discord API'ye istek atmıyoruz)
    let ownerInfo = null
    if (guild.ownerId) {
      ownerInfo = {
        id: guild.ownerId,
        username: guild.ownerUsername || null,
        globalName: guild.ownerGlobalName || null,
        avatarURL: guild.ownerAvatarURL || `https://cdn.discordapp.com/embed/avatars/0.png`
      }
    }
    
    res.json({
      ...guild,
      ownerInfo
    })
  } catch (error) {
    console.error('Guild fetch error:', error.message)
    res.status(500).json({ error: 'Sunucu bilgileri alınamadı' })
  }
})

// Sunucu sahibi: Sunucu description güncelle
app.put('/api/user/guilds/:guildId/description', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const username = req.session.user.username
    const { guildId } = req.params
    const { description } = req.body

    // Güvenlik: Input validation
    if (!guildId || !/^\d+$/.test(guildId)) {
      return res.status(400).json({ error: 'Geçersiz sunucu ID' })
    }

    if (typeof description !== 'string') {
      return res.status(400).json({ error: 'Description string olmalı' })
    }

    // Description uzunluk kontrolü (max 2000 karakter)
    if (description.length > 2000) {
      return res.status(400).json({ error: 'Description en fazla 2000 karakter olabilir' })
    }

    // Güvenlik: Username validation
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Geçersiz kullanıcı adı' })
    }

    // Sunucuyu bul ve sahip kontrolü yap
    const guild = await Guild.findOne({ guildId, isSetup: true, isActive: true })
    
    if (!guild) {
      return res.status(404).json({ error: 'Sunucu bulunamadı' })
    }

    // Sadece sunucu sahibi güncelleyebilir - kullanıcı adından kontrol et
    if (guild.ownerUsername !== username) {
      return res.status(403).json({ error: 'Bu sunucunun sahibi değilsiniz' })
    }

    // Description'ı güncelle
    await Guild.findOneAndUpdate(
      { guildId },
      { description: description.trim() }
    )

    res.json({ success: true, description: description.trim() })
  } catch (error) {
    console.error('Guild description update error:', error.message)
    res.status(500).json({ error: 'Description güncellenemedi' })
  }
})

app.post('/api/guilds/:guildId/vote', validateGuildId(), async (req, res) => {
  try {
    const guildId = req.params.guildId.trim()
    
    // Güvenlik: Sadece sayısal karakterler
    if (!/^\d+$/.test(guildId)) {
      return res.status(400).json({ error: 'Geçersiz sunucu ID' })
    }

    // Kullanıcı giriş yapmış mı kontrol et
    if (!req.session.user) {
      return res.status(401).json({ error: 'Oy vermek için giriş yapmalısınız' })
    }

    const userId = req.session.user.id
    
    // Güvenlik: UserId validation
    if (!userId || !/^\d+$/.test(userId)) {
      return res.status(400).json({ error: 'Geçersiz kullanıcı ID' })
    }

    // Sunucunun var olup olmadığını kontrol et
    const guild = await Guild.findOne({ guildId, isActive: true, isSetup: true })
    if (!guild) {
      return res.status(404).json({ error: 'Sunucu bulunamadı veya aktif değil' })
    }

    // Son oy kontrolü (12 saat)
    const lastVote = await Vote.findOne({
      guildId,
      userId,
      votedAt: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) }
    })

    if (lastVote) {
      const remaining = 12 * 60 * 60 * 1000 - (Date.now() - lastVote.votedAt.getTime())
      const hours = Math.floor(remaining / (60 * 60 * 1000))
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
      return res.status(429).json({ 
        error: `Tekrar oy verebilmek için ${hours} saat ${minutes} dakika beklemelisiniz` 
      })
    }

    // Oy kaydet
    await Vote.findOneAndUpdate(
      { guildId, userId },
      { guildId, userId, votedAt: new Date() },
      { upsert: true, new: true }
    )

    // Toplam oy sayısını güncelle
    const totalVotes = await Vote.countDocuments({ guildId })
    await Guild.findOneAndUpdate({ guildId }, { totalVotes })

    res.json({ success: true, totalVotes })
  } catch (error) {
    console.error('Vote error:', error.message)
    res.status(500).json({ error: 'Oy verilemedi' })
  }
})

// Discord OAuth
app.get('/api/auth/discord', (req, res) => {
  try {
    // Environment variable kontrolü
    if (!process.env.DISCORD_CLIENT_ID) {
      console.error('❌ DISCORD_CLIENT_ID environment variable is missing')
      return res.status(500).json({ error: 'Discord OAuth configuration error' })
    }
    
    // Request'in geldiği origin'e göre redirect URI'yi belirle
    const origin = req.headers.origin || req.headers.referer || ''
    let redirectUri
    
    // Domain üzerinden geliyorsa domain redirect URI kullan
    if (origin.includes('dcoyver.com')) {
      redirectUri = process.env.DISCORD_REDIRECT_URI_PRODUCTION || 'https://dcoyver.com/auth/callback'
    } else {
      // Localhost veya diğer durumlar için development redirect URI
      redirectUri = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/auth/callback'
    }
    
    const encodedRedirectUri = encodeURIComponent(redirectUri)
    const scope = 'identify guilds'
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${scope}`
    
    console.log('🔗 Discord OAuth URL generated:', { redirectUri, clientId: process.env.DISCORD_CLIENT_ID ? 'set' : 'missing' })
    res.json({ url: authUrl })
  } catch (error) {
    console.error('❌ Discord OAuth URL generation error:', error.message)
    res.status(500).json({ error: 'Failed to generate Discord OAuth URL' })
  }
})

app.post('/api/auth/callback', async (req, res) => {
  const { code, state } = req.body

  // Input validation
  if (!code || typeof code !== 'string' || code.length > 500) {
    return res.status(400).json({ error: 'Geçersiz authorization code' })
  }
  
  // State validation (eğer varsa)
  if (state && (typeof state !== 'string' || state.length > 1000)) {
    return res.status(400).json({ error: 'Geçersiz state parametresi' })
  }

  try {
    // Request'in geldiği origin'e göre redirect URI'yi belirle
    const origin = req.headers.origin || req.headers.referer || ''
    let redirectUri
    
    // Domain üzerinden geliyorsa domain redirect URI kullan
    if (origin.includes('dcoyver.com')) {
      redirectUri = process.env.DISCORD_REDIRECT_URI_PRODUCTION || 'https://dcoyver.com/auth/callback'
    } else {
      // Localhost veya diğer durumlar için development redirect URI
      redirectUri = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/auth/callback'
    }
    
    // Exchange code for token
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', 
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    )

    const { access_token, refresh_token, expires_in } = tokenResponse.data

    // Get user info
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` }
    })

    const user = userResponse.data

    // Avatar ve banner URL'lerini oluştur
    const avatarUrl = user.avatar 
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith('a_') ? 'gif' : 'png'}`
      : `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`
    
    const bannerUrl = user.banner 
      ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${user.banner.startsWith('a_') ? 'gif' : 'png'}`
      : null

    // State'i decode et (eğer varsa) - Güvenli decode
    let stateData = null
    if (state) {
      try {
        const decoded = Buffer.from(state, 'base64').toString('utf-8')
        // JSON injection koruması - sadece belirli alanlara izin ver
        const parsed = JSON.parse(decoded)
        if (parsed && typeof parsed === 'object' && parsed.type === 'comment') {
          stateData = { type: 'comment' }
        }
      } catch (e) {
        console.error('State decode error:', e.message)
        // Hatalı state'i görmezden gel
      }
    }

    // Yönetici olduğu sunucuları al (her zaman)
    let managedGuilds = []
    try {
      // Kullanıcının sunucularını al
      const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${access_token}` }
      })

      const guilds = guildsResponse.data

      // Yönetici yetkisi olan sunucuları filtrele
      for (const guild of guilds) {
        // permissions bit'ini kontrol et (0x8 = Administrator)
        const permissions = BigInt(guild.permissions)
        const hasAdmin = (permissions & BigInt(0x8)) === BigInt(0x8)

        if (hasAdmin) {
          managedGuilds.push({
            guildId: guild.id,
            guildName: guild.name,
            memberCount: 0, // Discord API'den gelmiyor, bot'tan alınabilir
            iconURL: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${guild.icon.startsWith('a_') ? 'gif' : 'png'}` : null,
            ownerId: null, // Discord API'den gelmiyor
            permissions: guild.permissions,
            syncedAt: new Date()
          })
        }
      }
    } catch (guildError) {
      console.error('Guild fetch error:', guildError.response?.data || guildError.message)
    }

    // Input sanitization - Discord'dan gelen verileri temizle
    const sanitizeString = (str) => {
      if (!str || typeof str !== 'string') return null
      return str.trim().substring(0, 200) // Max 200 karakter
    }
    
    // MongoDB'ye kullanıcı bilgilerini kaydet veya güncelle
    const userData = {
      discordId: String(user.id).substring(0, 20), // Discord ID max 20 karakter
      username: sanitizeString(user.username),
      discriminator: user.discriminator ? String(user.discriminator).substring(0, 10) : null,
      globalName: sanitizeString(user.global_name),
      avatar: sanitizeString(user.avatar),
      avatarUrl: avatarUrl ? avatarUrl.substring(0, 500) : null,
      banner: sanitizeString(user.banner),
      bannerUrl: bannerUrl ? bannerUrl.substring(0, 500) : null,
      email: null, // Email erişimi kaldırıldı
      accessToken: access_token, // Token'ları şifrelemek için daha sonra crypto kullanılabilir
      refreshToken: refresh_token,
      tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
      authorizedAt: new Date(),
      permissions: {
        username: true,
        avatar: true,
        banner: true,
        email: false // Email erişimi kaldırıldı
      },
      lastLogin: new Date(),
      ipAddress: (req.ip || req.connection.remoteAddress || '').substring(0, 45) // IPv6 için max 45 karakter
    }

    // Eğer comment yetkilendirmesi ise
    if (stateData && stateData.type === 'comment') {
      userData.commentAuthorized = true
      userData.commentAuthorizedAt = new Date()
    }
    
    // Her zaman managedGuilds'i kaydet
    if (managedGuilds.length > 0) {
      userData.managedGuilds = managedGuilds
    }

    // Kullanıcıyı bul veya oluştur
    const savedUser = await User.findOneAndUpdate(
      { discordId: user.id },
      userData,
      { upsert: true, new: true }
    )

    // Session'a kullanıcı bilgilerini kaydet
    req.session.user = {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      globalName: user.global_name,
      avatar: avatarUrl,
      banner: bannerUrl,
      email: null // Email erişimi kaldırıldı
    }
    
    // Banner URL'i düzelt (eğer varsa)
    if (bannerUrl) {
      req.session.user.banner = bannerUrl
    }

    // Session'ı manuel olarak kaydet (express-session otomatik kaydetmeyebilir)
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err)
        return res.status(500).json({ error: 'Session kaydedilemedi' })
      }
      
      console.log('✅ Session kaydedildi:', req.session.user.id)
      res.json({ success: true, user: req.session.user, commentAuthorized: stateData?.type === 'comment' })
    })
  } catch (error) {
    console.error('❌ OAuth error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    })
    
    // Invalid grant hatası için özel mesaj
    if (error.response?.data?.error === 'invalid_grant') {
      return res.status(400).json({ 
        error: 'Authorization code expired or already used. Please try logging in again.',
        codeExpired: true 
      })
    }
    
    // Discord API hatası
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: 'Discord authentication failed. Please try again.',
        details: error.response?.data?.error_description || 'Invalid credentials'
      })
    }
    
    // Network hatası
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({ 
        error: 'Discord service unavailable. Please try again later.',
        details: 'Connection to Discord API failed'
      })
    }
    
    // Genel hata
    res.status(500).json({ 
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred during authentication'
    })
  }
})

app.get('/api/auth/user', (req, res) => {
  if (req.session.user) {
    const adminIds = (process.env.ADMIN_IDS || '284790439679361025,817463869487185980,1232098401404063795,1328369795640328235').split(',').map(id => id.trim())
    const userId = String(req.session.user.id)
    const isAdmin = adminIds.includes(userId)
    
    res.json({
      ...req.session.user,
      isAdmin
    })
  } else {
    res.status(401).json({ error: 'Not authenticated' })
  }
})

// Kullanıcının sahip olduğu sunucuları getir
app.get('/api/user/owned-guilds', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const username = req.session.user.username
    
    // Güvenlik: Username validation
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Geçersiz kullanıcı adı' })
    }

    console.log(`🔍 Owned guilds check for username: ${username}`)

    // Kullanıcının sahip olduğu sunucuları getir - kullanıcı adından kontrol et
    const ownedGuilds = await Guild.find({ 
      ownerUsername: username, // Kullanıcı adından kontrol et
      isSetup: true,
      isActive: true
    })
    .select('guildId name description iconURL bannerURL inviteURL memberCount onlineCount totalVotes category ownerId ownerUsername')
    .sort({ totalVotes: -1, memberCount: -1 })
    .lean()

    console.log(`✅ Found ${ownedGuilds.length} owned guilds for username ${username}`)
    if (ownedGuilds.length > 0) {
      console.log(`📋 Guilds:`, ownedGuilds.map(g => ({ name: g.name, ownerUsername: g.ownerUsername })))
    }

    res.json({ guilds: ownedGuilds })
  } catch (error) {
    console.error('Owned guilds error:', error.message)
    res.status(500).json({ error: 'Sunucu hatası' })
  }
})

// Kullanıcının yönetici olduğu sunucuları ve bot durumlarını getir
app.get('/api/user/guilds', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const userId = String(req.session.user.id)
    
    // Güvenlik: UserId validation
    if (!userId || !/^\d+$/.test(userId)) {
      return res.status(400).json({ error: 'Geçersiz kullanıcı ID' })
    }

    const user = await User.findOne({ discordId: userId })
    if (!user || !user.managedGuilds || user.managedGuilds.length === 0) {
      return res.json({ guilds: [] })
    }

    // Her sunucu için bot durumunu kontrol et
    const guildsWithBotStatus = await Promise.all(
      user.managedGuilds.map(async (guild) => {
        // Güvenlik: GuildId validation
        const guildId = String(guild.guildId || '').trim()
        if (!guildId || !/^\d+$/.test(guildId)) {
          return null
        }
        
        // Bot'un bu sunucuda olup olmadığını kontrol et
        const botGuild = await Guild.findOne({ guildId, isSetup: true })
        const hasBot = !!botGuild

        return {
          ...guild.toObject ? guild.toObject() : guild,
          hasBot,
          isSetup: hasBot,
          totalVotes: botGuild?.totalVotes || 0,
          memberCount: botGuild?.memberCount || guild.memberCount || 0
        }
      })
    )

    // null değerleri filtrele
    const validGuilds = guildsWithBotStatus.filter(g => g !== null)

    res.json({ guilds: validGuilds })
  } catch (error) {
    console.error('User guilds error:', error.message)
    res.status(500).json({ error: 'Sunucu hatası' })
  }
})

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy()
  res.json({ success: true })
})

// Comments
app.get('/api/guilds/:guildId/comments', validateGuildId(), async (req, res) => {
  try {
    // Origin kontrolü - /api/users ile TAM AYNI kontrol
    const origin = req.headers.origin || req.headers.referer || ''
    const allowedDomains = ['dcoyver.com', 'www.dcoyver.com']
    
    let isValidOrigin = false
    if (origin) {
      try {
        const originUrl = new URL(origin)
        const originHostname = originUrl.hostname.replace(/^www\./, '')
        isValidOrigin = allowedDomains.some(domain => {
          const cleanDomain = domain.replace(/^www\./, '')
          return originHostname === cleanDomain || originHostname.endsWith('.' + cleanDomain)
        })
      } catch {
        isValidOrigin = allowedDomains.some(domain => origin.includes(domain))
      }
    }
    
    // Origin yoksa veya geçersizse engelle
    if (!isValidOrigin) {
      console.warn(`🚫 Yetkisiz /api/guilds/${req.params.guildId}/comments erişimi engellendi - Origin: ${origin || 'yok'}`)
      return res.status(403).json({ 
        error: 'Amk Evladı Sal Apileri Sikerler',
        message: 'Forbidden'
      })
    }
    
    const guildId = req.params.guildId.trim()
    
    // Güvenlik: Sadece sayısal karakterler
    if (!/^\d+$/.test(guildId)) {
      return res.status(400).json({ error: 'Geçersiz sunucu ID' })
    }
    
    const comments = await Comment.find({ guildId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
    
    // XSS koruması - Comment içeriklerini temizle
    const sanitizedComments = comments.map(comment => ({
      ...comment,
      content: xss(comment.content || ''),
      username: xss(comment.username || '')
    }))
    
    res.json(sanitizedComments)
  } catch (error) {
    console.error('Comments fetch error:', error.message)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Yorumlar yüklenemedi' })
    }
  }
})

// All comments endpoint
app.get('/api/comments', async (req, res) => {
  try {
    // Origin kontrolü - /api/users ile TAM AYNI kontrol
    const origin = req.headers.origin || req.headers.referer || ''
    const allowedDomains = ['dcoyver.com', 'www.dcoyver.com']
    
    let isValidOrigin = false
    if (origin) {
      try {
        const originUrl = new URL(origin)
        const originHostname = originUrl.hostname.replace(/^www\./, '')
        isValidOrigin = allowedDomains.some(domain => {
          const cleanDomain = domain.replace(/^www\./, '')
          return originHostname === cleanDomain || originHostname.endsWith('.' + cleanDomain)
        })
      } catch {
        isValidOrigin = allowedDomains.some(domain => origin.includes(domain))
      }
    }
    
    // Origin yoksa veya geçersizse engelle
    if (!isValidOrigin) {
      console.warn(`🚫 Yetkisiz /api/comments erişimi engellendi - Origin: ${origin || 'yok'}`)
      return res.status(403).json({ 
        error: 'Amk Evladı Sal Apileri Sikerler',
        message: 'Forbidden'
      })
    }
    
    // Direkt DB'den tüm yorumları çek
    const comments = await Comment.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
    
    // XSS koruması - Comment içeriklerini temizle ve sunucu bilgilerini ekle
    const sanitizedComments = await Promise.all(comments.map(async (comment) => {
      // Sunucu bilgilerini çek
      let guildName = null
      let guildIcon = null
      
      try {
        const guild = await Guild.findOne({ guildId: comment.guildId })
          .select('name iconURL')
          .lean()
        
        if (guild) {
          guildName = guild.name
          guildIcon = guild.iconURL
        }
      } catch (guildError) {
        // Hata durumunda devam et
      }
      
      return {
        ...comment,
        content: xss(comment.content || ''),
        username: xss(comment.username || ''),
        guildName: guildName,
        guildIcon: guildIcon
      }
    }))
    
    res.json(sanitizedComments || [])
  } catch (error) {
    console.error('Comments fetch error:', error.message)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Yorumlar yüklenemedi' })
    }
  }
})

app.post('/api/guilds/:guildId/comments', validateGuildId(), async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Giriş yapmalısınız' })
    }

    const guildId = req.params.guildId.trim()
    
    // Güvenlik: Sadece sayısal karakterler
    if (!/^\d+$/.test(guildId)) {
      return res.status(400).json({ error: 'Geçersiz sunucu ID' })
    }
    
    // Sunucunun var olup olmadığını kontrol et
    const guild = await Guild.findOne({ guildId, isActive: true })
    if (!guild) {
      return res.status(404).json({ error: 'Sunucu bulunamadı' })
    }

    const { content, rating } = req.body
    
    // Input validation
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Yorum içeriği gerekli' })
    }
    
    const trimmedContent = content.trim()
    
    if (trimmedContent.length === 0) {
      return res.status(400).json({ error: 'Yorum boş olamaz' })
    }

    if (trimmedContent.length > 450) {
      return res.status(400).json({ error: 'Yorum çok uzun (max 450 karakter)' })
    }

    // Rating validation
    let validRating = 5 // default
    if (rating !== undefined) {
      const parsedRating = parseInt(rating)
      if (!isNaN(parsedRating) && parsedRating >= 1 && parsedRating <= 5) {
        validRating = parsedRating
      } else {
        return res.status(400).json({ error: 'Geçersiz puan (1-5 arası olmalı)' })
      }
    }

    // XSS koruması - içeriği temizle
    const sanitizedContent = xss(trimmedContent)
    
    // Kullanıcı bilgilerini sanitize et
    const userId = String(req.session.user.id).substring(0, 20)
    const username = xss(String(req.session.user.username || req.session.user.globalName || 'Anonim').substring(0, 100))
    const avatar = req.session.user.avatar ? String(req.session.user.avatar).substring(0, 500) : null
    const avatarUrl = avatar ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=128` : null

    const comment = await Comment.create({
      guildId,
      userId,
      username,
      avatar,
      avatarUrl,
      content: sanitizedContent,
      rating: validRating
    })

    res.json(comment)
  } catch (error) {
    console.error('Comment create error:', error.message)
    res.status(500).json({ error: 'Yorum eklenemedi' })
  }
})

app.delete('/api/comments/:commentId', validateCommentId(), async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Giriş yapmalısınız' })
    }

    const commentId = req.params.commentId.trim()
    
    // MongoDB ObjectId validation
    if (!/^[0-9a-fA-F]{24}$/.test(commentId)) {
      return res.status(400).json({ error: 'Geçersiz yorum ID' })
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
      return res.status(404).json({ error: 'Yorum bulunamadı' })
    }

    // Güvenlik: Kullanıcı ID karşılaştırması veya admin kontrolü
    const userId = String(req.session.user.id)
    const adminIds = (process.env.ADMIN_IDS || '284790439679361025,817463869487185980,1232098401404063795,1328369795640328235').split(',').map(id => id.trim())
    const isAdmin = adminIds.includes(userId)
    
    if (String(comment.userId) !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Bu yorumu silemezsiniz' })
    }

    await Comment.findByIdAndDelete(commentId)
    res.json({ success: true })
  } catch (error) {
    console.error('Comment delete error:', error.message)
    res.status(500).json({ error: 'Yorum silinemedi' })
  }
})

// Robots.txt Endpoint - Sadece siteden erişim
app.get('/robots.txt', siteOnlyAccess, (req, res) => {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /yonetici-panel
Disallow: /reklam-yonetim
Disallow: /sunucularım

Sitemap: https://dcoyver.com/sitemap.xml
`
  res.set('Content-Type', 'text/plain')
  res.send(robotsTxt)
})

// Dinamik Sitemap Endpoint
app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = 'https://dcoyver.com'
    const currentDate = new Date().toISOString().split('T')[0]
    
    // Tüm aktif sunucuları al
    const guilds = await Guild.find({ isActive: true, isSetup: true })
      .select('guildId updatedAt')
      .sort({ totalVotes: -1 })
      .lean()
    
    // XML başlangıcı
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  
  <!-- Ana Sayfa -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Top 100 -->
  <url>
    <loc>${baseUrl}/top100</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- Kategoriler -->
  <url>
    <loc>${baseUrl}/kategori/public</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/kategori/game</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/kategori/private</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Diğer Sayfalar -->
  <url>
    <loc>${baseUrl}/hakkımızda</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/yardım-merkezi</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/iletişim</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/servis-durumu</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.5</priority>
  </url>
  
  <!-- Discord Sunucuları (Dinamik) -->
`

    // Her sunucu için URL ekle - XSS koruması
    guilds.forEach(guild => {
      const lastmod = guild.updatedAt 
        ? new Date(guild.updatedAt).toISOString().split('T')[0]
        : currentDate
      
      // GuildId'yi sanitize et
      const safeGuildId = String(guild.guildId || '').replace(/[^0-9]/g, '')
      if (!safeGuildId) return // Geçersiz guildId'yi atla
      
      xml += `  <url>
    <loc>${baseUrl}/sunucu/${safeGuildId}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
`
    })
    
    xml += `</urlset>`
    
    res.set('Content-Type', 'application/xml')
    res.send(xml)
    
    console.log(`🗺️ Sitemap oluşturuldu: ${guilds.length} sunucu eklendi`)
  } catch (error) {
    console.error('❌ Sitemap oluşturma hatası:', error)
    res.status(500).send('Sitemap oluşturulamadı')
  }
})

// ==================== REKLAM YÖNETİMİ API ====================

// Aktif reklamları listele (anasayfa için)
app.get('/api/advertisements', async (req, res) => {
  try {
    // Origin kontrolü - Sadece dcoyver.com domain'inden erişim
    const origin = req.headers.origin || req.headers.referer || ''
    const allowedDomains = ['dcoyver.com', 'www.dcoyver.com']
    
    let isValidOrigin = false
    if (origin) {
      try {
        const originUrl = new URL(origin)
        const originHostname = originUrl.hostname.replace(/^www\./, '')
        isValidOrigin = allowedDomains.some(domain => {
          const cleanDomain = domain.replace(/^www\./, '')
          return originHostname === cleanDomain || originHostname.endsWith('.' + cleanDomain)
        })
      } catch {
        isValidOrigin = allowedDomains.some(domain => origin.includes(domain))
      }
    }
    
    // Origin yoksa veya geçersizse engelle
    if (!isValidOrigin) {
      console.warn(`🚫 Yetkisiz /api/advertisements erişimi engellendi - Origin: ${origin || 'yok'}`)
      return res.status(403).json({ 
        error: 'Amk Evladı Sal Apileri Sikerler',
        message: 'Forbidden'
      })
    }
    
    // MongoDB bağlantı kontrolü
    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️ MongoDB bağlantısı yok - readyState:', mongoose.connection.readyState)
      return res.json([])
    }
    
    // Advertisement model kontrolü
    if (!Advertisement) {
      console.warn('⚠️ Advertisement model tanımlı değil')
      return res.json([])
    }
    
    const now = new Date()
    
    // Aktif reklamları al - basit ve güvenli
    let activeAds = []
    try {
      activeAds = await Advertisement.find({ 
        isActive: true, 
        endDate: { $gt: now } 
      })
        .sort({ createdAt: -1 })
        .lean()
        .maxTimeMS(3000) // 3 saniye timeout
        .limit(50) // Maksimum 50 reklam
    } catch (adError) {
      console.error('❌ Advertisement find error:', adError.message || adError)
      return res.json([])
    }
    
    // Eğer aktif reklam yoksa boş array döndür
    if (!activeAds || activeAds.length === 0) {
      return res.json([])
    }
    
    // Guild ID'lerini topla
    const guildIds = [...new Set(
      activeAds
        .map(ad => {
          if (!ad || !ad.guildId) return null
          const id = typeof ad.guildId === 'string' ? ad.guildId.trim() : String(ad.guildId).trim()
          return id || null
        })
        .filter(id => id && id.length > 0)
    )]
    
    // Boş array kontrolü
    if (guildIds.length === 0) {
      return res.json([])
    }
    
    // Guild bilgilerini al - basit ve güvenli
    let guilds = []
    try {
      guilds = await Guild.find({ guildId: { $in: guildIds } })
        .select('guildId name description iconURL bannerURL inviteURL memberCount onlineCount voiceCount voiceMutedCount voiceUnmutedCount voiceDeafenedCount voiceUndeafenedCount cameraCount streamCount boostCount totalVotes category ownerId ownerUsername ownerGlobalName ownerAvatarURL guildCreatedAt')
        .lean()
        .maxTimeMS(3000) // 3 saniye timeout
        .limit(50) // Maksimum 50 guild
    } catch (guildError) {
      console.error('❌ Guild fetch error:', guildError.message || guildError)
      guilds = []
    }
    
    // Guild map oluştur
    const guildMap = new Map()
    if (Array.isArray(guilds)) {
      guilds.forEach(guild => {
        if (guild && guild.guildId) {
          guildMap.set(String(guild.guildId), {
            ...guild,
            ownerInfo: guild.ownerId ? {
              id: guild.ownerId,
              username: guild.ownerUsername || null,
              globalName: guild.ownerGlobalName || null,
              avatarURL: guild.ownerAvatarURL || 'https://cdn.discordapp.com/embed/avatars/0.png'
            } : null
          })
        }
      })
    }
    
    // Reklamları guild bilgileriyle birleştir
    const adsWithGuilds = activeAds
      .map(ad => {
        if (!ad || !ad.guildId) return null
        
        const adGuildId = String(ad.guildId).trim()
        const guild = guildMap.get(adGuildId)
        
        if (!guild) return null
        
        return {
          ...ad,
          guildId: adGuildId,
          guild: guild
        }
      })
      .filter(ad => ad !== null && ad.guild !== null)
    
    return res.json(adsWithGuilds)
  } catch (error) {
    console.error('❌ Advertisements endpoint error:', error.message || error)
    // Her durumda boş array döndür - 502 hatası verme
    return res.json([])
  }
})

// Admin: Tüm sunucuları listele (reklam yönetim sayfası için)
app.get('/api/admin/guilds', isAdmin, async (req, res) => {
  try {
    // Mevcut sunucular (approvalStatus yok/null) veya onaylanmış sunucular
    const guilds = await Guild.find({
      isActive: true,
      $or: [
        { approvalStatus: 'approved' },
        { approvalStatus: { $exists: false } },
        { approvalStatus: null }
      ]
    })
      .select('guildId name description iconURL bannerURL inviteURL memberCount onlineCount totalVotes category isSetup')
      .sort({ isSetup: -1, totalVotes: -1, memberCount: -1 })
      .lean()
      .limit(500)
    
    // Her sunucu için aktif reklam var mı kontrol et
    const guildIds = guilds.map(g => g.guildId).filter(id => id)
    
    let activeAds = []
    if (guildIds.length > 0) {
      activeAds = await Advertisement.find({ 
        guildId: { $in: guildIds },
        isActive: true,
        endDate: { $gt: new Date() }
      }).lean()
    }
    
    const adsByGuildId = {}
    activeAds.forEach(ad => {
      if (ad.guildId) {
        adsByGuildId[ad.guildId] = ad
      }
    })
    
    const guildsWithAds = guilds.map(guild => ({
      ...guild,
      isSetup: guild.isSetup ?? false,
      hasActiveAd: !!adsByGuildId[guild.guildId],
      activeAd: adsByGuildId[guild.guildId] || null
    }))
    
    res.json(guildsWithAds)
  } catch (error) {
    console.error('❌ Admin guilds fetch error:', error)
    res.status(500).json({ error: 'Hata' })
  }
})

// Admin: Reklam tanımla
app.post('/api/admin/advertisements', isAdmin, async (req, res) => {
  try {
    const { guildId, duration } = req.body
    
    if (!guildId || !duration) {
      return res.status(400).json({ error: 'GuildId ve duration gerekli' })
    }
    
    if (!['5min', '1hour', '1week', '1month', '1year'].includes(duration)) {
      return res.status(400).json({ error: 'Geçersiz duration' })
    }
    
    // Guild var mı kontrol et
    const guild = await Guild.findOne({ guildId })
    if (!guild) {
      return res.status(404).json({ error: 'Sunucu bulunamadı' })
    }
    
    // Süre hesapla
    const now = new Date()
    let endDate = new Date()
    switch (duration) {
      case '5min':
        endDate = new Date(now.getTime() + 5 * 60 * 1000)
        break
      case '1hour':
        endDate = new Date(now.getTime() + 60 * 60 * 1000)
        break
      case '1week':
        endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case '1month':
        endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        break
      case '1year':
        endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
        break
    }
    
    // Eski aktif reklamı kapat
    await Advertisement.updateMany(
      { guildId, isActive: true },
      { isActive: false }
    )
    
    // Yeni reklam oluştur
    const advertisement = new Advertisement({
      guildId,
      startDate: now,
      endDate,
      duration,
      isActive: true,
      createdBy: String(req.session.user.id)
    })
    
    await advertisement.save()
    
    res.json({ success: true, advertisement })
  } catch (error) {
    console.error('❌ Advertisement create error:', error)
    res.status(500).json({ error: 'Hata' })
  }
})

// Admin: Reklamı bitir
app.delete('/api/admin/advertisements/:id', isAdmin, async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id)
    if (!ad) {
      return res.status(404).json({ error: 'Reklam bulunamadı' })
    }
    
    ad.isActive = false
    await ad.save()
    
    res.json({ success: true })
  } catch (error) {
    console.error('❌ Advertisement delete error:', error)
    res.status(500).json({ error: 'Hata' })
  }
})

// Admin: Reklamı uzat
app.put('/api/admin/advertisements/:id/extend', isAdmin, async (req, res) => {
  try {
    const { duration } = req.body
    if (!duration || !['5min', '1hour', '1week', '1month', '1year'].includes(duration)) {
      return res.status(400).json({ error: 'Geçersiz duration' })
    }
    
    const ad = await Advertisement.findById(req.params.id)
    if (!ad) {
      return res.status(404).json({ error: 'Reklam bulunamadı' })
    }
    
    // Mevcut endDate'e süre ekle
    let additionalTime = 0
    switch (duration) {
      case '5min':
        additionalTime = 5 * 60 * 1000
        break
      case '1hour':
        additionalTime = 60 * 60 * 1000
        break
      case '1week':
        additionalTime = 7 * 24 * 60 * 60 * 1000
        break
      case '1month':
        additionalTime = 30 * 24 * 60 * 60 * 1000
        break
      case '1year':
        additionalTime = 365 * 24 * 60 * 60 * 1000
        break
    }
    
    ad.endDate = new Date(ad.endDate.getTime() + additionalTime)
    await ad.save()
    
    res.json({ success: true, advertisement: ad })
  } catch (error) {
    console.error('❌ Advertisement extend error:', error)
    res.status(500).json({ error: 'Hata' })
  }
})

// ==================== REKLAM YÖNETİMİ API SON ====================

// Admin: Kullanıcı yedeklemeyi manuel tetikle (sadece test için)
app.post('/api/admin/trigger-user-sync', isAdmin, async (req, res) => {
  try {
    // Bu endpoint sadece test için, production'da kaldırılabilir
    res.json({ 
      success: true, 
      message: 'Kullanıcı yedekleme bot tarafından otomatik yapılıyor. Bot loglarını kontrol edin.',
      note: 'Bot her 2 saniyede bir kullanıcıları yedekliyor. MongoDB\'de users collection\'ını kontrol edin.'
    })
  } catch (error) {
    console.error('❌ Trigger user sync error:', error)
    res.status(500).json({ error: 'Hata' })
  }
})

// Admin: Kullanıcı istatistikleri
app.get('/api/admin/users/stats', isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({})
    const backedUpUsers = await User.countDocuments({ isBackedUp: true })
    const usersWithGuilds = await User.countDocuments({ 'guilds.0': { $exists: true } })
    const usersWithVotes = await User.countDocuments({ 'votedGuilds.0': { $exists: true } })
    
    res.json({
      totalUsers,
      backedUpUsers,
      usersWithGuilds,
      usersWithVotes,
      notBackedUp: totalUsers - backedUpUsers
    })
  } catch (error) {
    console.error('❌ User stats error:', error)
    res.status(500).json({ error: 'Hata' })
  }
})

// Admin: Sunucuyu sil (isActive: false yap, gerçekten silme)
app.delete('/api/admin/guilds/:guildId', isAdmin, async (req, res) => {
  try {
    const { guildId } = req.params
    
    const guild = await Guild.findOne({ guildId })
    if (!guild) {
      return res.status(404).json({ error: 'Sunucu bulunamadı' })
    }
    
    // Sunucuyu silmek yerine isActive: false yap ve başvuru durumuna döndür
    // Böylece tekrar onaylanabilir
    guild.isActive = false
    guild.approvalStatus = 'pending' // Başvuru durumuna döndür
    guild.isApproved = false
    guild.rejectedAt = null
    guild.rejectedBy = null
    guild.rejectionReason = null
    guild.approvedAt = null
    guild.approvedBy = null
    await guild.save()
    
    // İlişkili reklamları kapat
    await Advertisement.updateMany(
      { guildId },
      { isActive: false }
    )
    
    // İlişkili yorumları sil (opsiyonel - yorumları da tutmak isterseniz bu satırı kaldırın)
    // await Comment.deleteMany({ guildId })
    
    console.log(`🗑️ Admin tarafından sunucu devre dışı bırakıldı: ${guild.name} (${guildId})`)
    
    res.json({ success: true, message: 'Sunucu başarıyla kaldırıldı' })
  } catch (error) {
    console.error('❌ Guild delete error:', error)
    res.status(500).json({ error: 'Hata' })
  }
})

// Admin: Bekleyen başvuru sayısını getir (badge için)
app.get('/api/admin/pending-guilds-count', isAdmin, async (req, res) => {
  try {
    // Hem pending hem de kaldırılan (isActive: false) sunucuları say
    const count = await Guild.countDocuments({ 
      approvalStatus: 'pending'
    })
    res.json({ count })
  } catch (error) {
    console.error('❌ Pending guilds count error:', error)
    res.status(500).json({ error: 'Hata', count: 0 })
  }
})

// Admin: Başvuru bekleyen sunucuları listele
app.get('/api/admin/pending-guilds', isAdmin, async (req, res) => {
  try {
    // Hem pending hem de kaldırılan (isActive: false) sunucuları göster
    const guilds = await Guild.find({ approvalStatus: 'pending' })
      .select('guildId name description iconURL bannerURL inviteURL memberCount onlineCount voiceCount voiceMutedCount voiceUnmutedCount voiceDeafenedCount voiceUndeafenedCount cameraCount streamCount boostCount totalVotes category ownerId ownerUsername ownerGlobalName ownerAvatarURL guildCreatedAt isSetup requestedAt isActive')
      .sort({ requestedAt: -1 })
      .lean()
    
    res.json(guilds)
  } catch (error) {
    console.error('❌ Pending guilds fetch error:', error)
    res.status(500).json({ error: 'Hata' })
  }
})

// Admin: Sunucu onayla
app.post('/api/admin/guilds/:guildId/approve', isAdmin, async (req, res) => {
  try {
    const { guildId } = req.params
    const userId = String(req.session.user.id)
    
    const guild = await Guild.findOne({ guildId })
    if (!guild) {
      return res.status(404).json({ error: 'Sunucu bulunamadı' })
    }
    
    if (guild.approvalStatus === 'approved') {
      return res.status(400).json({ error: 'Bu sunucu zaten onaylanmış' })
    }
    
    // Onayla
    guild.isApproved = true
    guild.approvalStatus = 'approved'
    guild.approvedAt = new Date()
    guild.approvedBy = userId
    
    // Davet linkini sınırsız oluştur ve setup yap
    try {
      const botToken = process.env.BOT_TOKEN
      const logGuildId = process.env.GUILD_JOIN_LOG_GUILD_ID || '1424724411457736798'
      const logChannelId = process.env.GUILD_JOIN_LOG_CHANNEL_ID || '1444653303299571752'
      
      if (botToken) {
        // Discord API ile sunucuya eriş ve davet linki oluştur
        const guildUrl = `https://discord.com/api/v10/guilds/${guildId}`
        const guildResponse = await axios.get(guildUrl, {
          headers: {
            'Authorization': `Bot ${botToken}`
          }
        }).catch(() => null)
        
        if (guildResponse) {
          // Sunucu kanallarını al
          const channelsUrl = `https://discord.com/api/v10/guilds/${guildId}/channels`
          const channelsResponse = await axios.get(channelsUrl, {
            headers: {
              'Authorization': `Bot ${botToken}`
            }
          }).catch(() => null)
          
          if (channelsResponse && channelsResponse.data) {
            // İlk text kanalını bul ve davet linki oluştur
            const textChannel = channelsResponse.data.find(ch => ch.type === 0)
            if (textChannel) {
              const inviteUrl = `https://discord.com/api/v10/channels/${textChannel.id}/invites`
              const inviteResponse = await axios.post(inviteUrl, {
                max_age: 0,
                max_uses: 0,
                unique: false
              }, {
                headers: {
                  'Authorization': `Bot ${botToken}`,
                  'Content-Type': 'application/json'
                }
              }).catch(() => null)
              
              if (inviteResponse && inviteResponse.data && inviteResponse.data.code) {
                guild.inviteURL = `https://discord.gg/${inviteResponse.data.code}`
                console.log(`✅ Sınırsız davet linki oluşturuldu: ${guild.inviteURL}`)
              }
            }
          }
        }
        
        // Setup yap
        guild.isSetup = true
        guild.setupBy = userId
        guild.setupAt = new Date()
        
        // Discord mesajını güncelle (butonları kaldır)
        if (guild.approvalMessageId) {
          const messageUrl = `https://discord.com/api/v10/channels/${logChannelId}/messages/${guild.approvalMessageId}`
          
          // Mesaj içeriğini güncelle ve butonları kaldır
          const updatedMessage = {
            content: `✅ **Sunucu Onaylandı (Web'den)**\n\n**📛 Sunucu:** ${guild.name}\n**🆔 ID:** \`${guildId}\`\n**✅ Onaylayan:** <@${userId}> (${req.session.user.username || 'Web Admin'})\n**🕐 Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>\n**🔗 Davet Linki:** ${guild.inviteURL || 'Oluşturulamadı'}\n\n✅ Bu sunucu artık web sitesinde görünecek ve setup yapıldı.`,
            components: [] // Butonları kaldır
          }
          
          await axios.patch(messageUrl, updatedMessage, {
            headers: {
              'Authorization': `Bot ${botToken}`,
              'Content-Type': 'application/json'
            }
          }).catch((err) => {
            console.warn('Discord mesaj güncelleme hatası:', err.message)
          })
          
          console.log(`✅ Discord mesajı güncellendi: ${guild.name} (${guildId}) - Log kanalı: ${logChannelId}`)
        }
      }
    } catch (logError) {
      console.warn('Discord işlem hatası:', logError.message)
    }
    
    // isActive: true yap (onaylandığında aktif olmalı)
    guild.isActive = true
    
    await guild.save()
    
    // Bot'a syncGuilds çağrısı yap (HTTP isteği ile) - anında web sitesine eklemek için
    try {
      const botSyncUrl = process.env.BOT_SYNC_URL || 'http://localhost:3001/api/sync-guilds'
      await axios.post(botSyncUrl, { guildId }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(() => {
        console.log(`✅ Bot sync başarılı: ${guild.name} (${guildId})`)
      }).catch((err) => {
        // Bot erişilemezse sessizce devam et (periyodik sync zaten ekleyecek)
        console.warn(`⚠️ Bot sync endpoint erişilemedi: ${err.message} - Sunucu periyodik sync ile eklenecek`)
      })
    } catch (syncError) {
      console.warn('⚠️ Bot sync hatası:', syncError.message)
    }
    
    res.json({ success: true, message: 'Sunucu onaylandı ve web sitesine eklendi' })
  } catch (error) {
    console.error('❌ Approve guild error:', error)
    res.status(500).json({ error: 'Hata' })
  }
})

// Admin: Sunucu reddet
app.post('/api/admin/guilds/:guildId/reject', isAdmin, async (req, res) => {
  try {
    const { guildId } = req.params
    const { reason } = req.body
    const userId = String(req.session.user.id)
    
    const guild = await Guild.findOne({ guildId })
    if (!guild) {
      return res.status(404).json({ error: 'Sunucu bulunamadı' })
    }
    
    if (guild.approvalStatus === 'rejected') {
      return res.status(400).json({ error: 'Bu sunucu zaten reddedilmiş' })
    }
    
    // Reddet
    guild.isApproved = false
    guild.approvalStatus = 'rejected'
    guild.rejectedAt = new Date()
    guild.rejectedBy = userId
    guild.rejectionReason = reason || 'Neden belirtilmedi'
    await guild.save()
    
    // Discord'a log mesajı gönder - Bot'un onay mesajını güncelle
    try {
      const botToken = process.env.BOT_TOKEN
      const logChannelId = process.env.GUILD_JOIN_LOG_CHANNEL_ID || '1444653303299571752'
      
      if (botToken && guild.approvalMessageId) {
        // Reddetme mesajını güncelle (butonları kaldır)
        const messageUrl = `https://discord.com/api/v10/channels/${logChannelId}/messages/${guild.approvalMessageId}`
        const messageContent = `❌ **Sunucu Reddedildi (Web'den)**\n\n**📛 Sunucu:** ${guild.name}\n**🆔 ID:** \`${guildId}\`\n**❌ Reddeden:** <@${userId}> (${req.session.user.username || 'Web Admin'})\n**📝 Neden:** ${reason || 'Neden belirtilmedi'}\n**🕐 Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>`
        
        await axios.patch(messageUrl, {
          content: messageContent,
          components: [] // Butonları kaldır
        }, {
          headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json'
          }
        }).catch((err) => {
          console.warn('Discord mesaj güncelleme hatası:', err.message)
        })
        
        console.log(`❌ Discord mesajı güncellendi: ${guild.name} (${guildId}) - Log kanalı: ${logChannelId}`)
      }
    } catch (logError) {
      console.warn('Discord log hatası:', logError.message)
    }
    
    res.json({ success: true, message: 'Sunucu reddedildi' })
  } catch (error) {
    console.error('❌ Reject guild error:', error)
    res.status(500).json({ error: 'Hata' })
  }
})

// Admin: Sunucu bilgilerini güncelle
app.put('/api/admin/guilds/:guildId', isAdmin, async (req, res) => {
  try {
    const { guildId } = req.params
    const { description, category, inviteURL } = req.body
    
    const guild = await Guild.findOne({ guildId })
    if (!guild) {
      return res.status(404).json({ error: 'Sunucu bulunamadı' })
    }
    
    // Input validation
    if (description !== undefined && description !== null) {
      if (typeof description !== 'string') {
        return res.status(400).json({ error: 'Description string olmalı' })
      }
      const trimmedDesc = description.trim()
      if (trimmedDesc.length < 20 || trimmedDesc.length > 500) {
        return res.status(400).json({ error: 'Description 20-500 karakter arasında olmalı' })
      }
    }
    
    if (category !== undefined) {
      if (!['public', 'private', 'game'].includes(category)) {
        return res.status(400).json({ error: 'Kategori public, private veya game olmalı' })
      }
    }
    
    if (inviteURL !== undefined && inviteURL !== null) {
      if (typeof inviteURL !== 'string') {
        return res.status(400).json({ error: 'InviteURL string olmalı' })
      }
      const trimmedInvite = inviteURL.trim()
      if (!trimmedInvite.includes('discord.gg/') && !trimmedInvite.includes('discord.com/invite/')) {
        return res.status(400).json({ error: 'Geçersiz Discord davet linki' })
      }
      if (trimmedInvite.length < 10 || trimmedInvite.length > 100) {
        return res.status(400).json({ error: 'InviteURL 10-100 karakter arasında olmalı' })
      }
    }
    
    // Güncelleme objesi oluştur
    const updateData = {}
    if (description !== undefined && description !== null) {
      updateData.description = description.trim()
    }
    if (category !== undefined && category !== null) {
      updateData.category = category
    }
    if (inviteURL !== undefined && inviteURL !== null) {
      updateData.inviteURL = inviteURL.trim()
    }
    
    // En az bir alan güncellenmeli
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Güncellenecek alan belirtilmedi' })
    }
    
    // Güncelle
    const updatedGuild = await Guild.findOneAndUpdate(
      { guildId },
      updateData,
      { new: true }
    )
    
    if (!updatedGuild) {
      return res.status(404).json({ error: 'Sunucu güncellenemedi' })
    }
    
    console.log(`✅ Admin tarafından sunucu güncellendi: ${guild.name} (${guildId})`, updateData)
    
    res.json({ 
      success: true, 
      message: 'Sunucu başarıyla güncellendi',
      guild: updatedGuild
    })
  } catch (error) {
    console.error('❌ Guild update error:', {
      message: error.message,
      stack: error.stack,
      guildId: req.params.guildId
    })
    res.status(500).json({ 
      error: 'Sunucu güncellenirken hata oluştu',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Reklam süresi bitince otomatik kaldırma - Her 5 dakikada bir kontrol et
setInterval(async () => {
  try {
    const now = new Date()
    const result = await Advertisement.updateMany(
      { isActive: true, endDate: { $lte: now } },
      { isActive: false }
    )
    if (result.modifiedCount > 0) {
      console.log(`⏰ ${result.modifiedCount} reklam süresi doldu ve kaldırıldı`)
    }
  } catch (error) {
    console.error('❌ Reklam otomatik kaldırma hatası:', error)
  }
}, 5 * 60 * 1000) // 5 dakika

// 404 Handler - Tüm route'lardan sonra ama error handler'dan önce
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint bulunamadı', path: req.path })
  }
  next()
})

// Global Error Handler - Tüm yakalanmamış hataları yakala (EN SONDA, 4 parametreli - Express otomatik tanır)
app.use((err, req, res, next) => {
  console.error('❌ GLOBAL ERROR HANDLER:', err)
  console.error('❌ Error stack:', err.stack)
  console.error('❌ Request path:', req.path)
  console.error('❌ Request method:', req.method)
  
  // Response gönderilmemişse gönder
  if (!res.headersSent) {
    try {
      res.status(500).json({ 
        error: 'Sunucu hatası', 
        message: process.env.NODE_ENV === 'development' ? err.message : 'Bir hata oluştu'
      })
    } catch (responseError) {
      console.error('❌ Response gönderilemedi:', responseError)
    }
  } else {
    // Response zaten gönderilmişse next() çağır
    next(err)
  }
})

// Unhandled Promise Rejection Handler - SUNUCU ÇÖKMESİN
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED PROMISE REJECTION:', reason)
  console.error('❌ Promise:', promise)
  // Sunucu çökmesin, sadece logla ve devam et
  // Process.exit YOK - sunucu çalışmaya devam etsin
})

// Uncaught Exception Handler - SADECE KRİTİK HATALARDA ÇIKIŞ
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error)
  console.error('❌ Error stack:', error.stack)
  console.error('❌ Error name:', error.name)
  console.error('❌ Error code:', error.code)
  
  // SADECE gerçekten kritik hatalar için process'i sonlandır
  const criticalErrors = ['EADDRINUSE', 'EACCES', 'ENOENT', 'EMFILE', 'ENFILE']
  if (error.code && criticalErrors.includes(error.code)) {
    console.error('❌ Kritik sistem hatası, sunucu kapatılıyor...')
    process.exit(1)
  }
  
  // Diğer TÜM hatalar için sunucu çalışmaya devam etsin
  console.error('⚠️ Hata yakalandı, sunucu çalışmaya devam ediyor...')
  // Process.exit YOK - sunucu çalışmaya devam etsin
})

// Process exit handler
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM sinyali alındı, sunucu kapatılıyor...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT sinyali alındı, sunucu kapatılıyor...')
  process.exit(0)
})

// Port kontrolü ve dinleme - Hata yönetimi ile
const startServer = async () => {
  // Port çakışmasını kontrol et ve temizle
  const { execSync } = await import('child_process')
  
  try {
    // Port'u kullanan TÜM process'leri bul ve öldür (kendi process'imiz hariç)
    const pids = execSync(`lsof -ti:${PORT} 2>/dev/null`, { encoding: 'utf-8' }).trim().split('\n').filter(pid => pid && pid !== process.pid.toString())
    
    if (pids.length > 0) {
      console.log(`⚠️ Port ${PORT} kullanımda (PID'ler: ${pids.join(', ')}), temizleniyor...`)
      for (const pid of pids) {
        try {
          execSync(`kill -9 ${pid} 2>/dev/null`, { timeout: 1000 })
          console.log(`✅ Process ${pid} öldürüldü`)
        } catch (killError) {
          console.log(`⚠️ Process ${pid} öldürülemedi`)
        }
      }
      // 3 saniye bekle
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  } catch (findError) {
    // Process bulunamadı, normal devam et
  }
  
  // Socket.io bağlantı yönetimi
  io.on('connection', (socket) => {
    console.log(`🔌 Socket.io bağlantısı: ${socket.id}`)
    
    socket.on('disconnect', () => {
      console.log(`🔌 Socket.io bağlantısı kesildi: ${socket.id}`)
    })
  })
  
  // Banner güncellemeleri için endpoint (bot'tan çağrılacak)
  app.post('/api/banner-update', async (req, res) => {
    try {
      const { userId, username, bannerUrl } = req.body
      
      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId gerekli' })
      }
      
      // Socket.io ile tüm bağlı client'lara bildir
      io.emit('userBannerUpdate', {
        userId,
        username: username || 'Bilinmeyen',
        bannerUrl: bannerUrl || null,
        timestamp: new Date()
      })
      
      res.json({ success: true, message: 'Banner güncellemesi yayınlandı' })
    } catch (error) {
      console.error('Banner update endpoint hatası:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })
  
  const server = httpServer.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 API: http://0.0.0.0:${PORT} (Tüm ağ arayüzlerinde dinleniyor)`)
    
    // MongoDB'de kaç sunucu var kontrol et
    try {
      const totalGuilds = await Guild.countDocuments()
      const setupGuilds = await Guild.countDocuments({ isSetup: true })
      const activeGuilds = await Guild.countDocuments({ isActive: true, isSetup: true })
      
      const activeAds = await Advertisement.countDocuments({ isActive: true, endDate: { $gt: new Date() } })
      
      console.log(`📊 MongoDB İstatistikleri:`)
      console.log(`   Toplam sunucu: ${totalGuilds}`)
      console.log(`   Setup yapılmış: ${setupGuilds}`)
      console.log(`   Aktif ve setup: ${activeGuilds}`)
      console.log(`   Aktif reklamlar: ${activeAds}`)
      
      if (activeGuilds > 0) {
        const guilds = await Guild.find({ isActive: true, isSetup: true }).limit(5)
        console.log(`\n📋 İlk 5 sunucu:`)
        guilds.forEach(g => console.log(`   - ${g.name} (${g.guildId})`))
      }
    } catch (error) {
      console.error('❌ İstatistik hatası:', error.message)
      // Hata olsa bile sunucu çalışmaya devam etsin
    }
    
    console.log(`\n⏰ Reklam otomatik kaldırma sistemi aktif (5 dakikada bir kontrol)`)
    console.log(`✅ Global error handler aktif - Sunucu hata durumunda çökmeyecek`)
  })

  // Server error handler - Port kullanımda ise
  server.on('error', async (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} zaten kullanımda!`)
      console.error(`⚠️ Eski process temizleniyor...`)
      
      // Port'u kullanan process'i öldür
      try {
        const { execSync } = await import('child_process')
        const pid = execSync(`lsof -ti:${PORT} 2>/dev/null || fuser ${PORT}/tcp 2>/dev/null | awk '{print $2}' || echo ""`, { encoding: 'utf-8' }).trim()
        if (pid && pid !== process.pid.toString() && pid !== '') {
          execSync(`kill -9 ${pid} 2>/dev/null`, { timeout: 2000 })
          console.log(`✅ Eski process öldürüldü, 2 saniye sonra tekrar başlatılıyor...`)
          setTimeout(() => {
            process.exit(1) // PM2 restart yapacak
          }, 2000)
        } else {
          process.exit(1)
        }
      } catch (killError) {
        console.error(`⚠️ Process temizlenemedi`)
        process.exit(1)
      }
    } else {
      console.error('❌ Server error:', error)
      // Diğer hatalar için process devam etsin
    }
  })
  
  return server
}

// Sunucuyu başlat
startServer().catch((error) => {
  console.error('❌ Sunucu başlatma hatası:', error)
  process.exit(1)
})

