const fs = require('fs');
const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf8'));
global.settings = settings;

require('./lib/time');
require('./lib/arrays');

const logger = global.logger = require('./lib/logger');
const Database = require('./data/connection');
const { BotClient } = require('./bot/client');
const GuildData = require('./data/schemas/guild');
const Statistics = require('./data/schemas/statistics');

const bot = global.bot = new BotClient({
    dirname: "DcOyver",
    botname: "DcOyver",
    prefix: settings.PREFIX
});

// guildCreate ve guildDelete event'leri artık events klasöründeki dosyalardan yükleniyor

bot.on('ready', async () => {
    logger.log(`${bot.user.tag} aktif!`, "success");
    
    // Bot durumunu ayarla
    const { ActivityType } = require('discord.js');
    bot.user.setPresence({
        status: settings.BOT_STATUS.STATUS,
        activities: [{
            type: ActivityType.Custom,
            name: 'Custom Status',
            state: settings.BOT_STATUS.ACTIVITY_TEXT
        }]
    });
    
    await syncGuilds();
    
    // İlk açılışta hemen istatistikleri güncelle
    logger.log('Sunucu istatistikleri güncelleniyor...', 'info');
    await updateAllGuildStats();
    
    // Tüm oy verme panellerini yeni tasarımla güncelle
    logger.log('Oy verme panelleri yeni tasarımla güncelleniyor...', 'info');
    await updateAllVotePanels();
    
    // mesaj.json'daki tüm panelleri güncelle
    logger.log('mesaj.json dosyasındaki paneller güncelleniyor...', 'info');
    await updatePanelsFromMesajJson();
    
    // Load intervals
    loadIntervals();
    
    // İlk açılışta hemen kullanıcı yedeklemeyi başlat - TÜM KULLANICILARI DETAYLI ÇEK
    logger.log('🚀 Bot başladı! Tüm sunuculardaki kullanıcılar detaylı şekilde çekiliyor...', 'info');
    const syncUsersInterval = require('./bot/intervals/syncUsers');
    if (syncUsersInterval && syncUsersInterval.execute) {
        // İlk çalıştırmada toplu yedekleme yap (10 saniye bekle, bot tam hazır olsun)
        setTimeout(async () => {
            logger.log('🚀 [TOPLU YEDEKLEME] İlk başlatmada toplu yedekleme başlatılıyor...', 'info');
            if (syncUsersInterval.backupAllUsers) {
                try {
                    const result = await syncUsersInterval.backupAllUsers(bot);
                    logger.log(`✅ [TOPLU YEDEKLEME] Tamamlandı: ${result.totalBackedUp} yeni kullanıcı yedeklendi, toplam ${result.totalUsers} kullanıcı`, 'success');
                } catch (err) {
                    logger.log(`❌ Toplu yedekleme hatası: ${err.message}`, 'error');
                }
            }
            
            // Toplu yedekleme sonrası normal senkronizasyonu başlat
            logger.log('📊 İlk kullanıcı senkronizasyonu başlatılıyor...', 'info');
            syncUsersInterval.execute(bot).catch(err => {
                logger.log(`❌ İlk kullanıcı yedekleme hatası: ${err.message}`, 'error');
            });
        }, 10000); // 10 saniye bekle
        
        // Her 30 dakikada bir tam senkronizasyon yap
        setInterval(() => {
            logger.log('🔄 Periyodik tam kullanıcı senkronizasyonu başlatılıyor (30 dakika)...', 'info');
            syncUsersInterval.execute(bot).catch(err => {
                logger.log(`❌ Periyodik kullanıcı yedekleme hatası: ${err.message}`, 'error');
            });
        }, 30 * 60 * 1000); // 30 dakika
        
        // Her gün düzenli olarak toplu yedekleme yap (24 saat = 86400000 ms)
        setInterval(async () => {
            logger.log('🔄 [GÜNLÜK TOPLU YEDEKLEME] Günlük toplu yedekleme başlatılıyor...', 'info');
            if (syncUsersInterval.backupAllUsers) {
                try {
                    const result = await syncUsersInterval.backupAllUsers(bot);
                    logger.log(`✅ [GÜNLÜK TOPLU YEDEKLEME] Tamamlandı: ${result.totalBackedUp} yeni kullanıcı yedeklendi, toplam ${result.totalUsers} kullanıcı`, 'success');
                } catch (err) {
                    logger.log(`❌ Günlük toplu yedekleme hatası: ${err.message}`, 'error');
                }
            }
        }, 24 * 60 * 60 * 1000); // 24 saat
        
        // Statistics'i anlık güncellemek için interval (her 5 dakikada bir)
        setInterval(async () => {
            try {
                const guilds = bot.guilds.cache;
                const userSet = new Set();
                
                for (const guild of guilds.values()) {
                    try {
                        const members = guild.members.cache;
                        members.forEach(member => {
                            if (member.user && !member.user.bot) {
                                userSet.add(member.user.id);
                            }
                        });
                    } catch (e) {
                        continue;
                    }
                }
                
                await Statistics.findOneAndUpdate(
                    { key: 'totalSystemUsers' },
                    { 
                        value: userSet.size,
                        updatedAt: new Date()
                    },
                    { upsert: true, new: true }
                );
                
                logger.log(`📊 [ANLIK GÜNCELLEME] Toplam sistem kullanıcı sayısı güncellendi: ${userSet.size}`, 'info');
            } catch (error) {
                logger.log(`⚠️ Statistics anlık güncelleme hatası: ${error.message}`, 'warn');
            }
        }, 5 * 60 * 1000); // 5 dakika
    } else {
        logger.log('⚠️ syncUsers interval bulunamadı!', 'warn');
    }
    
    setInterval(async () => {
        await syncGuilds();
    }, 1000 * 60 * 5);
})

