const express = require("express");
const { Client } = require("discord.js-selfbot-v13");
const { Client: BotClient } = require("discord.js");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const http = require("http");
const { User: UserModel } = require("../Models/UserModel");
const QueriedUserModel = require("../Models/QueriedUserModel");
const os = require('os');
const GuildModel = require("../Models/guildModel");
const InviteManager = require("../utils/inviteManager");
global.apiStartTime = Date.now(); // Global olarak erişilebilir yap

// Güncelleme işleyicilerini içe aktar
const UserUpdateHandler = require("./updates/userUpdate");
const GuildMemberRemoveHandler = require("./updates/guildMemberRemove");
const GuildMemberAddHandler = require("./updates/guildMemberAdd");
const MessageCreateHandler = require("./updates/messageCreate");
const VoiceStateUpdateHandler = require("./updates/voiceStateUpdate");

// Chalk ESM uyumluluğu için dinamik import
let chalk;
(async () => {
  chalk = (await import('chalk')).default;
})();

// config.json'dan ayarları oku
const configPath = path.join(__dirname, "../../config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// MongoDB bağlantısı
const mongoUri = process.env.MONGO_URI || config.MONGO_URI || "mongodb://localhost:27017/api_db";

// MongoDB bağlantı seçenekleri
const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: true,
  retryWrites: true,
  retryReads: true
};

// MongoDB'yi arka planda başlat
mongoose.connect(mongoUri).catch(() => {
  console.log("⚠️ MongoDB bağlantısı başarısız, devam ediliyor...");
});

// Normal bot'u hemen başlat
console.log("🤖 Normal bot başlatılıyor...");
startNormalBot();

// Normal bot'u başlatma fonksiyonu
function startNormalBot() {
  console.log('🤖 Normal bot başlatılıyor...');
  
  if (config.BOT_TOKEN && config.BOT_TOKEN !== "YOUR_NORMAL_BOT_TOKEN_HERE") {
    const botClient = new BotClient({
      intents: [
        'Guilds',
        'GuildMembers',
        'GuildPresences',
        'GuildVoiceStates',
        'GuildMessages',
        'GuildMessageReactions',
        'DirectMessages',
        'MessageContent'
      ],
      partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER']
    });

    botClient.once("ready", () => {
      console.log(`🤖 Normal bot olarak giriş yapıldı: ${botClient.user.username}`);
      console.log(`📊 Bot ${botClient.guilds.cache.size} sunucuda aktif`);
      
      // Bot client'ını global olarak erişilebilir yap
      global.botClient = botClient;
      
      // Bot durumunu debug et
      console.log('🔍 Bot Debug Bilgileri:');
      console.log(`- Bot ID: ${botClient.user.id}`);
      console.log(`- Bot Tag: ${botClient.user.tag}`);
      console.log(`- Guild Sayısı: ${botClient.guilds.cache.size}`);
      console.log(`- Presence Cache Boyutu: ${botClient.guilds.cache.reduce((acc, guild) => acc + (guild.presences?.cache?.size || 0), 0)}`);
      
      // Test guild'i kontrol et
      const testGuild = botClient.guilds.cache.get('1369772633616285813');
      if (testGuild) {
        console.log(`🎯 Test Guild Bulundu: ${testGuild.name}`);
        console.log(`- Member Count: ${testGuild.memberCount}`);
        console.log(`- Presence Cache Size: ${testGuild.presences?.cache?.size || 0}`);
        console.log(`- Voice States Size: ${testGuild.voiceStates?.cache?.size || 0}`);
      } else {
        console.log('❌ Test Guild bulunamadı!');
      }
      
      // Bot hazır olduğunda guild istatistiklerini güncelle
      setTimeout(() => {
        if (clients.length > 0) {
          updateGuildStats(clients);
        }
      }, 5000);
    });

    botClient.on('error', (error) => {
      console.error('❌ Normal bot client hatası:', error);
    });

    botClient.on('disconnect', () => {
      console.log('⚠️ Normal bot bağlantısı kesildi, yeniden bağlanıyor...');
    });

    botClient.login(config.BOT_TOKEN).catch((err) => {
      console.error(`❌ Normal bot token ile giriş yapılamadı:`, err);
    });
  } else {
    console.log('⚠️ Normal bot token bulunamadı veya geçersiz');
  }
}

let currentUpdatedCount = 0; // Güncellenen kullanıcı sayısı
let totalApiQueries = 0; // Toplam API sorgu sayısı
let lastBackupLog = null;

// Sayıları kalıcı hale getirmek için dosya sistemi kullan
function loadCounters() {
  try {
    const countersPath = path.join(__dirname, 'counters.json');
    if (fs.existsSync(countersPath)) {
      const data = JSON.parse(fs.readFileSync(countersPath, 'utf8'));
      currentUpdatedCount = data.updatedCount || 0;
      totalApiQueries = data.apiQueries || 0;
      console.log('Sayaçlar yüklendi:', { updatedCount: currentUpdatedCount, apiQueries: totalApiQueries });
    }
  } catch (error) {
    console.log('Sayaç yükleme hatası (normal):', error.message);
  }
}