const loadIntervals = function() {
    const intervalFiles = fs.readdirSync('./bot/intervals').filter(file => file.endsWith('.js'));
    
    logger.log(`Loading ${intervalFiles.length} intervals...`, 'info');
    
    for (const file of intervalFiles) {
        const interval = require(`./bot/intervals/${file}`);
        
        if (interval.execute && interval.interval) {
            // İlk çalıştırma
            interval.execute(bot);
            
            // Periyodik çalıştırma
            setInterval(() => {
                interval.execute(bot);
            }, interval.interval);
            
            logger.log(`Interval loaded: ${interval.name} (${interval.interval / 1000}s)`, 'success');
        }
    }
}

const syncGuilds = global.syncGuilds = async function(specificGuildId = null) {
    try {
        let guilds = bot.guilds.cache.map(x => x) || [];
        
        // Eğer specificGuildId verilmişse, sadece o sunucuyu sync et
        if (specificGuildId) {
            guilds = guilds.filter(g => g.id === specificGuildId);
            if (guilds.length === 0) {
                logger.log(`⚠️ Belirtilen sunucu bot'ta bulunamadı: ${specificGuildId}`, 'warn');
                return;
            }
        }

        for (let i = 0; i < guilds.length; i++) {
            const guild = guilds[i];
            
            let guildData = await GuildData.findOne({guildId: guild.id});
            
            // Owner bilgilerini Discord'dan çek
            let ownerInfo = null;
            if (guild.ownerId) {
                try {
                    const owner = await bot.users.fetch(guild.ownerId);
                    ownerInfo = {
                        username: owner.username,
                        globalName: owner.globalName || null,
                        avatarURL: owner.displayAvatarURL({ dynamic: true, size: 256 })
                    };
                } catch (error) {
                    logger.log(`Owner fetch error for ${guild.ownerId}: ${error.message}`, 'warn');
                }
            }
            
            if(guildData) {
                // Eğer sunucu isActive: false ise ve approvalStatus: 'approved' ise, aktif et
                // (Onaylandıktan sonra sync ediliyorsa)
                if (guildData.isActive === false && guildData.approvalStatus === 'approved') {
                    guildData.isActive = true;
                    await guildData.save();
                    logger.log(`✅ Onaylanmış sunucu aktif edildi: ${guild.name} (${guild.id})`, 'success');
                }
                
                // Eğer sunucu isActive: false ise ve approved değilse, atla
                if (guildData.isActive === false && guildData.approvalStatus !== 'approved') {
                    continue; // Bu sunucuyu atla, güncelleme
                }
                
                let changed = false;
                
                // Mevcut sunucular için: approvalStatus yoksa veya null ise, approved yap (eski sunucular)
                if (!guildData.approvalStatus || guildData.approvalStatus === null || guildData.approvalStatus === undefined) {
                    guildData.approvalStatus = 'approved';
                    guildData.isApproved = true;
                    changed = true;
                }
                
                if(guildData.name !== guild.name) {
                    guildData.name = guild.name;
                    changed = true;
                }
                
                if(guildData.memberCount !== guild.memberCount) {
                    guildData.memberCount = guild.memberCount;
                    changed = true;
                }
                
                if(guildData.iconURL !== guild.iconURL()) {
                    guildData.iconURL = guild.iconURL();
                    changed = true;
                }
                
                if(guildData.ownerId !== guild.ownerId) {
                    guildData.ownerId = guild.ownerId;
                    changed = true;
                }
                
                if(!guildData.guildCreatedAt && guild.createdAt) {
                    guildData.guildCreatedAt = guild.createdAt;
                    changed = true;
                }
                
                // Owner bilgilerini güncelle
                if (ownerInfo) {
                    if (guildData.ownerUsername !== ownerInfo.username) {
                        guildData.ownerUsername = ownerInfo.username;
                        changed = true;
                    }
                    if (guildData.ownerGlobalName !== ownerInfo.globalName) {
                        guildData.ownerGlobalName = ownerInfo.globalName;
                        changed = true;
                    }
                    if (guildData.ownerAvatarURL !== ownerInfo.avatarURL) {
                        guildData.ownerAvatarURL = ownerInfo.avatarURL;
                        changed = true;
                    }
                }
                
                if(changed) {
                    await guildData.save();
                }
            } else {
                // Yeni sunucu - syncGuilds sırasında oluşturuluyorsa, bu eski bir sunucu olabilir
                // Önce silinmiş mi kontrol et (isActive: false olan bir kayıt var mı?)
                const deletedGuild = await GuildData.findOne({ guildId: guild.id, isActive: false });
                if (deletedGuild) {
                    // Bu sunucu daha önce silinmiş, tekrar ekleme
                    logger.log(`⚠️ Silinmiş sunucu tekrar eklenmeye çalışıldı, atlanıyor: ${guild.name} (${guild.id})`, 'warn');
                    continue;
                }
                
                // Bu durumda onaylanmış olarak işaretle (çünkü zaten bot'ta var)
                let newGuild = new GuildData({
                    guildId: guild.id,
                    name: guild.name,
                    memberCount: guild.memberCount,
                    ownerId: guild.ownerId,
                    ownerUsername: ownerInfo?.username || null,
                    ownerGlobalName: ownerInfo?.globalName || null,
                    ownerAvatarURL: ownerInfo?.avatarURL || null,
                    guildCreatedAt: guild.createdAt,
                    iconURL: guild.iconURL(),
                    // Eski sunucular için otomatik onay (syncGuilds sırasında oluşturuluyorsa)
                    isApproved: true,
                    approvalStatus: 'approved',
                    isActive: true
                });
                
                await newGuild.save();
            }
        }
    } catch (error) {
        logger.log(`Sync guilds error: ${error.message}`, "error");
    }
}

// Tüm oy verme panellerini yeni tasarımla güncelle - TÜM SUNUCULARI TESPİT ET VE GÜNCELLE
const updateAllVotePanels = async function() {
    try {
        const interactionCreateEvent = require('./bot/events/interactionCreate');
        const updateVoteEmbed = interactionCreateEvent.updateVoteEmbed;
        
        // Tüm setup edilmiş ve aktif sunucuları al (votePanelMessageId olsun ya da olmasın)
        const allGuilds = await GuildData.find({ isSetup: true, isActive: true });
        
        logger.log(`${allGuilds.length} sunucuda oy verme paneli tespit ediliyor ve güncelleniyor...`, 'info');
        
        let updated = 0;
        let failed = 0;
        let notFound = 0;
        
        for (const guildData of allGuilds) {
            try {
                const guild = bot.guilds.cache.get(guildData.guildId);
                
                if (!guild) {
                    notFound++;
                    continue;
                }
                
                let panelUpdated = false;
                
                // 1. Önce kayıtlı panel mesaj ID'si varsa onu güncelle
                if (guildData.votePanelMessageId && guildData.votePanelChannelId) {
                    try {
                        const panelChannel = guild.channels.cache.get(guildData.votePanelChannelId);
                        
                            if (panelChannel) {
                                // mesaj.json'a ekle
                                const mesajHelper = require('./lib/mesajHelper');
                                mesajHelper.addMessageToJson(guild.id, guildData.votePanelChannelId, guildData.votePanelMessageId);
                                
                                const result = await updateVoteEmbed(guild, panelChannel, bot);
                                if (result === true || result === undefined) {
                                    updated++;
                                    panelUpdated = true;
                                    logger.log(`Panel güncellendi (kayıtlı): ${guild.name} (${guild.id})`, 'info');
                                }
                            }
                    } catch (error) {
                        logger.log(`Kayıtlı panel güncelleme hatası ${guild.id}: ${error.message}`, 'warn');
                    }
                }
                
                // 2. Eğer kayıtlı panel yoksa veya güncellenemediyse, tüm kanallarda panel ara
                if (!panelUpdated) {
                    try {
                        // Tüm metin kanallarını kontrol et
                        const textChannels = guild.channels.cache.filter(ch => ch.type === 0); // Text channel type
                        
                                for (const channel of textChannels.values()) {
                                    try {
                                        const result = await updateVoteEmbed(guild, channel, bot);
                                        if (result === true || result === undefined) {
                                            // Panel bulundu, mesaj.json'a ekle
                                            // updateVoteEmbed içinde zaten mesaj ID'si kaydediliyor, burada da ekleyelim
                                            const guildDataAfter = await GuildData.findOne({ guildId: guild.id });
                                            if (guildDataAfter && guildDataAfter.votePanelMessageId && guildDataAfter.votePanelChannelId) {
                                                const mesajHelper = require('./lib/mesajHelper');
                                                mesajHelper.addMessageToJson(guild.id, guildDataAfter.votePanelChannelId, guildDataAfter.votePanelMessageId);
                                            }
                                            
                                            updated++;
                                            panelUpdated = true;
                                            logger.log(`Panel bulundu ve güncellendi: ${guild.name} - ${channel.name} (${guild.id})`, 'info');
                                            break; // Bir panel bulundu, diğer kanallara bakma
                                        }
                                    } catch (error) {
                                        // Bu kanalda panel yok, devam et
                                        continue;
                                    }
                                }
                    } catch (error) {
                        logger.log(`Panel arama hatası ${guild.id}: ${error.message}`, 'warn');
                    }
                }
                
                if (!panelUpdated) {
                    logger.log(`Panel bulunamadı: ${guild.name} (${guild.id})`, 'warn');
                }
                
            } catch (error) {
                failed++;
                logger.log(`Panel güncelleme hatası ${guildData.guildId}: ${error.message}`, 'warn');
            }
        }
        
        logger.log(`Panel güncelleme tamamlandı: ${updated} güncellendi, ${failed} başarısız, ${notFound} sunucu bulunamadı`, 'success');
    } catch (error) {
        logger.log(`Panel güncelleme genel hatası: ${error.message}`, 'error');
        logger.log(`Panel güncelleme genel hatası stack: ${error.stack}`, 'error');
    }
}