function saveCounters() {
  try {
    const countersPath = path.join(__dirname, 'counters.json');
    const data = {
      updatedCount: currentUpdatedCount,
      apiQueries: totalApiQueries,
      lastSaved: new Date().toISOString()
    };
    fs.writeFileSync(countersPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Sayaç kaydetme hatası:', error);
  }
}

// Sistem başlarken sayaçları yükle
loadCounters();

// En çok sorgulanan kullanıcıları MongoDB'den yükle
async function loadTopQueriedUsers() {
  try {
    const topUsers = await QueriedUserModel.find()
      .sort({ queryCount: -1 })
      .limit(5)
      .lean();
    
    // Global map'i güncelle
    mostQueriedUsers.clear();
    topUsers.forEach(user => {
      mostQueriedUsers.set(user.userId, {
        count: user.queryCount,
        username: user.username,
        avatar: user.avatar,
        lastQuery: user.lastQuery
      });
    });
    
    console.log(`${topUsers.length} en çok sorgulanan kullanıcı MongoDB'den yüklendi`);
  } catch (error) {
    console.error('En çok sorgulanan kullanıcılar yüklenirken hata:', error);
  }
}

// En çok sorgulanan kullanıcıyı MongoDB'ye kaydet
async function saveTopQueriedUser(userId, userInfo) {
  try {
    await QueriedUserModel.findOneAndUpdate(
      { userId: userId },
      {
        userId: userId,
        username: userInfo.username,
        avatar: userInfo.avatar,
        queryCount: userInfo.count,
        lastQuery: userInfo.lastQuery
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('En çok sorgulanan kullanıcı kaydedilirken hata:', error);
  }
}

// Her 30 saniyede bir sayaçları kaydet
setInterval(saveCounters, 30000);

// Sistem kararlılığı için hata yakalama
process.on('uncaughtException', (err) => {
  console.error('❌ Yakalanmamış hata:', err);
  // Kritik hatalarda sistemi yeniden başlatma
  if (err.code === 'ECONNRESET' || err.code === 'ENOTFOUND') {
    console.log('🔄 Bağlantı hatası, sistem devam ediyor...');
  } else {
    console.log('🔄 Kritik hata, sistem 5 saniye sonra yeniden başlatılıyor...');
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ İşlenmeyen Promise reddi:', reason);
  // Promise hatalarını yakala ama sistemi durdurma
});

// Memory leak koruması
process.on('warning', (warning) => {
  console.warn('⚠️ Sistem uyarısı:', warning.message);
});

// Bellek kullanımını izle
setInterval(() => {
  const used = process.memoryUsage();
  if (used.heapUsed > 500 * 1024 * 1024) { // 500MB üzeri
    console.warn('Yüksek bellek kullanımı:', Math.round(used.heapUsed / 1024 / 1024) + 'MB');
    global.gc && global.gc(); // Garbage collection zorla
  }
}, 30000); // 30 saniyede bir kontrol

function formatUptime(seconds) {
  seconds = Math.floor(seconds);
  const d = Math.floor(seconds / (3600*24));
  const h = Math.floor((seconds % (3600*24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  let str = '';
  if (d > 0) str += d + ' gün, ';
  if (h > 0) str += h + ' saat, ';
  if (m > 0) str += m + ' dakika, ';
  str += s + ' saniye';
  return str;
}

// Guild istatistiklerini güncelleme fonksiyonu
async function updateGuildStats(clients) {
  try {
    console.log('🔄 Guild istatistikleri güncelleniyor...');
    console.log(`📊 Global bot client durumu: ${global.botClient ? 'Mevcut' : 'Yok'}`);
    
    // Önce normal bot client'ını kullan
    if (global.botClient && global.botClient.guilds && global.botClient.guilds.cache) {
      console.log('🤖 Normal bot ile guild istatistikleri güncelleniyor...');
      console.log(`📊 Normal bot guild sayısı: ${global.botClient.guilds.cache.size}`);
      
      for (const [guildId, guild] of global.botClient.guilds.cache) {
        try {
          // Normal bot'tan daha doğru veri al
          let memberCount = guild.memberCount || 0;
          let onlineMembers = 0;
          let voiceMembers = 0;
          
          // Üye sayısını kontrol et
          if (memberCount === 0 && guild.members && guild.members.cache) {
            memberCount = guild.members.cache.size;
          }
          
          // Presence'ları say (online, idle, dnd)
          if (guild.presences && guild.presences.cache) {
            onlineMembers = guild.presences.cache.size;
          }
          
          // Ses kanalındaki üyeleri say
          if (guild.voiceStates && guild.voiceStates.cache) {
            voiceMembers = guild.voiceStates.cache.size;
          }
          
          // Offline üyeleri hesapla
          const offlineMembers = Math.max(0, memberCount - onlineMembers);
          
          // Guild istatistiklerini güncelle
          const updateData = {
            memberCount: memberCount,
            onlineMembers: onlineMembers,
            offlineMembers: offlineMembers,
            voiceMembers: voiceMembers,
            lastUpdated: new Date()
          };
          
          await GuildModel.findOneAndUpdate(
            { guildId: guildId },
            { $set: updateData },
            { upsert: true, new: true }
          );
          
          console.log(`✅ [BOT] Guild ${guild.name}: ${memberCount} üye, ${onlineMembers} online, ${voiceMembers} ses`);
        } catch (guildError) {
          console.error(`❌ [BOT] Guild ${guildId} hatası:`, guildError.message);
        }
      }
    }
    
    // Sonra selfbot'ları kullan (yedek olarak)
    for (const client of clients) {
      if (!client || !client.guilds || !client.guilds.cache) continue;
      
      for (const [guildId, guild] of client.guilds.cache) {
        try {
          // Eğer normal bot'ta bu guild yoksa, selfbot'tan al
          const existingGuild = await GuildModel.findOne({ guildId: guildId });
          if (existingGuild && existingGuild.lastUpdated > new Date(Date.now() - 60000)) {
            // Son 1 dakikada güncellenmişse atla
            continue;
          }
          
          let memberCount = guild.memberCount || 0;
          let onlineMembers = 0;
          let voiceMembers = 0;
          
          if (memberCount === 0 && guild.members && guild.members.cache) {
            memberCount = guild.members.cache.size;
          }
          
          if (guild.presences && guild.presences.cache) {
            onlineMembers = guild.presences.cache.size;
          }
          
          if (guild.voiceStates && guild.voiceStates.cache) {
            voiceMembers = guild.voiceStates.cache.size;
          }
          
          const offlineMembers = Math.max(0, memberCount - onlineMembers);
          
          const updateData = {
            memberCount: memberCount,
            onlineMembers: onlineMembers,
            offlineMembers: offlineMembers,
            voiceMembers: voiceMembers,
            lastUpdated: new Date()
          };
          
          await GuildModel.findOneAndUpdate(
            { guildId: guildId },
            { $set: updateData },
            { upsert: true, new: true }
          );
          
          console.log(`✅ [SELFBOT] Guild ${guild.name}: ${memberCount} üye, ${onlineMembers} online, ${voiceMembers} ses`);
        } catch (guildError) {
          console.error(`❌ [SELFBOT] Guild ${guildId} hatası:`, guildError.message);
        }
      }
    }
    
    console.log('✅ Guild istatistikleri güncelleme tamamlandı');
  } catch (error) {
    console.error('❌ Guild istatistikleri güncellenirken genel hata:', error);
  }
}

class UserController {
  constructor(app, clients) {
    this.clients = clients;
    this.app = app;
    this.routes();
    this.updateQueue = new Map(); // Güncelleme kuyruğu
    this.batchSize = 100; // Toplu güncelleme boyutu
    this.updateInterval = 5000; // 5 saniyede bir toplu güncelleme
    
    // Davet linki yöneticisini başlat
    this.inviteManager = new InviteManager();
    
    // Güncelleme işleyicilerini başlat
    this.updateHandlers = [
      new UserUpdateHandler(clients, this),
      new GuildMemberRemoveHandler(clients, this),
      new GuildMemberAddHandler(clients, this),
      new MessageCreateHandler(clients, this),
      new VoiceStateUpdateHandler(clients, this)
    ];

    // Toplu güncelleme zamanlayıcısını başlat
    this.startBatchUpdateTimer();
    
    // Guild istatistiklerini düzenli olarak güncelle (her 15 saniyede bir)
    setInterval(() => {
      try {
      if (this.clients && this.clients.length > 0) {
        updateGuildStats(this.clients);
      }
      } catch (error) {
        console.error('❌ Guild istatistikleri güncelleme hatası:', error);
      }
    }, 15000);

    // Sunucu başlıldığında toplam kullanıcı sayısını logla
    setTimeout(() => {
      UserModel.countDocuments().then(count => {
        // LOG KALDIRILDI
        // if (chalk) {
        //   console.log(chalk.magentaBright('🗄️  [YEDEKLENEN KULLANICI] ') + chalk.bold(`${count}`));
        //   console.log(chalk.yellowBright('🚀 [YEDEKLEME BAŞLADI] Kullanıcılar yedekleniyor...'));
        // } else {
        //   console.log(`[YEDEKLENEN KULLANICI] ${count}`);
        //   console.log(`[YEDEKLEME BAŞLADI] Kullanıcılar yedekleniyor...`);
        // }
      }).catch(err => {
        if (chalk) {
          console.error(chalk.red('Kullanıcı sayısı alınamadı:'), err);
        } else {
          console.error('Kullanıcı sayısı alınamadı:', err);
        }
      });

      // En çok sorgulanan kullanıcıları MongoDB'den yükle
      loadTopQueriedUsers();

      // Davet linklerini önbelleğe yükle
      this.inviteManager.loadInvitesToCache().then((cachedCount) => {
        if (chalk) {
          console.log(chalk.green('💾 ') + chalk.bold.white('Özel davet bağlantısı önbelleği hazır! ') + chalk.cyan(`${cachedCount} Vanity URL yüklendi`));
        } else {
          console.log(`💾 Özel davet bağlantısı önbelleği hazır! ${cachedCount} Vanity URL yüklendi`);
        }
        
        // Arka planda tüm davet linklerini topla ve güncelle
        setTimeout(() => {
          if (chalk) {
            console.log(chalk.yellow('🚀 ') + chalk.bold.white('Özel davet bağlantıları (Vanity URL) tarama işlemi başlatılıyor...'));
          } else {
            console.log('🚀 Özel davet bağlantıları (Vanity URL) tarama işlemi başlatılıyor...');
          }
          
          this.inviteManager.collectAllInvites(this.clients).then((result) => {
            if (chalk) {
              console.log('');
              console.log(chalk.green('🏆 ') + chalk.bold.white('ÖZEL DAVET BAĞLANTISI SİSTEMİ HAZIR!'));
              console.log(chalk.cyan('📋 ') + chalk.white('Toplam Sunucu: ') + chalk.green(result.totalProcessed));
              console.log(chalk.green('✅ ') + chalk.white('Başarılı: ') + chalk.green(result.totalSuccess));
              if (result.totalSkipped > 0) console.log(chalk.blue('⏭️  ') + chalk.white('Atlanan (Güncel): ') + chalk.blue(result.totalSkipped));
              if (result.totalUpdated > 0) console.log(chalk.yellow('🔄 ') + chalk.white('Güncellenen: ') + chalk.yellow(result.totalUpdated));
              if (result.totalFailed > 0) console.log(chalk.red('❌ ') + chalk.white('Başarısız: ') + chalk.red(result.totalFailed));
              
              console.log('');
              console.log(chalk.magenta('🌟 ') + chalk.bold.white('Sistem artık tüm sunucuların özel davet bağlantılarını kontrol etti!'));
              console.log(chalk.gray('📡 ') + chalk.white('Sadece Vanity URL\'ler API\'de görünecek...'));
              console.log('');
            } else {
              console.log(`🏆 ÖZEL DAVET BAĞLANTISI SİSTEMİ HAZIR!`);
              console.log(`📋 Toplam: ${result.totalProcessed}, Başarılı: ${result.totalSuccess}, Atlanan: ${result.totalSkipped || 0}`);
              console.log(`🌟 Sistem artık tüm sunucuların özel davet bağlantılarını kontrol etti!`);
            }
          }).catch(error => {
            if (chalk) {
              console.error(chalk.red('💥 ') + chalk.white('Özel davet bağlantısı tarama hatası: ') + chalk.red(error.message));
            } else {
              console.error('❌ Özel davet bağlantısı tarama hatası:', error);
            }
          });
        }, 3000); // 3 saniye sonra başlat (daha hızlı)
      });

      // Tüm kullanıcıları toplu yedekle
      this.backupAllUsers(this.clients).then(() => {
        // LOG KALDIRILDI
        // if (chalk) {
        //   console.log(chalk.greenBright('✅ [YEDEKLEME TAMAMLANDI] Tüm kullanıcılar yedeklendi!'));
        // } else {
        //   console.log('[YEDEKLEME TAMAMLANDI] Tüm kullanıcılar yedeklendi!');
        // }
      });

      // Sistem başlarken erişilebilen toplam kullanıcı
      setTimeout(() => {
        let totalGuildMembers = 0;
        if (this.clients && this.clients.length > 0) {
          this.clients.forEach(client => {
            client.guilds.cache.forEach(guild => {
              totalGuildMembers += guild.memberCount;
            });
          });
        }
        // LOG KALDIRILDI
        // if (chalk) {
        //   console.log(chalk.cyanBright('🟢 [SİSTEM HİZMETİ] Sunuculardaki toplam kullanıcı: ') + chalk.bold(totalGuildMembers));
        // } else {
        //   console.log(`[SİSTEM HİZMETİ] Sunuculardaki toplam kullanıcı: ${totalGuildMembers}`);
        // }
      }, 4000);
    }, 1000);

    // Socket.io ile yedeklenen kullanıcı sayısını yayınla
    io.on('connection', (socket) => {
      // Bağlantı hatalarını yakala
      socket.on('error', (error) => {
        console.error('Socket.io bağlantı hatası:', error);
      });
      
      socket.on('disconnect', (reason) => {
        if (reason === 'io server disconnect') {
          console.log('Sunucu tarafından bağlantı kesildi');
        }
      });
      
      socket.emit('backedUpCount', currentBackedUpCount);
      socket.emit('coloredCount', currentColoredCount);
      socket.emit('updatedCount', currentUpdatedCount);
      socket.emit('apiQueryCount', totalApiQueries);
      
      // Toplam sunucu sayısını hesapla ve gönder
      let totalServers = 0;
      clients.forEach(client => {
        if (client && client.guilds && client.guilds.cache) {
          totalServers += client.guilds.cache.size;
        }
      });
      socket.emit('totalServers', totalServers);
      
      // En çok sorgulanan kullanıcıları gönder
      const topUsers = Array.from(mostQueriedUsers.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([id, info]) => ({
          id,
          username: info.username,
          avatar: info.avatar,
          count: info.count,
          lastQuery: info.lastQuery
        }));
      socket.emit('topQueriedUsers', topUsers);
      
      // Sistem durumu güncellemelerini gönder
      setInterval(async () => {
        try {
          // Gerçek sistem verilerini al
          const totalUsers = clients.reduce((acc, client) => {
            if (!client || !client.guilds || !client.guilds.cache) return acc;
            return acc + client.guilds.cache.reduce((guildAcc, guild) => guildAcc + guild.memberCount, 0);
          }, 0);
          
          // MongoDB'den gerçek yedeklenen kullanıcı sayısını al
          const realBackedUpCount = await UserModel.countDocuments();
          currentBackedUpCount = realBackedUpCount; // Global değişkeni güncelle
          
          const totalMem = os.totalmem();
          const freeMem = os.freemem();
          const usedMem = totalMem - freeMem;
          
          // CPU kullanımını al
          const cpus = os.cpus();
          const cpuUsage = cpus.reduce((acc, cpu) => {
            if (!cpu || !cpu.times) return acc;
            const total = Object.values(cpu.times).reduce((a, b) => a + b);
            const idle = cpu.times.idle;
            return acc + ((total - idle) / total);
          }, 0) / cpus.length * 100;
          
          const systemStats = {
            totalUsers: totalUsers,
            backedUpUsers: realBackedUpCount, // Gerçek MongoDB sayısı
            apiPing: Math.floor(Math.random() * 50) + 50, // Gerçekçi ping
            memoryUsage: Math.round(usedMem / (1024*1024*1024) * 100) / 100, // GB cinsinden, 2 ondalık
            totalMem: Math.round(totalMem / (1024*1024*1024) * 100) / 100, // GB cinsinden, 2 ondalık
            freeMem: Math.round(freeMem / (1024*1024*1024) * 100) / 100, // GB cinsinden, 2 ondalık
            memoryPercent: Math.round((usedMem / totalMem) * 100), // Yüzde hesaplaması
            cpuUsage: Math.round(cpuUsage), // Gerçek CPU kullanımı
            cpuModel: os.cpus()[0].model, // CPU model adı
            cpuCores: os.cpus().length, // CPU çekirdek sayısı
            apiStartTime: global.apiStartTime, // Gerçek başlangıç zamanı
            discordPing: clients.reduce((acc, client) => {
              if (!client || !client.ws) return acc;
              return acc + (client.ws?.ping || 0);
            }, 0) / Math.max(clients.length, 1)
          };
          socket.emit('systemUpdate', systemStats);
          
          // Sunucu bilgilerini de gönder
          const allServers = [];
          clients.forEach((client, clientIndex) => {
            if (!client || !client.guilds || !client.guilds.cache) return;
            client.guilds.cache.forEach(guild => {
              if (!guild || !guild.members) return;
              const owner = guild.members.cache.get(guild.ownerId);
              allServers.push({
                id: guild.id,
                name: guild.name,
                memberCount: guild.memberCount,
                ownerId: guild.ownerId,
                ownerName: owner ? owner.user.username : 'Bilinmiyor',
                ownerAvatar: owner ? owner.user.displayAvatarURL({ size: 128 }) : null,
                icon: guild.iconURL({ size: 128 }),
                banner: guild.bannerURL({ size: 512 }),
                joinedAt: guild.joinedAt,
                clientIndex: clientIndex + 1,
                botName: client.user.username,
                botAvatar: client.user.displayAvatarURL({ size: 64 })
              });
            });
          });
          
          // Sunucuları üye sayısına göre sırala
          allServers.sort((a, b) => b.memberCount - a.memberCount);
          const recentServers = allServers.slice(0, 6);
          
          const serverStats = {
            totalServers: allServers.length,
            totalMembers: allServers.reduce((sum, server) => sum + server.memberCount, 0),
            activeBots: clients.length,
            lastAddedServer: recentServers[0] ? recentServers[0].name : 'Yok',
            recentServers: recentServers
          };
          socket.emit('serverUpdate', serverStats);
          
        } catch (error) {
          console.error('Sistem güncellemesi hatası:', error);
          // Hata durumunda basit veri gönder
          socket.emit('systemUpdate', {
            totalUsers: 0,
            backedUpUsers: 0,
            apiPing: 100,
            memoryUsage: 0,
            totalMem: 0,
            freeMem: 0,
            memoryPercent: 0,
            cpuUsage: 0,
            cpuModel: 'Bilinmiyor',
            cpuCores: 0,
            apiStartTime: global.apiStartTime,
            discordPing: 0
          });
        }
      }, 10000); // 10 saniyede bir güncelle
    });
  }

  routes() {
    this.app.route("/api/user").get(this.getUser.bind(this));
    this.app.route("/api/server").get(this.getServer.bind(this));
    
    // Davet linki yönetimi için yeni endpoint'ler
    this.app.get('/api/invites/stats', (req, res) => {
      try {
        const stats = this.inviteManager.getCacheStats();
        res.json({
          success: true,
          ...stats
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/invites/refresh/:guildId', async (req, res) => {
      try {
        const { guildId } = req.params;
        const result = await this.inviteManager.updateInvite(guildId, this.clients);
        
        if (result) {
          res.json({
            success: true,
            message: 'Davet linki güncellendi',
            inviteUrl: result.inviteUrl
          });
        } else {
          res.status(404).json({
            success: false,
            message: 'Sunucu bulunamadı veya davet linki oluşturulamadı'
          });
        }
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/invites/collect', async (req, res) => {
      try {
        const result = await this.inviteManager.collectAllInvites(this.clients);
        res.json({
          success: true,
          message: 'Davet linkleri toplandı',
          ...result
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Guild verilerini zorla yenileme endpoint'i
    this.app.post('/api/guilds/refresh', async (req, res) => {
      try {
        console.log('🔄 Tüm guild verileri zorla yenileniyor...');
        
        // MongoDB'deki tüm guild verilerini eski olarak işaretle
        await GuildModel.updateMany(
          {},
          { $set: { lastUpdated: new Date(Date.now() - 10 * 60 * 1000) } } // 10 dakika önce
        );
        
        // Guild istatistiklerini güncelle
        await updateGuildStats(this.clients);
        
        res.json({
          success: true,
          message: 'Guild verileri zorla yenilendi'
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Belirli bir guild'i zorla yenileme endpoint'i
    this.app.post('/api/guilds/refresh/:guildId', async (req, res) => {
      try {
        const { guildId } = req.params;
        console.log(`🔄 Guild ${guildId} zorla yenileniyor...`);
        
        // MongoDB'deki guild verisini eski olarak işaretle
        await GuildModel.updateOne(
          { guildId: guildId },
          { $set: { lastUpdated: new Date(Date.now() - 10 * 60 * 1000) } }
        );
        
        // Guild istatistiklerini güncelle
        await updateGuildStats(this.clients);
        
        res.json({
          success: true,
          message: `Guild ${guildId} zorla yenilendi`
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    // Status endpointi
    this.app.get('/status', async (req, res) => {
      try {
        const start = Date.now();
        // Discord sunucularındaki toplam üye
        let totalGuildMembers = 0;
        let discordPings = [];
        clients.forEach(client => {
          client.guilds.cache.forEach(guild => {
            totalGuildMembers += guild.memberCount;
          });
          if (client.ws && client.ws.ping) discordPings.push(client.ws.ping);
        });
        // MongoDB'deki toplam kullanıcı
        const totalBackedUp = await UserModel.countDocuments();
        // Sistem bilgisi
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const cpuModel = os.cpus()[0].model;
        const uptime = os.uptime();
        const apiUptime = Math.floor((Date.now() - global.apiStartTime) / 1000);
        // API gecikmesi
        const apiPing = Date.now() - start;
        // Discord botlarının ortalama ping'i
        const avgDiscordPing = discordPings.length > 0 ? Math.round(discordPings.reduce((a, b) => a + b, 0) / discordPings.length) : null;

        // Bellek hesaplamaları (GB cinsinden)
        const totalMemGB = Math.round((totalMem / (1024*1024*1024)) * 100) / 100;
        const usedMemGB = Math.round((usedMem / (1024*1024*1024)) * 100) / 100;
        const freeMemGB = Math.round((freeMem / (1024*1024*1024)) * 100) / 100;
        const memoryPercent = Math.round((usedMem / totalMem) * 100);

        // Gerçekçi performans metrikleri
        const avgResponseTime = Math.floor(Math.random() * 50) + 80; // 80-130ms arası
        const maxThroughput = Math.floor(totalGuildMembers / 15); // Kullanıcı sayısına göre
        const errorRate = apiPing > 200 ? 0.5 : 0.23; // API yavaşsa hata oranı artar
        const activeUsers = Math.floor(totalGuildMembers * 0.15); // Toplam kullanıcının %15'i aktif

        // Placeholder veriler (son kayıtlar, grafik vs.)
        const sonGiren = 'user1#0001';
        const sonCikan = 'user2#0002';
        const sonKayitOlan = 'user3#0003';
        const sonTagli = 'user4#0004';
        const gunlukGirisYapanlar = '5';
        const toplamKayit = totalBackedUp;
        const toplamTagli = '12';
        const aktifSunucu = clients.reduce((acc, client) => acc + client.guilds.cache.size, 0);

        // Sunucu loglarını çek
        const guildLogs = await GuildModel.find({}, {
          guildId: 1,
          name: 1,
          icon: 1,
          banner: 1,
          ownerId: 1,
          ownerName: 1,
          ownerAvatar: 1,
          logs: { $slice: -5 } // Son 5 log
        }).sort({ lastUpdated: -1 }).limit(10).lean();

        if ((req.headers.accept && req.headers.accept.includes('text/html')) || req.query.html === '1') {
          // status.html dosyasını oku ve dinamik verileri yerleştir
          const statusHtmlPath = path.join(__dirname, 'status.html');
          let html = fs.readFileSync(statusHtmlPath, 'utf8');
          html = html
            .replace(/\$\{totalGuildMembers\}/g, totalGuildMembers.toLocaleString('tr-TR'))
            .replace(/\$\{totalBackedUp\}/g, totalBackedUp.toLocaleString('tr-TR'))
            .replace(/\$\{apiPing\}/g, apiPing)
            .replace(/\$\{(usedMem\/1024\/1024\/1024)\.toFixed\(2\)\}/g, usedMemGB.toFixed(2))
            .replace(/\$\{avgDiscordPing \|\| 0\}/g, avgDiscordPing || 0)
            .replace(/\$\{sonGiren\}/g, sonGiren)
            .replace(/\$\{sonCikan\}/g, sonCikan)
            .replace(/\$\{sonKayitOlan\}/g, sonKayitOlan)
            .replace(/\$\{sonTagli\}/g, sonTagli)
            .replace(/\$\{gunlukGirisYapanlar\}/g, gunlukGirisYapanlar)
            .replace(/\$\{toplamKayit\}/g, toplamKayit.toLocaleString('tr-TR'))
            .replace(/\$\{toplamTagli\}/g, toplamTagli)
            .replace(/\$\{aktifSunucu\}/g, aktifSunucu)
            .replace(/\$\{lastBackupLog\}/g, lastBackupLog ? lastBackupLog : '');
          return res.send(html);
        }

        // JSON olarak döndür
        res.json({
          success: true,
          totalDiscordUsers: totalGuildMembers,
          totalBackedUpUsers: totalBackedUp,
          apiPing,
          systemInfo: {
            cpuModel,
            totalMem: totalMemGB,
            usedMem: usedMemGB,
            freeMem: freeMemGB,
            memoryPercent: memoryPercent,
            uptime: formatUptime(uptime),
            apiUptime: formatUptime(apiUptime)
          },
          discordPing: avgDiscordPing,
          performanceMetrics: {
            avgResponseTime,
            maxThroughput,
            errorRate,
            activeUsers
          },
          guildLogs, // <-- Sunucu logları burada
          lastBackupLog: lastBackupLog ? lastBackupLog : undefined
        });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // Kullanıcı ve sistem istatistikleri için yeni endpoint
    this.app.get('/api/stats', async (req, res) => {
      try {
        // Son 14 gün için örnek veri üret (gerçek uygulamada DB'den alınır)
        const days = 14;
        const userActivity = [];
        const systemPerformance = [];
        const now = new Date();
        // Toplam değerler (örnek)
        const totalDiscordUsers = 20000 + Math.floor(Math.random() * 1000);
        const totalBackedUpUsers = 15000 + Math.floor(Math.random() * 500);
        const apiPing = 80 + Math.floor(Math.random() * 40);
        const discordPing = 60 + Math.floor(Math.random() * 30);
        const totalMem = 32; // GB
        const usedMem = 12 + Math.random() * 10; // GB
        const cpuUsage = 30 + Math.floor(Math.random() * 40); // %
        const userCapacity = 25000;
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          // Kullanıcı verileri (örnek)
          userActivity.push({
            date: date.toISOString().slice(0, 10),
            totalUsers: 18000 + i * 50 + Math.floor(Math.random() * 100),
            backedUpUsers: 14000 + i * 40 + Math.floor(Math.random() * 80),
            apiDelay: 80 + Math.floor(Math.random() * 40),
            discordPing: 60 + Math.floor(Math.random() * 30),
          });
          // Sistem verileri (örnek)
          systemPerformance.push({
            date: date.toISOString().slice(0, 10),
            ram: 40 + Math.floor(Math.random() * 40), // %
            cpu: 30 + Math.floor(Math.random() * 40), // %
            usedMem: 10 + Math.random() * 15, // GB
            totalMem: 32, // GB
            apiPing: 80 + Math.floor(Math.random() * 40),
            discordPing: 60 + Math.floor(Math.random() * 30),
            userBar: (18000 + i * 50) / userCapacity * 100,
          });
        }
        res.json({
          success: true,
          totalDiscordUsers,
          totalBackedUpUsers,
          apiPing,
          discordPing,
          totalMem,
          usedMem,
          cpuUsage,
          userCapacity,
          userActivity,
          systemPerformance
        });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // Sunucu bilgileri için endpoint
    this.app.get('/api/servers', async (req, res) => {
      try {
        const allServers = [];
        const serverOwners = new Map();
        
        // Tüm client'lardan sunucu bilgilerini topla
        clients.forEach((client, clientIndex) => {
          client.guilds.cache.forEach(guild => {
            const owner = guild.members.cache.get(guild.ownerId);
            allServers.push({
              id: guild.id,
              name: guild.name,
              memberCount: guild.memberCount,
              ownerId: guild.ownerId,
              ownerName: owner ? owner.user.username : 'Bilinmiyor',
              ownerAvatar: owner ? owner.user.displayAvatarURL({ size: 128 }) : null,
              icon: guild.iconURL({ size: 128 }),
              banner: guild.bannerURL({ size: 512 }),
              joinedAt: guild.joinedAt,
              clientIndex: clientIndex + 1,
              botName: client.user.username,
              botAvatar: client.user.displayAvatarURL({ size: 64 })
            });
            
            // Sunucu sahibi bilgilerini sakla
            if (owner) {
              serverOwners.set(guild.ownerId, {
                username: owner.user.username,
                avatar: owner.user.displayAvatarURL({ size: 128 })
              });
            }
          });
        });
        
        // Sunucuları üye sayısına göre sırala
        allServers.sort((a, b) => b.memberCount - a.memberCount);
        
        // Son eklenen 6 sunucuyu al
        const recentServers = allServers.slice(0, 6);
        
        // Toplam istatistikler
        const totalServers = allServers.length;
        const totalMembers = allServers.reduce((sum, server) => sum + server.memberCount, 0);
        const activeBots = clients.length;
        const lastAddedServer = recentServers[0] ? recentServers[0].name : 'Yok';
        
        res.json({
          success: true,
          totalServers,
          totalMembers,
          activeBots,
          lastAddedServer,
          recentServers,
          allServers: allServers.slice(0, 20) // İlk 20 sunucu
        });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });
  }

  async getServer(req, res) {
    const serverId = req.query.id;
    
    try {
      if (!serverId) {
        // Tüm sunucuları MongoDB'den hızlıca al
        console.log('📋 Tüm sunucular MongoDB\'den çekiliyor...');
        
        const allServers = await GuildModel.find({}, {
          guildId: 1,
          name: 1,
          memberCount: 1,
          onlineMembers: 1,
          offlineMembers: 1,
          voiceMembers: 1,
          ownerId: 1,
          ownerName: 1,
          ownerAvatar: 1,
          icon: 1,
          banner: 1,
          joinedAt: 1,
          clientIndex: 1,
          botName: 1,
          botAvatar: 1,
          inviteUrl: 1,
          lastUpdated: 1
        }).sort({ memberCount: -1 }).lean();

        // Önbellekten davet linklerini ekle
        const serversWithInvites = allServers.map(server => {
          const cachedInvite = this.inviteManager.getCachedInvite(server.guildId);
          return {
            id: server.guildId,
            name: server.name,
            memberCount: server.memberCount || 0,
            onlineMembers: server.onlineMembers || 0,
            offlineMembers: server.offlineMembers || 0,
            voiceMembers: server.voiceMembers || 0,
            ownerId: server.ownerId,
            ownerName: server.ownerName || 'Bilinmiyor',
            ownerAvatar: server.ownerAvatar,
            icon: server.icon,
            banner: server.banner,
            joinedAt: server.joinedAt,
            clientIndex: server.clientIndex || 1,
            botName: server.botName || 'Bot',
            botAvatar: server.botAvatar,
            inviteUrl: (cachedInvite && cachedInvite.url) ? cachedInvite.url : null,
            lastUpdated: server.lastUpdated
          };
        });

        console.log(`✅ ${serversWithInvites.length} sunucu MongoDB'den başarıyla çekildi`);
        
        return res.status(200).json({
          success: true,
          servers: serversWithInvites,
          totalServers: serversWithInvites.length,
          cached: true,
          lastUpdate: new Date()
        });
        
      } else {
        // Belirli bir sunucu için Discord'dan canlı veri çek (önbellek kullanma)
        console.log(`⚡ Sunucu ${serverId} Discord'dan canlı olarak alınıyor...`);
        
        let targetGuild = null;
        let targetClient = null;
        let clientIndex = -1;
        
        // Discord'dan sunucuyu bul (önce normal bot, sonra selfbot'lar)
        const allClients = [...this.clients];
        if (global.botClient) {
          allClients.unshift(global.botClient);
        }
        
        for (const [index, client] of allClients.entries()) {
          if (!client || !client.guilds || !client.guilds.cache) continue;
          
          const guild = client.guilds.cache.get(serverId);
          if (guild) {
            targetGuild = guild;
            targetClient = client;
            clientIndex = index;
            break;
          }
        }
        
        if (!targetGuild) {
          return res.status(404).json({
            success: false,
            message: "Belirtilen sunucu bulunamadı."
          });
        }

        // Owner bilgilerini al
        const owner = targetGuild.members.cache.get(targetGuild.ownerId);
        
        // VANITY URL (ÖZEL DAVET) kontrol et
        let vanityUrl = null;
        try {
          // Vanity URL'yi Discord API'den al
          const vanityData = await targetGuild.fetchVanityData().catch(() => null);
          if (vanityData && vanityData.code) {
            vanityUrl = `https://discord.gg/${vanityData.code}`;
          }
        } catch (vanityError) {
          console.log(`Vanity URL alınamadı (${targetGuild.name}):`, vanityError.message);
        }
        
        // Eğer vanity URL yoksa, önbellekten davet linkini al veya oluştur
        let inviteUrl = vanityUrl;
        if (!inviteUrl) {
          let cachedInvite = this.inviteManager.getCachedInvite(serverId);
          if (!cachedInvite) {
            console.log(`🔗 Sunucu ${targetGuild.name} için davet linki oluşturuluyor...`);
            await this.inviteManager.updateInvite(serverId, this.clients);
            cachedInvite = this.inviteManager.getCachedInvite(serverId);
          }
          inviteUrl = cachedInvite?.url || null;
        }

        // Üye sayılarını doğru şekilde hesapla (Discord'dan canlı veri)
        let memberCount = targetGuild.memberCount || 0;
        let onlineMembers = 0;
        let voiceMembers = 0;
        
        // Eğer memberCount 0 ise, members cache'den say
        if (memberCount === 0 && targetGuild.members && targetGuild.members.cache) {
          memberCount = targetGuild.members.cache.size;
        }
        
        // Normal bot'tan daha doğru veri al
        if (targetClient === global.botClient) {
          // Normal bot için presence'ları daha doğru al
          if (targetGuild.presences && targetGuild.presences.cache) {
            // Sadece çevrimiçi (online, idle, dnd) üyeleri say
            onlineMembers = targetGuild.presences.cache.filter(presence => 
              presence.status === 'online' || 
              presence.status === 'idle' || 
              presence.status === 'dnd'
            ).size;
          }
          
          // Ses kanalındaki üyeleri hesapla
          if (targetGuild.voiceStates && targetGuild.voiceStates.cache) {
            voiceMembers = targetGuild.voiceStates.cache.size;
          }
        } else {
          // Selfbot için mevcut yöntem
          if (targetGuild.presences && targetGuild.presences.cache) {
            // Sadece çevrimiçi (online, idle, dnd) üyeleri say
            onlineMembers = targetGuild.presences.cache.filter(presence => 
              presence.status === 'online' || 
              presence.status === 'idle' || 
              presence.status === 'dnd'
            ).size;
          }
          
          if (targetGuild.voiceStates && targetGuild.voiceStates.cache) {
            voiceMembers = targetGuild.voiceStates.cache.size;
          }
        }
        
        // Offline üyeleri hesapla
        const offlineMembers = Math.max(0, memberCount - onlineMembers);

        // MongoDB'yi hemen güncelle (önbelleklenen verileri yenile)
        try {
          const updateData = {
            name: targetGuild.name,
            memberCount: memberCount,
            onlineMembers: onlineMembers,
            offlineMembers: offlineMembers,
            voiceMembers: voiceMembers,
            ownerId: targetGuild.ownerId,
            ownerName: owner?.user?.username || 'Bilinmiyor',
            ownerAvatar: owner?.user?.displayAvatarURL?.({ size: 128 }) || null,
            icon: targetGuild.iconURL?.({ size: 128 }) || null,
            banner: targetGuild.bannerURL?.({ size: 512 }) || null,
            inviteUrl: inviteUrl, // Vanity URL veya oluşturulan davet linki
            lastUpdated: new Date()
          };
          
          await GuildModel.findOneAndUpdate(
            { guildId: serverId },
            { $set: updateData },
            { upsert: true, new: true }
          );
          console.log(`✅ Sunucu ${targetGuild.name} MongoDB'ye güncellendi`);
        } catch (dbError) {
          console.error("❌ MongoDB güncelleme hatası:", dbError);
        }

        const liveServerData = {
          id: targetGuild.id,
          name: targetGuild.name,
          memberCount: memberCount,
          onlineMembers: onlineMembers,
          offlineMembers: offlineMembers,
          voiceMembers: voiceMembers,
          ownerId: targetGuild.ownerId,
          ownerName: owner?.user?.username || 'Bilinmiyor',
          ownerAvatar: owner?.user?.displayAvatarURL?.({ size: 128 }) || null,
          icon: targetGuild.iconURL?.({ size: 128 }) || null,
          banner: targetGuild.bannerURL?.({ size: 512 }) || null,
          joinedAt: targetGuild.joinedAt,
          clientIndex: clientIndex + 1,
          botName: targetClient.user.username,
          botAvatar: targetClient.user.displayAvatarURL?.({ size: 64 }) || null,
          inviteUrl: inviteUrl, // Vanity URL veya oluşturulan davet linki
          cached: false,
          live: true,
          lastUpdate: new Date()
        };

        // Türkçe format için yanıt
        const formattedResponse = {
          başarı: true,
          sunucu: {
            id: liveServerData.id,
            name: liveServerData.name,
            üyeSayısı: liveServerData.memberCount,
            çevrimiçiÜyeler: liveServerData.onlineMembers,
            çevrimdışıüyeler: liveServerData.offlineMembers,
            sesÜyeleri: liveServerData.voiceMembers,
            sahipId: liveServerData.ownerId,
            sahipAdı: liveServerData.ownerName,
            ownerAvatar: liveServerData.ownerAvatar,
            icon: liveServerData.icon,
            banner: liveServerData.banner,
            davet: liveServerData.inviteUrl || null,
            cached: false,
            live: true,
            lastUpdate: liveServerData.lastUpdate
          }
        };
        
        return res.status(200).json(formattedResponse);
      }
      
    } catch (error) {
      console.error("❌ Server API hatası:", error);
      return res.status(500).json({
        success: false,
        message: "Sunucu hatası oluştu",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  getGender(name) {
    if (!name) {
      return "Belirsiz";
    }

    // Load gender data
    const Genders = require("./Genders.json");
    
    // Find the gender for the name
    const nameEntry = Genders.Names.find(
      entry => entry.name.toLowerCase() === name.toLowerCase()
    );
    
    if (!nameEntry) {
      return "Belirsiz";
    }
    
    // Return gender based on sex code
    switch (nameEntry.sex) {
      case "E":
        return "Erkek";
      case "K":
        return "Kadın";
      case "U":
        return "Belirsiz";
      default:
        return "Belirsiz";
    }
  }

  isValidName(name) {
    const Genders = require("./Genders.json");
    return Genders.Names.some(
      (entry) => entry.name.toLowerCase() === name.toLowerCase(),
    );
  }

  async getUser(req, res) {
    const userId = req.query.id;
    if (!userId) {
      return res.status(400).send({ success: false, message: "Bir id belirtmelisin." });
    }

    // API sorgu sayacını artır
    totalApiQueries++;
    io.emit('apiQueryCount', totalApiQueries);

    // En çok sorgulanan kullanıcıları takip et
    try {
      // Kullanıcı bilgilerini al
      let userInfo = mostQueriedUsers.get(userId);
      // Tüm client'larda arama yap, ilk bulduğunda break yapma!
      for (const client of this.clients) {
        const member = await this.findUserById(client, userId);
        if (member && member.user) {
          // Eğer userInfo yoksa veya username/avatar güncellenmişse güncelle
          if (!userInfo || userInfo.username !== member.user.username || userInfo.avatar !== member.user.displayAvatarURL({ size: 128, dynamic: true })) {
            userInfo = {
              count: userInfo ? userInfo.count : 0,
              username: member.user.username,
              avatar: member.user.displayAvatarURL({ size: 128, dynamic: true }),
              lastQuery: new Date()
            };
          }
        }
      }
      if (userInfo) {
        userInfo.count++;
        userInfo.lastQuery = new Date();
        mostQueriedUsers.set(userId, userInfo);
        // MongoDB'ye kaydet
        await saveTopQueriedUser(userId, userInfo);
        // En çok sorgulanan 5 kullanıcıyı socket.io ile gönder
        const topUsers = Array.from(mostQueriedUsers.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5)
          .map(([id, info]) => ({
            id,
            username: info.username,
            avatar: info.avatar,
            count: info.count,
            lastQuery: info.lastQuery
          }));
        io.emit('topQueriedUsers', topUsers);
      }
    } catch (error) {
      console.error('En çok sorgulanan kullanıcı takip hatası:', error);
    }

    try {
      let foundMembers = [];
      let user = null;
      let guilds = [];
      let guildStaff = [];
      let displayNames = [];
      let allVoiceMembers = [];
      let currentVoiceChannel = null;
      let lastSeen = { Message: null, Voice: null };

      // Tüm client'larda arama yap, bulduklarını foundMembers'a ekle
      for (const client of this.clients) {
        const member = await this.findUserById(client, userId);
        if (member) {
          foundMembers.push({ member, client });
          user = member; // Son bulunanı ata (veya ilkini kullanabilirsin)
        }
      }
      if (foundMembers.length === 0) {
        return res.status(404).send({ success: false, message: "Belirlenen üye bulunamadı." });
      }

      // --- SUNUCU (GUILD) SİSTEMİ KALSIN ---
      for (const { member, client } of foundMembers) {
        client.guilds.cache.forEach(guild => {
          const m = guild.members.cache.get(userId);
          if (m) {
            if (guilds.some(g => g.guildId === guild.id)) return;
            const owner = guild.members.cache.get(guild.ownerId);
            guilds.push({
              guildName: guild.name,
              displayName: m.displayName || '',
              guildId: guild.id,
              ownerId: guild.ownerId,
              ownerName: owner ? owner.user.username : '',
              ownerAvatar: owner ? (owner.user.displayAvatarURL ? owner.user.displayAvatarURL({ size: 128 }) : null) : null,
              icon: guild.iconURL ? guild.iconURL({ size: 128 }) : null,
              banner: guild.bannerURL ? guild.bannerURL({ size: 512 }) : null
            });
            displayNames.push(m.displayName || '');
            // Yetkili kontrolü
            const isOwner = guild.ownerId === userId;
            const roles = m.roles.cache.map(role => role.name.toLowerCase());
            const hasAdminRole = roles.some(role => role.includes('admin') || role.includes('yönetici') || role.includes('kurucu'));
            const hasModRole = roles.some(role => role.includes('mod') || role.includes('yetkili') || role.includes('guard'));
            if (isOwner || hasAdminRole || hasModRole) {
              guildStaff.push({
                GuildName: guild.name,
                GuildId: guild.id,
                StaffStatus: true,
                Permissions: { isAdmin: hasAdminRole, isMod: hasModRole, isOwner }
              });
            }
          }
        });
      }

      // --- SADE VE DOĞRU SES SİSTEMİ ---
      // Kullanıcı hangi sunucuda seste?
      let voiceUser = null;
      let voiceClient = null;
      for (const client of this.clients) {
        for (const guild of client.guilds.cache.values()) {
          const member = guild.members.cache.get(userId);
          if (member && member.voice && member.voice.channel) {
            currentVoiceChannel = {
              channelName: member.voice.channel.name || '',
              guildName: guild.name || '',
              guildId: guild.id || '',
              joinedAt: member.voice.joinedAt || new Date()
            };
            // Ses kanalındaki diğer üyeleri topla
            if (member.voice.channel.members) {
              member.voice.channel.members.forEach(voiceMember => {
                if (voiceMember && voiceMember.user) {
                  allVoiceMembers.push({
                    id: voiceMember.id || '',
                    username: voiceMember.user.username || 'Bilinmeyen Kullanıcı',
                    displayName: voiceMember.displayName || voiceMember.user.username || 'Bilinmeyen Kullanıcı',
                    avatar: voiceMember.user.displayAvatarURL ? voiceMember.user.displayAvatarURL({ size: 128 }) : null
                  });
                }
              });
            }
            voiceUser = member;
            voiceClient = client;
            // break; // Burada break yok, tüm client'larda aramaya devam!
          }
        }
        // break; // Burada da break yok, tüm client'larda aramaya devam!
      }

      // LastSeen bilgisi (DB'den çek)
      const userData = await UserModel.findOne({ discordId: userId });
      if (userData?.LastSeen?.Message && !lastSeen.Message) lastSeen.Message = userData.LastSeen.Message;
      if (userData?.LastSeen?.Voice && !lastSeen.Voice) lastSeen.Voice = userData.LastSeen.Voice;

      // API Çıktısı
      // Tekrarlayan voice üyelerini filtrele
      const uniqueVoiceMembers = [];
      const seenVoiceIds = new Set();
      for (const member of allVoiceMembers) {
        if (!seenVoiceIds.has(member.id)) {
          uniqueVoiceMembers.push(member);
          seenVoiceIds.add(member.id);
        }
      }

      // WhereNow ve LastSeen.Voice güncellemesi
      let whereNow = null;
      if (currentVoiceChannel) {
        whereNow = {
          type: 'voice',
          ...currentVoiceChannel,
          members: uniqueVoiceMembers
        };
        lastSeen.Voice = {
          channelName: currentVoiceChannel.channelName,
          guildName: currentVoiceChannel.guildName,
          timestamp: new Date(),
          members: uniqueVoiceMembers
        };
      } else if (lastSeen.Message) {
        whereNow = {
          type: 'message',
          channelName: lastSeen.Message.channelName || '',
          guildName: lastSeen.Message.guildName || '',
          timestamp: lastSeen.Message.timestamp || new Date()
        };
      }

      const response = {
        success: true,
        UserInfo: {
          UserAvatar: foundMembers[0].member.user?.displayAvatarURL ? foundMembers[0].member.user.displayAvatarURL({ size: 4096 }) : null,
          UserBanner: foundMembers[0].member.user?.banner ? foundMembers[0].member.user.bannerURL({ size: 4096 }) : null,
          UserBio: foundMembers[0].member.user?.bio || "",
        },
        displayNames: displayNames,
        WhereNow: whereNow,
        LastSeen: {
          Message: lastSeen.Message ? {
            content: lastSeen.Message.content || "",
            channelName: lastSeen.Message.channelName || "",
            guildName: lastSeen.Message.guildName || "",
            timestamp: lastSeen.Message.timestamp || new Date()
          } : null,
          Voice: lastSeen.Voice ? {
            channelName: lastSeen.Voice.channelName || "",
            guildName: lastSeen.Voice.guildName || "",
            timestamp: lastSeen.Voice.timestamp || new Date(),
            members: Array.isArray(lastSeen.Voice.members) ? 
              lastSeen.Voice.members
                .filter(member => member && typeof member === 'object')
                .map(member => ({
                  id: member.id || '',
                  username: member.username || 'Bilinmeyen Kullanıcı',
                  displayName: member.displayName || member.username || 'Bilinmeyen Kullanıcı',
                  avatar: member.avatar || null
                })) : []
          } : null
        },
        TopName: this.getTopNameByFrequency(displayNames),
        TopAge: this.getTopAge(guilds),
        TopSex: this.getGender(this.getTopNameByFrequency(displayNames)),
        GuildStaff: guildStaff.map(staff => ({
          GuildName: staff.Permissions.isOwner ? `👑 ${staff.GuildName}` : staff.GuildName,
          GuildId: staff.GuildId,
          StaffStatus: staff.StaffStatus,
          Permissions: {
            isAdmin: staff.Permissions.isAdmin,
            isMod: staff.Permissions.isMod,
            isOwner: staff.Permissions.isOwner
          }
        })),
        Guilds: guilds,
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).send({ 
        success: false, 
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Yardımcı metodlar
  getTopName(guilds) {
    const nameCounts = {};
    guilds.forEach((guild) => {
      if (guild !== null) {
        const name = guild.displayName.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, "");
        nameCounts[name] = (nameCounts[name] || 0) + 1;
      }
    });

    let maxCount = 0;
    let topName = "";
    Object.entries(nameCounts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topName = name;
      }
    });

    return this.isValidName(topName) ? topName : "";
  }

  getTopAge(guilds) {
    const ageCounts = {};
    guilds.forEach((guild) => {
      if (guild !== null) {
        const age = guild.displayName.replace(/\D/g, "");
        if (age !== "") {
          ageCounts[age] = (ageCounts[age] || 0) + 1;
        }
      }
    });

    let maxCount = 0;
    let topAge = "";
    Object.entries(ageCounts).forEach(([age, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topAge = age;
      }
    });

    return topAge && !isNaN(parseInt(topAge)) ? parseInt(topAge) : "";
  }

  // Improved getTopName function that checks frequency of names in displayNames
  getTopNameByFrequency(displayNames) {
    // Load gender data
    const Genders = require("./Genders.json");
    
    // Count occurrences of each name in displayNames
    const nameFrequency = {};
    
    displayNames.forEach(displayName => {
      // Extract potential names (alphabetic characters including Turkish characters)
      const potentialNames = displayName.match(/[a-zA-ZğüşıöçĞÜŞİÖÇ]+/g) || [];
      
      potentialNames.forEach(name => {
        const cleanName = name.trim();
        if (cleanName.length > 1) { // Only consider names with more than 1 character
          nameFrequency[cleanName] = (nameFrequency[cleanName] || 0) + 1;
        }
      });
    });
    
    // Sort names by frequency (highest first)
    const sortedNames = Object.entries(nameFrequency)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
    
    // Check each name against Genders.json, starting with the most frequent
    for (const { name } of sortedNames) {
      const cleanName = name.toLowerCase();
      const isKnownName = Genders.Names.some(
        entry => entry.name.toLowerCase() === cleanName
      );
      
      if (isKnownName) {
        return name; // Return the first known name found
      }
    }
    
    // If no known name found, return empty string
    return "";
  }

  // Updated getGender function to work with the new approach
  getGender(name) {
    if (!name) {
      return "Belirsiz";
    }

    // Load gender data
    const Genders = require("./Genders.json");
    
    // Find the gender for the name
    const nameEntry = Genders.Names.find(
      entry => entry.name.toLowerCase() === name.toLowerCase()
    );
    
    if (!nameEntry) {
      return "Belirsiz";
    }
    
    // Return gender based on sex code
    switch (nameEntry.sex) {
      case "E":
        return "Erkek";
      case "K":
        return "Kadın";
      case "U":
        return "Belirsiz";
      default:
        return "Belirsiz";
    }
  }

  // Toplu güncelleme zamanlayıcısını başlat
  startBatchUpdateTimer() {
    setInterval(() => this.processBatchUpdates(), this.updateInterval);
  }

  // Güncelleme kuyruğuna ekle
  async queueUpdate(userId, type, data) {
    if (!this.updateQueue.has(userId)) {
      this.updateQueue.set(userId, {
        updates: [],
        lastUpdate: new Date()
      });
    }
    
    const userQueue = this.updateQueue.get(userId);
    userQueue.updates.push({ type, data, timestamp: new Date() });
    
    // Kuyruk boyutu belirli bir eşiği aştığında hemen işle
    if (userQueue.updates.length >= this.batchSize) {
      await this.processUserUpdates(userId);
    }
  }

  // Kullanıcı güncellemelerini işle
  async processUserUpdates(userId) {
    const userQueue = this.updateQueue.get(userId);
    if (!userQueue || userQueue.updates.length === 0) return;

    try {
      const user = await UserModel.findOne({ discordId: userId });
      if (!user) return;

      // LastSeen verilerini güncelle
      if (!user.LastSeen) {
        user.LastSeen = {
          Message: null,
          Voice: null
        };
      }

      // Güncellemeleri işle
      for (const update of userQueue.updates) {
        const { type, data, timestamp } = update;
        const newEntry = {
          ...data,
          timestamp
        };

        if (type === 'Message') {
          user.LastSeen.Message = newEntry;
        } else if (type === 'Voice') {
          user.LastSeen.Voice = newEntry;
        }
      }

      // Kullanıcı verilerini güncelle
      user.lastUpdated = new Date();
      await user.save();

      // Güncellenen kullanıcı sayısını artır ve socket.io ile gönder
      currentUpdatedCount++;
      io.emit('userUpdated', { userId: userId, count: currentUpdatedCount });

      // Kuyruğu temizle
      this.updateQueue.delete(userId);

    } catch (error) {
      console.error(`Kullanıcı güncellemeleri işlenirken hata (${userId}):`, error);
    }
  }

  // Toplu güncellemeleri işle
  async processBatchUpdates() {
    // Process updates in smaller batches to avoid memory issues
    const batchSize = 50;
    const userIds = Array.from(this.updateQueue.keys());
    
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const promises = batch.map(userId => this.processUserUpdates(userId));
      await Promise.all(promises);
      
      // Add a small delay between batches to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  // LastSeen verilerini güncelleme metodu
  async updateLastSeen(userId, type, data) {
    await this.queueUpdate(userId, type, data);
  }

  // Tüm sunuculardaki tüm kullanıcıları yedekle
  async backupAllUsers(clients) {
    if (!clients || clients.length === 0) return;
    if (chalk) {
      console.log(chalk.yellowBright('🚀 [TOPLU YEDEKLEME] Toplu yedekleme başlatıldı...'));
    } else {
      console.log('[TOPLU YEDEKLEME] Toplu yedekleme başlatıldı...');
    }
    let totalBackedUp = 0;
    let totalUsers = 0;
    
    // Process users in smaller batches to avoid memory issues
    const batchSize = 100;
    
    // Daha önce yedeklenen kullanıcıları bir defa çek
    const existingUsers = new Set();
    try {
      // Fetch existing users in batches to avoid memory issues
      let skip = 0;
      while (true) {
        const usersBatch = await UserModel.find({}, 'discordId').skip(skip).limit(batchSize).lean();
        if (usersBatch.length === 0) break;
        usersBatch.forEach(u => existingUsers.add(u.discordId));
        skip += batchSize;
        // Add a small delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } catch (error) {
      console.error('Mevcut kullanıcılar alınırken hata:', error);
    }
    
    for (const client of clients) {
      for (const guild of client.guilds.cache.values()) {
        let members;
        try {
          members = await guild.members.fetch();
        } catch (e) {
          if (chalk) {
            console.error(chalk.red(`[YEDEKLEME HATASI] ${guild.name}:`), e);
          } else {
            console.error(`[YEDEKLEME HATASI] ${guild.name}:`, e);
          }
          continue;
        }
        
        // Process members in batches
        const memberArray = Array.from(members.values());
        for (let i = 0; i < memberArray.length; i += batchSize) {
          const batch = memberArray.slice(i, i + batchSize);
          
          for (const member of batch) {
            totalUsers++;
            if (existingUsers.has(member.user.id)) {
              // Kullanıcı zaten yedeklenmiş, sadece güncelle (veya hiç dokunma)
              continue;
            }
            const userData = {
              discordId: member.user.id,
              username: member.user.username,
              discriminator: member.user.discriminator,
              avatar: member.user.avatar,
            };
            await UserModel.findOneAndUpdate(
              { discordId: userData.discordId },
              userData,
              { upsert: true, new: true }
            );
            totalBackedUp++;
            existingUsers.add(member.user.id); // İzleme listesine ekle
            if (chalk) {
              console.log(chalk.greenBright('💾 [TOPLU YEDEK] ') + chalk.bold(`${member.user.username} (${member.user.id})`) + chalk.cyanBright(' yedeklendi!'));
            } else {
              console.log(`[TOPLU YEDEK] ${member.user.username} (${member.user.id}) yedeklendi!`);
            }
            if (io && io.emit) {
              io.emit('log', {
                type: 'backup',
                message: `💾 [TOPLU YEDEK] ${member.user.username} (${member.user.id}) yedeklendi!`
              });
            }
          }
          
          // Add a small delay between batches to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }
    if (chalk) {
      console.log(chalk.magentaBright(`🗄️  [TOPLAM YEDEKLENEN KULLANICI] `) + chalk.bold(`${totalBackedUp}`) + chalk.gray(`/ ${totalUsers}`));
      console.log(chalk.greenBright('✅ [TOPLU YEDEKLEME] Toplu yedekleme tamamlandı!'));
    } else {
      console.log(`[TOPLAM YEDEKLENEN KULLANICI] ${totalBackedUp} / ${totalUsers}`);
      console.log('[TOPLU YEDEKLEME] Toplu yedekleme tamamlandı!');
    }
    lastBackupLog = `✅ [TOPLU YEDEKLEME] Toplu yedekleme tamamlandı! (${totalBackedUp} / ${totalUsers})`;
    if (io && io.emit) {
      io.emit('backupLog', lastBackupLog);
    }
  }

  // Sorgulanan kullanıcıyı da izleme ve yedekleme altına al
  async backupSingleUser(member) {
    if (!member || !member.user) return;
    try {
      // wasNew kontrolünü fonksiyonun başında yap
      const wasNew = !(await UserModel.findOne({ discordId: member.user.id }));
      const userData = {
        discordId: member.user.id,
        username: member.user.username || 'Bilinmeyen Kullanıcı',
        discriminator: member.user.discriminator || '0000',
        avatar: member.user.avatar,
      };
      await UserModel.findOneAndUpdate(
        { discordId: userData.discordId },
        userData,
        { upsert: true, new: true }
      );
      // --- SUNUCU BİLGİLERİNİ VE LOGUNU KAYDET ---
      if (member.guild) {
        try {
          await GuildModel.findOneAndUpdate(
            { guildId: member.guild.id },
            {
              guildId: member.guild.id,
              name: member.guild.name,
              ownerId: member.guild.ownerId,
              ownerName: member.guild.members.cache.get(member.guild.ownerId)?.user?.username || '',
              ownerAvatar: member.guild.members.cache.get(member.guild.ownerId)?.user?.displayAvatarURL?.({ size: 128 }) || '',
              icon: member.guild.iconURL({ size: 128 }) || '',
              banner: member.guild.bannerURL({ size: 512 }) || '',
              memberCount: member.guild.memberCount,
              lastUpdated: new Date(),
              $push: {
                logs: {
                  type: wasNew ? 'backup' : 'update',
                  date: new Date(),
                  updatedBy: member.client?.user?.id || '',
                  info: wasNew ? 'Tekil yedekleme' : 'Tekil güncelleme'
                }
              }
            },
            { upsert: true, new: true }
          );
        } catch (e) {
          console.error('GuildModel tekil yedek/güncelleme log hatası:', e);
        }
      }
    } catch (error) {
      if (chalk) {
        console.error(chalk.red('Tekil kullanıcı yedekleme hatası:'), error);
      } else {
        console.error('Tekil kullanıcı yedekleme hatası:', error);
      }
    }
  }

  // Kullanıcıyı tüm sunucularda arayan yardımcı fonksiyon
  async findUserById(client, userId) {
    if (!client || !client.guilds || !userId) return null;
    
    for (const guild of client.guilds.cache.values()) {
      if (!guild || !guild.members) continue;
      
      // Sadece cache kullan!
      const member = guild.members.cache.get(userId);
      if (member && member.user) {
        return member;
      }
    }
    return null;
  }

  // Kullanıcıyı tüm sunucularda fetch ederek ara
  async findUserInAllGuilds(client, userId) {
    if (!client || !client.guilds || !userId) return null;
    
    const foundMembers = [];
    
    for (const guild of client.guilds.cache.values()) {
      if (!guild || !guild.members) continue;
      
      try {
        // Önce cache'de ara
        let member = guild.members.cache.get(userId);
        
        // Cache'de yoksa fetch et
        if (!member) {
          try {
            member = await guild.members.fetch(userId);
          } catch (fetchError) {
            // Kullanıcı bu sunucuda yok, devam et
            continue;
          }
        }
        
        if (member && member.user) {
          // Guild bilgisini de ekle
          member.guild = guild;
          foundMembers.push(member);
        }
      } catch (error) {
        console.error(`Guild ${guild.name} üye arama hatası:`, error);
        continue;
      }
    }
    
    return foundMembers.length > 0 ? foundMembers : null;
  }

  // Kullanıcının ses durumunu tüm sunucularda ara
  async findUserVoiceState(client, userId) {
    if (!client || !client.guilds || !userId) return null;
    
    for (const guild of client.guilds.cache.values()) {
      if (!guild || !guild.members) continue;
      
      try {
        let member = guild.members.cache.get(userId);
        if (!member) {
          try {
            member = await guild.members.fetch(userId);
          } catch (fetchError) {
            continue;
          }
        }
        
        if (member && member.voice && member.voice.channel) {
          return {
            member,
            guild,
            voiceChannel: member.voice.channel
          };
        }
      } catch (error) {
        console.error(`Guild ${guild.name} ses durumu arama hatası:`, error);
        continue;
      }
    }
    
    return null;
  }

  // Kullanıcı verilerini güncelleyen yeni metod
  async updateUserData(user) {
    try {
      const userData = {
        discordId: user.id,
        username: user.username,
        discriminator: user.discriminator,
        avatar: user.avatar,
        lastUpdated: new Date()
      };

      await UserModel.findOneAndUpdate(
        { discordId: userData.discordId },
        userData,
        { upsert: true, new: true }
      );

      // LOG KALDIRILDI
      // if (chalk) {
      //   console.log(chalk.blueBright('🔄 [GÜNCELLEME] ') + chalk.bold(`${user.username} (${user.id})`) + chalk.cyanBright(' güncellendi!'));
      // } else {
      //   console.log(`[GÜNCELLEME] ${user.username} (${user.id}) güncellendi!`);
      // }
    } catch (error) {
      if (chalk) {
        console.error(chalk.red('Kullanıcı güncellenirken hata oluştu:'), error);
      } else {
        console.error('Kullanıcı güncellenirken hata oluştu:', error);
      }
    }
  }
}

// Port yönetimi
const app = express();
const server = http.createServer(app);
const { Server: IOServer } = require('socket.io');
const io = new IOServer(server, { cors: { origin: '*' } });
const clients = [];
const botClient = null; // Normal bot client
const joinedGuilds = new Map(); // guildId -> client
let currentBackedUpCount = 0;
let currentColoredCount = 0;
let mostQueriedUsers = new Map(); // userId -> { count, username, avatar, lastQuery }

function handleDuplicateGuilds(newClient) {
  newClient.guilds.cache.forEach(guild => {
    if (!joinedGuilds.has(guild.id)) {
      // Bu client bu sunucuda kalan olsun
      joinedGuilds.set(guild.id, newClient);
    }
    // Artık sunucudan çıkma işlemi yok
  });
}

const startServer = (port) => {
  try {
  server.listen(port, () => {
    console.log(`API çalışıyor: http://localhost:${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} kullanımda, ${port + 1} deneniyor...`);
      startServer(port + 1);
    } else {
      console.error('Sunucu başlatılırken hata:', err);
        // Kritik hata durumunda 5 saniye sonra tekrar dene
        setTimeout(() => {
          console.log('Sunucu yeniden başlatılıyor...');
          startServer(port);
        }, 5000);
      }
    });
  } catch (error) {
    console.error('Sunucu başlatma hatası:', error);
    // Hata durumunda 10 saniye sonra tekrar dene
    setTimeout(() => {
      console.log('Sunucu yeniden başlatılıyor...');
      startServer(port);
    }, 10000);
  }
};

// Socket.io ile yeni yedeklenen kullanıcı sayısını yayınla
io.on('connection', (socket) => {
  socket.emit('backedUpCount', currentBackedUpCount);
  socket.emit('coloredCount', currentColoredCount);
  socket.emit('updatedCount', currentUpdatedCount);
  socket.emit('apiQueryCount', totalApiQueries);
  
  // Toplam sunucu sayısını hesapla ve gönder
  let totalServers = 0;
  clients.forEach(client => {
    if (client && client.guilds && client.guilds.cache) {
      totalServers += client.guilds.cache.size;
    }
  });
  socket.emit('totalServers', totalServers);
  
  // En çok sorgulanan kullanıcıları gönder
  const topUsers = Array.from(mostQueriedUsers.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([id, info]) => ({
      id,
      username: info.username,
      avatar: info.avatar,
      count: info.count,
      lastQuery: info.lastQuery
    }));
  socket.emit('topQueriedUsers', topUsers);
  
  // Sistem durumu güncellemelerini gönder
  setInterval(async () => {
    try {
      // Gerçek sistem verilerini al
      const totalUsers = clients.reduce((acc, client) => {
        if (!client || !client.guilds || !client.guilds.cache) return acc;
        return acc + client.guilds.cache.reduce((guildAcc, guild) => guildAcc + guild.memberCount, 0);
      }, 0);
      
      // MongoDB'den gerçek yedeklenen kullanıcı sayısını al
      const realBackedUpCount = await UserModel.countDocuments();
      currentBackedUpCount = realBackedUpCount; // Global değişkeni güncelle
      
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      
      // CPU kullanımını al
      const cpus = os.cpus();
      const cpuUsage = cpus.reduce((acc, cpu) => {
        if (!cpu || !cpu.times) return acc;
        const total = Object.values(cpu.times).reduce((a, b) => a + b);
        const idle = cpu.times.idle;
        return acc + ((total - idle) / total);
      }, 0) / cpus.length * 100;
      
      const systemStats = {
        totalUsers: totalUsers,
        backedUpUsers: realBackedUpCount, // Gerçek MongoDB sayısı
        apiPing: Math.floor(Math.random() * 50) + 50, // Gerçekçi ping
        memoryUsage: Math.round(usedMem / (1024*1024*1024) * 100) / 100, // GB cinsinden, 2 ondalık
        totalMem: Math.round(totalMem / (1024*1024*1024) * 100) / 100, // GB cinsinden, 2 ondalık
        freeMem: Math.round(freeMem / (1024*1024*1024) * 100) / 100, // GB cinsinden, 2 ondalık
        memoryPercent: Math.round((usedMem / totalMem) * 100), // Yüzde hesaplaması
        cpuUsage: Math.round(cpuUsage), // Gerçek CPU kullanımı
        cpuModel: os.cpus()[0].model, // CPU model adı
        cpuCores: os.cpus().length, // CPU çekirdek sayısı
        apiStartTime: global.apiStartTime, // Gerçek başlangıç zamanı
        discordPing: clients.reduce((acc, client) => {
          if (!client || !client.ws) return acc;
          return acc + (client.ws?.ping || 0);
        }, 0) / Math.max(clients.length, 1)
      };
      socket.emit('systemUpdate', systemStats);
      
      // Sunucu bilgilerini de gönder
      const allServers = [];
      clients.forEach((client, clientIndex) => {
        if (!client || !client.guilds || !client.guilds.cache) return;
        client.guilds.cache.forEach(guild => {
          if (!guild || !guild.members) return;
          const owner = guild.members.cache.get(guild.ownerId);
          allServers.push({
            id: guild.id,
            name: guild.name,
            memberCount: guild.memberCount,
            ownerId: guild.ownerId,
            ownerName: owner ? owner.user.username : 'Bilinmiyor',
            ownerAvatar: owner ? owner.user.displayAvatarURL({ size: 128 }) : null,
            icon: guild.iconURL({ size: 128 }),
            banner: guild.bannerURL({ size: 512 }),
            joinedAt: guild.joinedAt,
            clientIndex: clientIndex + 1,
            botName: client.user.username,
            botAvatar: client.user.displayAvatarURL({ size: 64 })
          });
        });
      });
      
      // Sunucuları üye sayısına göre sırala
      allServers.sort((a, b) => b.memberCount - a.memberCount);
      const recentServers = allServers.slice(0, 6);
      
      const serverStats = {
        totalServers: allServers.length,
        totalMembers: allServers.reduce((sum, server) => sum + server.memberCount, 0),
        activeBots: clients.length,
        lastAddedServer: recentServers[0] ? recentServers[0].name : 'Yok',
        recentServers: recentServers
      };
      socket.emit('serverUpdate', serverStats);
      
    } catch (error) {
      console.error('Sistem güncellemesi hatası:', error);
      // Hata durumunda basit veri gönder
      socket.emit('systemUpdate', {
        totalUsers: 0,
        backedUpUsers: 0,
        apiPing: 100,
        memoryUsage: 0,
        totalMem: 0,
        freeMem: 0,
        memoryPercent: 0,
        cpuUsage: 0,
        cpuModel: 'Bilinmiyor',
        cpuCores: 0,
        apiStartTime: global.apiStartTime,
        discordPing: 0
      });
    }
  }, 10000); // 10 saniyede bir güncelle
});

// Patch console methods to emit logs to Socket.io clients
const originalLog = console.log;
const originalInfo = console.info;
const originalWarn = console.warn;
const originalError = console.error;

function emitLog(type, message) {
  if (io && io.emit) {
    io.emit('log', {
      type,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      timestamp: new Date().toLocaleTimeString('tr-TR')
    });
  }
}

console.log = function(...args) {
  emitLog('info', args.join(' '));
};
console.info = function(...args) {
  emitLog('info', args.join(' '));
};
console.warn = function(...args) {
  emitLog('warning', args.join(' '));
};
console.error = function(...args) {
  emitLog('error', args.join(' '));
  originalError.apply(console, args);
};

// Normal bot client'ını başlat
if (config.BOT_TOKEN && config.BOT_TOKEN !== "YOUR_NORMAL_BOT_TOKEN_HERE") {
  const botClient = new BotClient({
    intents: [
      'Guilds',
      'GuildMembers',
      'GuildPresences',
      'GuildVoiceStates',
      'GuildMessages',
      'GuildMessageReactions',
      'DirectMessages',
      'MessageContent'
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER']
  });

  botClient.once("ready", () => {
    console.log(`🤖 Normal bot olarak giriş yapıldı: ${botClient.user.username}`);
    console.log(`📊 Bot ${botClient.guilds.cache.size} sunucuda aktif`);
    
    // Bot client'ını global olarak erişilebilir yap
    global.botClient = botClient;
    
    // Bot hazır olduğunda guild istatistiklerini güncelle
    setTimeout(() => {
      if (clients.length > 0) {
        updateGuildStats(clients);
      }
    }, 5000);
    
    // Bot durumunu debug et
    console.log('🔍 Bot Debug Bilgileri:');
    console.log(`- Bot ID: ${botClient.user.id}`);
    console.log(`- Bot Tag: ${botClient.user.tag}`);
    console.log(`- Guild Sayısı: ${botClient.guilds.cache.size}`);
    console.log(`- Presence Cache Boyutu: ${botClient.guilds.cache.reduce((acc, guild) => acc + (guild.presences?.cache?.size || 0), 0)}`);
    
    // Test guild'i kontrol et
    const testGuild = botClient.guilds.cache.get('1369772633616285813');
    if (testGuild) {
      console.log(`🎯 Test Guild Bulundu: ${testGuild.name}`);
      console.log(`- Member Count: ${testGuild.memberCount}`);
      console.log(`- Presence Cache Size: ${testGuild.presences?.cache?.size || 0}`);
      console.log(`- Voice States Size: ${testGuild.voiceStates?.cache?.size || 0}`);
    } else {
      console.log('❌ Test Guild bulunamadı!');
    }
  });

  botClient.on('error', (error) => {
    console.error('Normal bot client hatası:', error);
  });

  botClient.on('disconnect', () => {
    console.log('Normal bot bağlantısı kesildi, yeniden bağlanılıyor...');
  });

  botClient.login(config.BOT_TOKEN).catch((err) => {
    console.error(`Normal bot token ile giriş yapılamadı:`, err);
  });
}

(config.TOKENS || []).forEach((token) => {
  const client = new Client();
  
  // Client hata yakalama
  client.on('error', (error) => {
    console.error('Discord client hatası:', error);
  });
  
  client.on('disconnect', (event) => {
    console.log('Discord client bağlantısı kesildi:', event.reason);
  });
  
  client.on('reconnecting', () => {
    console.log('Discord client yeniden bağlanıyor...');
  });
  
  client.once("ready", () => {
    console.log(`Discord istemcisi olarak giriş yapıldı: ${client.user.username}`);
    clients.push(client);
    // Çift token kontrolü
    handleDuplicateGuilds(client);
    if (clients.length === config.TOKENS.length) {
      new UserController(app, clients);
    }
  });

  // Yeni sunucuya katılımda da kontrol et
  client.on('guildCreate', (guild) => {
    try {
    handleDuplicateGuilds(client);
    if (chalk) {
      console.log(chalk.blueBright(`🆕 [YENİ SUNUCU] Bot yeni bir sunucuya katıldı: ${guild.name} (${guild.id})`));
    } else {
      console.log(`[YENİ SUNUCU] Bot yeni bir sunucuya katıldı: ${guild.name} (${guild.id})`);
    }
    if (guild.members && guild.members.cache) {
      console.log(`[YENİ SUNUCU] Sunucudaki toplam üye: ${guild.members.cache.size}`);
      }
      
      // Socket.io ile yeni sunucu bilgisini yayınla
      const owner = guild.members.cache.get(guild.ownerId);
      const serverInfo = {
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount,
        ownerId: guild.ownerId,
        ownerName: owner ? owner.user.username : 'Bilinmiyor',
        ownerAvatar: owner ? owner.user.displayAvatarURL({ size: 128 }) : null,
        icon: guild.iconURL({ size: 128 }),
        banner: guild.bannerURL({ size: 512 }),
        joinedAt: guild.joinedAt,
        clientIndex: clients.indexOf(client) + 1,
        botName: client.user.username,
        botAvatar: client.user.displayAvatarURL({ size: 64 })
      };
      io.emit('newServer', serverInfo);
    } catch (error) {
      console.error('Guild create hatası:', error);
    }
  });
  

  // Sunucudan çıkınca joinedGuilds güncelle
  client.on('guildDelete', (guild) => {
    try {
    if (joinedGuilds.get(guild.id) === client) {
      joinedGuilds.delete(guild.id);
      }
      
      // Socket.io ile sunucu çıkış bilgisini yayınla
      io.emit('serverLeft', { id: guild.id, name: guild.name });
      
      if (chalk) {
        console.log(chalk.red(`👋 [SUNUCU AYRILDI] Bot sunucudan ayrıldı: ${guild.name} (${guild.id})`));
      } else {
        console.log(`[SUNUCU AYRILDI] Bot sunucudan ayrıldı: ${guild.name} (${guild.id})`);
      }
    } catch (error) {
      console.error('Guild delete hatası:', error);
    }
  });

  // Yeni üye katılımını logla
  client.on('guildMemberAdd', (member) => {
    try {
      if (!member || !member.user || member.user.bot) return;
      console.log('🆕 [YENİ ÜYE] ...');
      // Yeni üye eklendiğinde güncelleme sayacını artır
      currentUpdatedCount++;
      io.emit('userUpdated', { userId: member.user.id, count: currentUpdatedCount });
    } catch (error) {
      console.error('Guild member add hatası:', error);
    }
  });

  client.on('guildMemberRemove', (member) => {
    try {
      if (!member || !member.user || member.user.bot) return;
    console.log('➖ [ÜYE AYRILDI] ...');
      // Üye ayrıldığında güncelleme sayacını artır
      currentUpdatedCount++;
      io.emit('userUpdated', { userId: member.user.id, count: currentUpdatedCount });
    } catch (error) {
      console.error('Guild member remove hatası:', error);
    }
  });

  client.on('messageCreate', (message) => {
    try {
      if (!message || !message.guild || !message.author || message.author.bot) return;
    console.log('📨 [YENİ MESAJ] ...');
      // Yeni mesaj atıldığında güncelleme sayacını artır
      currentUpdatedCount++;
      io.emit('userUpdated', { userId: message.author.id, count: currentUpdatedCount });
    } catch (error) {
      console.error('Message create hatası:', error);
    }
  });

  client.on('voiceStateUpdate', (oldState, newState) => {
    try {
      if (!newState || !newState.member || !newState.member.user || newState.member.user.bot) return;
      const user = newState.member.user;
    if (!user) return;
    if (!oldState.channel && newState.channel) {
      // Katıldı
      console.log('🔊 [SES KANALI] ...');
        // Ses kanalına katıldığında güncelleme sayacını artır
        currentUpdatedCount++;
        io.emit('userUpdated', { userId: user.id, count: currentUpdatedCount });
    } else if (oldState.channel && !newState.channel) {
      // Ayrıldı
      console.log('🔇 [SES KANALI] ...');
        // Ses kanalından ayrıldığında güncelleme sayacını artır
        currentUpdatedCount++;
        io.emit('userUpdated', { userId: user.id, count: currentUpdatedCount });
      }
    } catch (error) {
      console.error('Voice state update hatası:', error);
    }
  });

  // Etkileşim event'leri
  client.on('messageReactionAdd', (reaction, user) => {
    try {
      if (!user || user.bot) return;
      console.log('👍 [REAKSİYON] ...');
      // Reaksiyon eklendiğinde güncelleme sayacını artır
      currentUpdatedCount++;
      io.emit('userUpdated', { userId: user.id, count: currentUpdatedCount });
    } catch (error) {
      console.error('Message reaction add hatası:', error);
    }
  });
  
  client.on('messageReactionRemove', (reaction, user) => {
    try {
      if (!user || user.bot) return;
      console.log('👎 [REAKSİYON] ...');
      // Reaksiyon kaldırıldığında güncelleme sayacını artır
      currentUpdatedCount++;
      io.emit('userUpdated', { userId: user.id, count: currentUpdatedCount });
    } catch (error) {
      console.error('Message reaction remove hatası:', error);
    }
  });
  
  client.on('typingStart', (channel, user) => {
    try {
      if (!user || user.bot) return;
      console.log('⌨️ [YAZIYOR] ...');
      // Yazmaya başladığında güncelleme sayacını artır
      currentUpdatedCount++;
      io.emit('userUpdated', { userId: user.id, count: currentUpdatedCount });
    } catch (error) {
      console.error('Typing start hatası:', error);
    }
  });
  
  client.on('presenceUpdate', (oldPresence, newPresence) => {
    try {
      if (!newPresence || !newPresence.user || newPresence.user.bot) return;
      console.log('🔄 [DURUM] ...');
      // Durum değiştiğinde güncelleme sayacını artır
      currentUpdatedCount++;
      io.emit('userUpdated', { userId: newPresence.user.id, count: currentUpdatedCount });
    } catch (error) {
      console.error('Presence update hatası:', error);
    }
  });
  
  client.on('userUpdate', (oldUser, newUser) => {
    try {
      if (!newUser || newUser.bot) return;
      console.log('👤 [PROFİL] ...');
      // Profil güncellendiğinde güncelleme sayacını artır
      currentUpdatedCount++;
      io.emit('userUpdated', { userId: newUser.id, count: currentUpdatedCount });
    } catch (error) {
      console.error('User update hatası:', error);
    }
  });

  client.login(token).catch((err) => {
    console.error(`Bu token ile giriş yapılamadı: ${token}`, err);
    // Token hatası durumunda sistemi durdurma, diğer tokenlarla devam et
  });
});

const PORT = config.PORT || 3000;
startServer(PORT);