// mesaj.json'daki tüm panelleri güncelle - Export edilebilir
const updatePanelsFromMesajJson = global.updatePanelsFromMesajJson = async function() {
    try {
        const mesajHelper = require('./lib/mesajHelper');
        const interactionCreateEvent = require('./bot/events/interactionCreate');
        const updateVoteEmbed = interactionCreateEvent.updateVoteEmbed;
        
        const allLinks = mesajHelper.getAllMessageLinks();
        logger.log(`${allLinks.length} panel linki mesaj.json'dan okundu, güncelleniyor...`, 'info');
        
        let updated = 0;
        let failed = 0;
        let notFound = 0;
        
        for (const item of allLinks) {
            try {
                const parsed = mesajHelper.parseMessageLink(item.link);
                if (!parsed) {
                    logger.log(`Invalid link format: ${item.link}`, 'warn');
                    continue;
                }
                
                const guild = bot.guilds.cache.get(parsed.guildId);
                if (!guild) {
                    notFound++;
                    continue;
                }
                
                const channel = guild.channels.cache.get(parsed.channelId);
                if (!channel) {
                    notFound++;
                    continue;
                }
                
                // Panel mesajını kontrol et ve güncelle
                try {
                    const message = await channel.messages.fetch(parsed.messageId).catch(() => null);
                    if (!message) {
                        notFound++;
                        continue;
                    }
                    
                    // Panel güncelle
                    const result = await updateVoteEmbed(guild, channel, bot);
                    if (result === true) {
                        updated++;
                        logger.log(`✅ Panel updated from mesaj.json: ${item.link}`, 'success');
                    } else {
                        failed++;
                    }
                } catch (error) {
                    failed++;
                    logger.log(`Error updating panel from mesaj.json ${item.link}: ${error.message}`, 'warn');
                }
            } catch (error) {
                failed++;
                logger.log(`Error processing link ${item.link}: ${error.message}`, 'warn');
            }
        }
        
        logger.log(`mesaj.json panel güncelleme tamamlandı: ${updated} güncellendi, ${failed} başarısız, ${notFound} bulunamadı`, 'success');
    } catch (error) {
        logger.log(`mesaj.json panel güncelleme genel hatası: ${error.message}`, 'error');
    }
}

const updateAllGuildStats = global.updateAllGuildStats = async function() {
    try {
        const guilds = await GuildData.find({ isSetup: true, isActive: true });
        
        let updated = 0;
        let failed = 0;

        for (const guildData of guilds) {
            try {
                const guild = bot.guilds.cache.get(guildData.guildId);
                
                if (!guild) {
                    logger.log(`Guild ${guildData.guildId} not found in cache`, 'warn');
                    failed++;
                    continue;
                }

                // Fetch guild to get accurate member count
                await guild.fetch();

                // Calculate online members (online, dnd, idle)
                const onlineMembers = guild.members.cache.filter(member => {
                    const status = member.presence?.status;
                    return status === 'online' || status === 'dnd' || status === 'idle';
                }).size;

                // Calculate voice channel members and camera/stream counts
                let voiceMembers = 0;
                let cameraMembers = 0;
                let streamMembers = 0;
                
                // Tüm voice state'leri kontrol et
                guild.voiceStates.cache.forEach(voiceState => {
                    if (voiceState.channel) {
                        voiceMembers++;
                        if (voiceState.selfVideo === true) {
                            cameraMembers++;
                        }
                        if (voiceState.streaming === true) {
                            streamMembers++;
                        }
                    }
                });

                // Get boost count
                const boostCount = guild.premiumSubscriptionCount || 0;

                // Owner bilgilerini Discord'dan çek
                let ownerInfo = null;
                if (guild.ownerId) {
                    try {
                        const owner = await bot.users.fetch(guild.ownerId);
                        ownerInfo = {
                            username: owner.username,
                            globalName: owner.globalName || null,
                            avatarURL: owner.displayAvatarURL({ dynamic: true, size: 256 })
                        };
                    } catch (error) {
                        logger.log(`Owner fetch error for ${guild.ownerId}: ${error.message}`, 'warn');
                    }
                }

                // Update database - Setup edilmiş sunucular için isim ve profil resmini koru
                // Sadece istatistikleri güncelle, isim ve profil resmi korunacak
                const updateData = {
                    memberCount: guild.memberCount,
                    onlineCount: onlineMembers,
                    voiceCount: voiceMembers,
                    cameraCount: cameraMembers,
                    streamCount: streamMembers,
                    boostCount: boostCount,
                    bannerURL: guild.bannerURL()
                };
                
                // İsim ve profil resmi güncellenmeyecek (setup edilmiş sunucular için korunacak)

                // Owner bilgilerini ekle
                if (ownerInfo) {
                    updateData.ownerId = guild.ownerId;
                    updateData.ownerUsername = ownerInfo.username;
                    updateData.ownerGlobalName = ownerInfo.globalName;
                    updateData.ownerAvatarURL = ownerInfo.avatarURL;
                }

                await GuildData.findOneAndUpdate(
                    { guildId: guild.id },
                    updateData
                );

                updated++;
                logger.log(`Updated stats for ${guild.name}: ${onlineMembers} online / ${voiceMembers} voice / ${boostCount} boost`, 'info');

            } catch (error) {
                logger.log(`Failed to update guild ${guildData.guildId}: ${error.message}`, 'error');
                failed++;
            }
        }

        logger.log(`Guild stats update completed: ${updated} updated, ${failed} failed`, 'success');

    } catch (error) {
        logger.log(`Guild stats update error: ${error.message}`, 'error');
    }
}

const db = new Database(settings.MONGO_URI)

// Basit HTTP server - syncGuilds için endpoint
const http = require('http');
const syncServer = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/sync-guilds') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body || '{}');
                const guildId = data.guildId;
                
                if (guildId) {
                    logger.log(`🔄 Manuel syncGuilds çağrısı: ${guildId}`, 'info');
                    await syncGuilds(guildId);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Sync tamamlandı' }));
                } else {
                    logger.log(`🔄 Tüm sunucular için syncGuilds çağrısı`, 'info');
                    await syncGuilds();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Sync tamamlandı' }));
                }
            } catch (error) {
                logger.log(`❌ Sync hatası: ${error.message}`, 'error');
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

const SYNC_PORT = process.env.BOT_SYNC_PORT || 3001;

async function startBot() {
    try {
        await db.connect();
        
        // HTTP server'ı başlat - Port hatası için error handler
        syncServer.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                logger.log(`⚠️ Port ${SYNC_PORT} zaten kullanımda, farklı bir port deneniyor...`, 'warn');
                // Farklı bir port dene
                const newPort = SYNC_PORT + 1;
                syncServer.listen(newPort, () => {
                    logger.log(`✅ Bot sync server başlatıldı: http://localhost:${newPort}/api/sync-guilds`, 'success');
                });
            } else {
                logger.log(`❌ Server hatası: ${err.message}`, 'error');
            }
        });
        
        syncServer.listen(SYNC_PORT, () => {
            logger.log(`✅ Bot sync server başlatıldı: http://localhost:${SYNC_PORT}/api/sync-guilds`, 'success');
        });
        
        await bot.start(settings.BOT_TOKEN);
        logger.log(`Bot başarıyla başlatıldı`, "success");
    } catch (err) {
        logger.log(`Bot başlatılamadı: ${err.message}`, "error");
        process.exit(1);
    }
}

startBot();
