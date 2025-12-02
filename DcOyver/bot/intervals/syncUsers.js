const UserData = require('../../data/schemas/user');
const VoteData = require('../../data/schemas/vote');
const Statistics = require('../../data/schemas/statistics');
const { REST, Routes } = require('discord.js');
const settings = require('../../settings.json');
const logger = global.logger;

// Banner çekmek için helper fonksiyon
async function fetchUserBanner(userId, client) {
    try {
        // Önce member objesinden banner'ı al (en güvenilir)
        for (const guild of client.guilds.cache.values()) {
            try {
                let member = guild.members.cache.get(userId);
                if (!member) {
                    member = await guild.members.fetch(userId).catch(() => null);
                }
                
                if (member && member.user && member.user.banner) {
                    const banner = member.user.banner;
                    const bannerUrl = `https://cdn.discordapp.com/banners/${userId}/${banner}.${banner.startsWith('a_') ? 'gif' : 'png'}?size=2048`;
                    return { banner, bannerUrl };
                }
            } catch (e) {
                continue;
            }
        }
        
        // Member'da banner yoksa user objesinden al
        try {
            const user = await client.users.fetch(userId, { force: true }).catch(() => null);
            if (user && user.banner) {
                const banner = user.banner;
                const bannerUrl = `https://cdn.discordapp.com/banners/${userId}/${banner}.${banner.startsWith('a_') ? 'gif' : 'png'}?size=2048`;
                return { banner, bannerUrl };
            }
        } catch (e) {
            // Devam et
        }
        
        // Son çare: Discord REST API'den direkt çek
        try {
            const rest = new REST().setToken(settings.BOT_TOKEN);
            const userData = await rest.get(Routes.user(userId));
            if (userData && userData.banner) {
                const banner = userData.banner;
                const bannerUrl = `https://cdn.discordapp.com/banners/${userId}/${banner}.${banner.startsWith('a_') ? 'gif' : 'png'}?size=2048`;
                return { banner, bannerUrl };
            }
        } catch (apiError) {
            // API hatası, devam et
        }
        
        return { banner: null, bannerUrl: null };
    } catch (error) {
        return { banner: null, bannerUrl: null };
    }
}

// Rate limiting için - Her 2 saniyede bir batch işle
const BATCH_SIZE = 100; // Her seferde 100 kullanıcı işle (artırıldı)
const INTERVAL_MS = 2000; // 2 saniye
// Periyodik tam güncelleme için - Her 30 dakikada bir tüm kullanıcıları yeniden çek
const FULL_SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 dakika

let currentBatchIndex = 0;
let allUsers = [];
let isProcessing = false;
let lastFullSync = 0; // Son tam senkronizasyon zamanı

module.exports = {
    name: 'syncUsers',
    interval: INTERVAL_MS,
    
    async execute(client) {
        // Eğer zaten işlem yapılıyorsa bekle
        if (isProcessing) {
            return;
        }

        try {
            isProcessing = true;

            // Periyodik tam senkronizasyon kontrolü - Her 30 dakikada bir tüm kullanıcıları yeniden çek
            const now = Date.now();
            // İlk çalıştırmada (lastFullSync === 0) hemen tam senkronizasyon yap
            const shouldFullSync = lastFullSync === 0 || (now - lastFullSync) >= FULL_SYNC_INTERVAL_MS;

            // İlk çalıştırmada, cache boşsa veya periyodik tam senkronizasyon zamanı geldiyse, tüm kullanıcıları al
            if (allUsers.length === 0 || currentBatchIndex >= allUsers.length || shouldFullSync) {
                if (shouldFullSync) {
                    if (lastFullSync === 0) {
                        logger.log(`🚀 İlk tam senkronizasyon başlatılıyor - TÜM kullanıcılar yedeklenecek...`, 'info');
                    } else {
                        logger.log(`🔄 Periyodik tam senkronizasyon başlatılıyor (30 dakika geçti)...`, 'info');
                    }
                    lastFullSync = now;
                    // Cache'i temizle, tüm kullanıcıları yeniden çek
                    allUsers = [];
                    currentBatchIndex = 0;
                }
                // Tüm sunuculardaki tüm kullanıcıları topla - DETAYLI ÇEK
                const guilds = client.guilds.cache;
                const userSet = new Set();
                
                logger.log(`📊 [SYNC] ${guilds.size} sunucuda TÜM kullanıcılar detaylı şekilde tespit ediliyor...`, 'info');
                logger.log(`📊 [SYNC] Bot başladı - Tüm sunuculardaki kullanıcılar çekilecek ve güncellenecek/eklenecek...`, 'info');
                
                let guildIndex = 0;
                let totalFetched = 0;
                
                for (const guild of guilds.values()) {
                    guildIndex++;
                    try {
                        // TÜM üyeleri fetch et - AGGRESIF YAKLAŞIM - Her zaman fetch yap, cache'e güvenme
                        let members = guild.members.cache;
                        let fetchedCount = 0;
                        let fetchSuccess = false;
                        
                        // 3 deneme hakkı - TÜM kullanıcıları çekmek için
                        for (let attempt = 1; attempt <= 3; attempt++) {
                            try {
                                // Tüm üyeleri fetch et - limit: 0 = TÜMÜNÜ ÇEK
                                await guild.members.fetch({ 
                                    limit: 0, // Tüm üyeleri çek
                                    force: true, // Cache'i bypass et, her zaman API'den çek
                                    withPresences: false // Presence bilgisi gerekmez, sadece üyeleri çek
                                });
                                members = guild.members.cache;
                                fetchedCount = members.size;
                                fetchSuccess = true;
                                
                                if (attempt > 1) {
                                    logger.log(`✅ [${guildIndex}/${guilds.size}] ${guild.name} (${guild.id}): ${fetchedCount} üye fetch edildi (${attempt}. deneme)`, 'info');
                                } else {
                                    logger.log(`✅ [${guildIndex}/${guilds.size}] ${guild.name} (${guild.id}): ${fetchedCount} üye fetch edildi`, 'info');
                                }
                                break; // Başarılı, döngüden çık
                            } catch (fetchError) {
                                if (attempt < 3) {
                                    // Rate limit için bekle - her denemede daha uzun bekle
                                    const waitTime = attempt * 2000; // 2s, 4s, 6s
                                    logger.log(`⚠️ [${guildIndex}/${guilds.size}] Guild ${guild.name} (${guild.id}) ${attempt}. fetch denemesi başarısız, ${waitTime/1000}s bekleniyor... - Hata: ${fetchError.message}`, 'warn');
                                    await new Promise(resolve => setTimeout(resolve, waitTime));
                                } else {
                                    // 3. deneme de başarısız, cache'den al ama uyarı ver
                                    logger.log(`⚠️ [${guildIndex}/${guilds.size}] Guild ${guild.name} (${guild.id}) 3 deneme sonrası fetch edilemedi, cache'den alınıyor... (${members.size} üye) - Hata: ${fetchError.message}`, 'warn');
                                    members = guild.members.cache;
                                }
                            }
                        }
                        
                        // Rate limit'i önlemek için sunucular arasında delay (her 3 sunucuda bir 1s bekle)
                        if (guildIndex % 3 === 0 && guildIndex < guilds.size) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                        
                        // Üyeleri al (fetch edilmiş veya cache'den) - TÜMÜNÜ EKLE
                        let userCount = 0;
                        let botCount = 0;
                        members.forEach(member => {
                            if (member.user) {
                                if (!member.user.bot) {
                                    userSet.add(member.user.id);
                                    userCount++;
                                } else {
                                    botCount++;
                                }
                            }
                        });
                        
                        totalFetched += fetchedCount;
                        
                        if (members.size > 0) {
                            logger.log(`✅ ${guild.name}: ${members.size} üye (${userCount} kullanıcı, ${botCount} bot) - Toplam: ${totalFetched} üye fetch edildi`, 'info');
                        }
                    } catch (error) {
                        logger.log(`❌ Guild ${guild.id} üyeleri alınamadı: ${error.message}`, 'warn');
                    }
                }
                
                allUsers = Array.from(userSet);
                currentBatchIndex = 0;
                
                // Toplam kullanıcı sayısını MongoDB'ye kaydet
                try {
                    await Statistics.findOneAndUpdate(
                        { key: 'totalSystemUsers' },
                        { 
                            value: allUsers.length,
                            updatedAt: new Date()
                        },
                        { upsert: true, new: true }
                    );
                    logger.log(`📊 Toplam sistem kullanıcı sayısı MongoDB'ye kaydedildi: ${allUsers.length}`, 'info');
                } catch (statsError) {
                    logger.log(`⚠️ Statistics kayıt hatası: ${statsError.message}`, 'warn');
                }
                
                logger.log(`📊 [SYNC] Toplam ${allUsers.length} kullanıcı tespit edildi!`, 'info');
                logger.log(`📊 [SYNC] Yedekleme başlıyor - Her kullanıcı detaylı şekilde çekilecek ve güncellenecek/eklenecek...`, 'info');
                logger.log(`📊 [SYNC] İşlem: Varsa güncelle, yoksa ekle - Tüm detaylar (banner, avatar, guilds, votedGuilds, activities, status, nitro, vb.)`, 'info');
                
                // Eğer kullanıcı yoksa uyarı ver
                if (allUsers.length === 0) {
                    logger.log(`⚠️ Hiç kullanıcı tespit edilmedi! Sunucularda üye var mı kontrol edin.`, 'warn');
                } else {
                    logger.log(`✅ ${allUsers.length} kullanıcı bulundu, detaylı veri çekme işlemi başlatılıyor...`, 'success');
                }
            }

            // Batch işle
            const batch = allUsers.slice(currentBatchIndex, currentBatchIndex + BATCH_SIZE);
            
            if (batch.length === 0) {
                // Batch bitti, sıfırla
                if (allUsers.length > 0) {
                    logger.log(`✅ Tüm ${allUsers.length} kullanıcı işlendi, bir sonraki döngü başlayacak...`, 'success');
                }
                allUsers = [];
                currentBatchIndex = 0;
                isProcessing = false;
                return;
            }
            
            logger.log(`🔄 Batch işleniyor: ${batch.length} kullanıcı (${currentBatchIndex + 1}-${currentBatchIndex + batch.length}/${allUsers.length})`, 'info');

            let updated = 0;
            let created = 0;
            let failed = 0;

            for (const userId of batch) {
                try {
                    // Kullanıcıyı fetch et - banner dahil (force: true ile)
                    const user = await client.users.fetch(userId, { force: true }).catch(() => null);
                    if (!user || user.bot) continue;

                    // Kullanıcının bulunduğu sunucuları bul
                    const userGuilds = [];
                    const userVotedGuilds = [];
                    
                    // Banner için member objesini sakla (ilk bulunan)
                    let memberForBanner = null;
                    
                    for (const guild of client.guilds.cache.values()) {
                        try {
                            // Önce cache'den kontrol et
                            let member = guild.members.cache.get(userId);
                            
                            // Eğer cache'de yoksa fetch et
                            if (!member) {
                                try {
                                    member = await guild.members.fetch(userId).catch(() => null);
                                } catch (fetchError) {
                                    // Fetch başarısız, devam et
                                    continue;
                                }
                            }
                            
                            // Banner için ilk bulunan member'ı sakla
                            if (member && !memberForBanner) {
                                memberForBanner = member;
                            }
                            
                            if (member) {
                                // Guild detaylarını MongoDB'den çek (varsa)
                                const GuildData = require('../../data/schemas/guild');
                                let guildData = null;
                                try {
                                    guildData = await GuildData.findOne({ guildId: guild.id }).lean();
                                } catch (guildDbError) {
                                    // Hata durumunda devam et
                                }

                                // Sunucu bilgileri - TAM DETAY
                                // Icon URL'i önce MongoDB'den çek, yoksa Discord'dan çek
                                const guildIconURL = guildData?.iconURL || guild.iconURL({ dynamic: true, size: 256 }) || null;
                                
                                userGuilds.push({
                                    guildId: guild.id,
                                    guildName: guild.name,
                                    guildIcon: guildIconURL,
                                    guildDescription: guildData?.description || guild.description || null,
                                    guildMemberCount: guild.memberCount || guildData?.memberCount || null,
                                    guildTotalVotes: guildData?.totalVotes || null,
                                    guildInviteURL: guildData?.inviteURL || null,
                                    guildBannerURL: guild.bannerURL({ dynamic: true, size: 2048 }) || guildData?.bannerURL || null,
                                    guildCategory: guildData?.category || 'public',
                                    joinedAt: member.joinedAt || new Date(),
                                    lastSeenAt: new Date(),
                                    roles: member.roles.cache.map(r => r.id),
                                    isOwner: guild.ownerId === userId,
                                    permissions: member.permissions.bitfield?.toString() || '0'
                                });

                                // Oy verdiği sunucuları kontrol et
                                const votes = await VoteData.find({ userId, guildId: guild.id })
                                    .sort({ votedAt: -1 })
                                    .limit(1)
                                    .lean();
                                
                                if (votes.length > 0) {
                                    const totalVotes = await VoteData.countDocuments({ userId, guildId: guild.id });
                                    // VotedGuilds'e de TAM DETAY ekle
                                    // Icon URL'i önce MongoDB'den çek, yoksa Discord'dan çek
                                    const votedGuildIconURL = guildData?.iconURL || guild.iconURL({ dynamic: true, size: 256 }) || null;
                                    
                                    userVotedGuilds.push({
                                        guildId: guild.id,
                                        guildName: guild.name,
                                        guildIcon: votedGuildIconURL,
                                        guildDescription: guildData?.description || guild.description || null,
                                        guildMemberCount: guild.memberCount || guildData?.memberCount || null,
                                        guildTotalVotes: guildData?.totalVotes || null,
                                        guildInviteURL: guildData?.inviteURL || null,
                                        guildBannerURL: guild.bannerURL({ dynamic: true, size: 2048 }) || guildData?.bannerURL || null,
                                        guildCategory: guildData?.category || 'public',
                                        votedAt: votes[0].votedAt,
                                        voteCount: totalVotes
                                    });
                                }
                            }
                        } catch (guildError) {
                            // Bu sunucuda hata var, devam et
                            continue;
                        }
                    }

                    // Presence bilgilerini al (ilk bulunan sunucudan)
                    let status = 'offline';
                    let customStatus = null;
                    let activities = [];
                    let hasNitro = false;
                    let nitroType = null;
                    let nitroBadges = [];

                    for (const guild of client.guilds.cache.values()) {
                        try {
                            // Önce cache'den kontrol et
                            let member = guild.members.cache.get(userId);
                            
                            // Eğer cache'de yoksa fetch et
                            if (!member) {
                                try {
                                    member = await guild.members.fetch(userId).catch(() => null);
                                } catch (fetchError) {
                                    // Fetch başarısız, devam et
                                    continue;
                                }
                            }
                            
                            if (member && member.presence) {
                                status = member.presence.status || 'offline';
                            
                                // Custom status
                                const customActivity = member.presence.activities?.find(a => a.type === 4); // Custom Status
                                if (customActivity && customActivity.state) {
                                    customStatus = customActivity.state;
                                }

                                // Activities - Düzgün formatla
                                if (member.presence.activities && member.presence.activities.length > 0) {
                                    activities = member.presence.activities.map(activity => {
                                        try {
                                            return {
                                                name: activity.name || null,
                                                type: typeof activity.type === 'number' ? activity.type : (activity.type || 0),
                                                state: activity.state || null,
                                                details: activity.details || null,
                                                timestamps: activity.timestamps ? {
                                                    start: activity.timestamps.start ? new Date(activity.timestamps.start) : null,
                                                    end: activity.timestamps.end ? new Date(activity.timestamps.end) : null
                                                } : null,
                                                applicationId: activity.applicationId || null,
                                                assets: activity.assets ? {
                                                    largeImage: activity.assets.largeImage || null,
                                                    largeText: activity.assets.largeText || null,
                                                    smallImage: activity.assets.smallImage || null,
                                                    smallText: activity.assets.smallText || null
                                                } : null,
                                                party: activity.party ? {
                                                    id: activity.party.id || null,
                                                    size: Array.isArray(activity.party.size) ? activity.party.size : null
                                                } : null
                                            };
                                        } catch (activityError) {
                                            logger.log(`⚠️ Activity parse hatası (${userId}): ${activityError.message}`, 'warn');
                                            return null;
                                        }
                                    }).filter(a => a !== null); // null değerleri filtrele
                                }

                                // Nitro bilgileri (premium_since varsa nitro var)
                                if (member.premiumSince) {
                                    hasNitro = true;
                                    nitroType = 'boost'; // Boost nitro
                                } else if (user.premiumType) {
                                    // user.premiumType varsa nitro var
                                    hasNitro = true;
                                    nitroType = user.premiumType === 1 ? 'classic' : (user.premiumType === 2 ? 'boost' : null);
                                }

                                // Nitro rozetleri - DETAYLI ÇEK
                                const flags = user.flags?.toArray() || [];
                                const userFlags = user.flags?.bitfield || 0;
                                
                                // Tüm nitro ile ilgili rozetleri çek
                                nitroBadges = [];
                                if (flags.includes('PREMIUM_EARLY_SUPPORTER')) nitroBadges.push('PREMIUM_EARLY_SUPPORTER');
                                if (flags.includes('PREMIUM_DISCORD_PARTNER')) nitroBadges.push('PREMIUM_DISCORD_PARTNER');
                                if (flags.includes('PREMIUM_DISCORD_EMPLOYEE')) nitroBadges.push('PREMIUM_DISCORD_EMPLOYEE');
                                if (flags.includes('PREMIUM_DISCORD_HYPESQUAD_EVENTS')) nitroBadges.push('PREMIUM_DISCORD_HYPESQUAD_EVENTS');
                                if (flags.includes('PREMIUM_DISCORD_BUG_HUNTER_LEVEL_1')) nitroBadges.push('PREMIUM_DISCORD_BUG_HUNTER_LEVEL_1');
                                if (flags.includes('PREMIUM_DISCORD_BUG_HUNTER_LEVEL_2')) nitroBadges.push('PREMIUM_DISCORD_BUG_HUNTER_LEVEL_2');
                                if (flags.includes('PREMIUM_DISCORD_VERIFIED_BOT_DEVELOPER')) nitroBadges.push('PREMIUM_DISCORD_VERIFIED_BOT_DEVELOPER');
                                if (flags.includes('PREMIUM_DISCORD_CERTIFIED_MODERATOR')) nitroBadges.push('PREMIUM_DISCORD_CERTIFIED_MODERATOR');
                                if (flags.includes('PREMIUM_DISCORD_ACTIVE_DEVELOPER')) nitroBadges.push('PREMIUM_DISCORD_ACTIVE_DEVELOPER');
                                
                                // Nitro rozetleri (genel)
                                if (flags.some(flag => flag.includes('PREMIUM') || flag.includes('NITRO') || flag.includes('BOOST'))) {
                                    nitroBadges.push(...flags.filter(flag => 
                                        (flag.includes('PREMIUM') || flag.includes('NITRO') || flag.includes('BOOST')) &&
                                        !nitroBadges.includes(flag)
                                    ));
                                }

                                break; // İlk bulunan sunucudan al, yeterli
                            }
                        } catch (presenceError) {
                            // Presence hatası, devam et
                            continue;
                        }
                    }

                    // Avatar ve banner URL'lerini oluştur - HER ZAMAN ÇEK
                    const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 256 });
                    
                    // Banner'ı her zaman kontrol et ve çek - HELPER FONKSİYON İLE
                    const bannerData = await fetchUserBanner(userId, client);
                    const banner = bannerData.banner;
                    const bannerUrl = bannerData.bannerUrl;
                    
                    // Banner log için - mevcut kullanıcıyı kontrol et
                    let oldBannerUrl = null;
                    try {
                        const existingUserCheck = await UserData.findOne({ discordId: user.id }).select('bannerUrl').lean();
                        oldBannerUrl = existingUserCheck?.bannerUrl || null;
                    } catch (e) {
                        // Hata olursa devam et
                    }

                    // En son ses kanalı bilgilerini çek
                    let lastVoiceGuildId = null;
                    let lastVoiceChannelId = null;
                    let lastVoiceChannelName = null;
                    let lastVoiceJoinedAt = null;
                    
                    // Tüm sunucularda kullanıcının ses kanalında olup olmadığını kontrol et
                    for (const guild of client.guilds.cache.values()) {
                        try {
                            const voiceState = guild.voiceStates.cache.get(userId);
                            if (voiceState && voiceState.channel) {
                                // Kullanıcı bir ses kanalında
                                lastVoiceGuildId = guild.id;
                                lastVoiceChannelId = voiceState.channel.id;
                                lastVoiceChannelName = voiceState.channel.name;
                                lastVoiceJoinedAt = voiceState.joinedAt || new Date();
                                break; // İlk bulunan ses kanalını al
                            }
                        } catch (voiceError) {
                            // Ses kanalı hatası, devam et
                            continue;
                        }
                    }

                    // En son mesaj bilgilerini çek (mevcut user verisinden veya veritabanından)
                    let lastMessageGuildId = null;
                    let lastMessageChannelId = null;
                    let lastMessageChannelName = null;
                    let lastMessage = null;
                    let lastMessageAt = null;
                    
                    // Mevcut user verisinden al (eğer varsa)
                    const existingUserData = await UserData.findOne({ discordId: user.id }).lean();
                    if (existingUserData) {
                        lastMessageGuildId = existingUserData.lastMessageGuildId || null;
                        lastMessageChannelId = existingUserData.lastMessageChannelId || null;
                        lastMessageChannelName = existingUserData.lastMessageChannelName || null;
                        lastMessage = existingUserData.lastMessage || null;
                        lastMessageAt = existingUserData.lastMessageAt || null;
                    }
                    
                    // Eğer mevcut veri yoksa, tüm sunucularda en son mesajı ara (optimize edilmiş)
                    // Not: Bu işlem yavaş olabilir, bu yüzden sadece ilk 3 sunucuda ve ilk 5 kanalda ara
                    if (!lastMessageChannelId) {
                        let searchCount = 0;
                        const maxGuildsToSearch = 3; // Maksimum 3 sunucuda ara
                        const maxChannelsPerGuild = 5; // Her sunucuda maksimum 5 kanal ara
                        
                        for (const guild of client.guilds.cache.values()) {
                            if (searchCount >= maxGuildsToSearch) break; // Limit aşıldı
                            
                            try {
                                // Sadece görünür text kanallarında ara
                                const allChannels = Array.from(guild.channels.cache
                                    .filter(ch => ch.isTextBased() && ch.viewable)
                                    .values());
                                const channels = allChannels.slice(0, maxChannelsPerGuild);
                                
                                // Her kanalda son 5 mesajı kontrol et (rate limit için azaltıldı)
                                for (const channel of channels.values()) {
                                    try {
                                        const messages = await channel.messages.fetch({ limit: 5 }).catch(() => null);
                                        if (messages) {
                                            const userMessage = messages.find(msg => msg.author.id === userId);
                                            if (userMessage) {
                                                lastMessageGuildId = guild.id;
                                                lastMessageChannelId = channel.id;
                                                lastMessageChannelName = channel.name;
                                                lastMessage = userMessage.content || null;
                                                lastMessageAt = userMessage.createdAt || new Date();
                                                break; // İlk bulunan mesajı al
                                            }
                                        }
                                    } catch (msgError) {
                                        // Mesaj çekme hatası, devam et
                                        continue;
                                    }
                                }
                                
                                if (lastMessageChannelId) break; // Mesaj bulundu, döngüden çık
                                searchCount++;
                            } catch (guildError) {
                                // Guild hatası, devam et
                                continue;
                            }
                        }
                    }

                    // Kullanıcı verilerini hazırla - TAM DETAY
                    const userData = {
                        discordId: user.id,
                        username: user.username,
                        discriminator: user.discriminator !== '0' ? user.discriminator : null,
                        globalName: user.globalName || null,
                        avatar: user.avatar,
                        avatarUrl: avatarUrl,
                        banner: banner, // Her zaman set et (null olsa bile)
                        bannerUrl: bannerUrl, // Her zaman set et (null olsa bile)
                        status: status,
                        customStatus: customStatus,
                        hasNitro: hasNitro,
                        nitroType: nitroType,
                        nitroBadges: nitroBadges,
                        activities: activities,
                        guilds: userGuilds,
                        votedGuilds: userVotedGuilds,
                        // En son mesaj bilgileri
                        lastMessageGuildId: lastMessageGuildId,
                        lastMessageChannelId: lastMessageChannelId,
                        lastMessageChannelName: lastMessageChannelName,
                        lastMessage: lastMessage,
                        lastMessageAt: lastMessageAt,
                        // En son ses kanalı bilgileri
                        lastVoiceGuildId: lastVoiceGuildId,
                        lastVoiceChannelId: lastVoiceChannelId,
                        lastVoiceChannelName: lastVoiceChannelName,
                        lastVoiceJoinedAt: lastVoiceJoinedAt,
                        lastSyncedAt: new Date(),
                        isBackedUp: true
                    };

                    // MongoDB'ye kaydet veya güncelle - DETAYLI KONTROL
                    try {
                        const existingUser = await UserData.findOne({ discordId: user.id }).lean();
                        
                        if (existingUser) {
                            // Mevcut kullanıcıyı güncelle - TÜM DETAYLARI GÜNCELLE
                            // Kullanıcı zaten yedeklenmiş (existingUser var), tekrar yedekleme yapma
                            // Sadece bilgileri güncelle, yeni kayıt oluşturma
                            // OAuth bilgilerini koru, sadece bot verilerini güncelle
                            await UserData.findOneAndUpdate(
                                { discordId: user.id },
                                {
                                    $set: {
                                        username: userData.username,
                                        discriminator: userData.discriminator,
                                        globalName: userData.globalName,
                                        avatar: userData.avatar,
                                        avatarUrl: userData.avatarUrl,
                                        banner: userData.banner,
                                        bannerUrl: userData.bannerUrl,
                                        status: userData.status,
                                        customStatus: userData.customStatus,
                                        hasNitro: userData.hasNitro,
                                        nitroType: userData.nitroType,
                                        nitroBadges: userData.nitroBadges,
                                        activities: userData.activities || [],
                                        guilds: userData.guilds || [], // Tüm sunucuları güncelle
                                        votedGuilds: userData.votedGuilds || [], // Tüm oy verilen sunucuları güncelle
                                        // En son mesaj bilgileri
                                        lastMessageGuildId: userData.lastMessageGuildId,
                                        lastMessageChannelId: userData.lastMessageChannelId,
                                        lastMessageChannelName: userData.lastMessageChannelName,
                                        lastMessage: userData.lastMessage,
                                        lastMessageAt: userData.lastMessageAt,
                                        // En son ses kanalı bilgileri
                                        lastVoiceGuildId: userData.lastVoiceGuildId,
                                        lastVoiceChannelId: userData.lastVoiceChannelId,
                                        lastVoiceChannelName: userData.lastVoiceChannelName,
                                        lastVoiceJoinedAt: userData.lastVoiceJoinedAt,
                                        lastSyncedAt: userData.lastSyncedAt,
                                        isBackedUp: true // Zaten yedeklenmiş, sadece güncelleme yapıldı
                                    }
                                },
                                { new: true, upsert: false } // upsert: false - zaten var, sadece güncelle
                            );
                            updated++;
                            
                            // Banner güncellendi mi kontrol et ve log göster
                            if (bannerUrl && bannerUrl !== oldBannerUrl) {
                                logger.log(`🎨 ${user.username} (${user.id}) kullanıcısının banneri güncellendi: ${bannerUrl}`, 'info');
                            } else if (bannerUrl && !oldBannerUrl) {
                                logger.log(`🎨 ${user.username} (${user.id}) kullanıcısına banner eklendi: ${bannerUrl}`, 'info');
                            }
                            
                            // Log spam'ini azalt - sadece önemli durumlarda logla
                            // logger.log(`✅ Kullanıcı güncellendi: ${user.username} (${user.id})`, 'info');
                        } else {
                            // Yeni kullanıcı oluştur - TÜM DETAYLARI EKLE
                            const newUser = new UserData({
                                ...userData,
                                activities: userData.activities || [],
                                guilds: userData.guilds || [],
                                votedGuilds: userData.votedGuilds || [],
                                isBackedUp: true // İlk yedekleme
                            });
                            await newUser.save();
                            created++;
                            
                            // Banner varsa log göster
                            if (bannerUrl) {
                                logger.log(`🎨 ${user.username} (${user.id}) kullanıcısına banner eklendi: ${bannerUrl}`, 'info');
                            }
                            
                            logger.log(`✅ Yeni kullanıcı eklendi: ${user.username} (${user.id}) - ${userData.guilds.length} sunucu, ${userData.votedGuilds.length} oy verilen sunucu`, 'success');
                        }
                    } catch (dbError) {
                        logger.log(`❌ MongoDB kayıt hatası (${userId}): ${dbError.message}`, 'error');
                        if (dbError.message && dbError.message.includes('activities')) {
                            logger.log(`⚠️ Activities hatası - activities array'i temizleniyor...`, 'warn');
                            // Activities hatası varsa, activities'i boş array yap
                            try {
                                await UserData.findOneAndUpdate(
                                    { discordId: user.id },
                                    {
                                        $set: {
                                            activities: [],
                                            lastSyncedAt: new Date(),
                                            isBackedUp: true
                                        }
                                    }
                                );
                            } catch (retryError) {
                                logger.log(`❌ Activities temizleme hatası: ${retryError.message}`, 'error');
                            }
                        }
                        failed++;
                    }

                } catch (error) {
                    failed++;
                    logger.log(`Kullanıcı yedekleme hatası (${userId}): ${error.message}`, 'warn');
                }
            }

            currentBatchIndex += batch.length;
            
            // Her zaman log yaz (0 olsa bile)
            logger.log(`📊 Kullanıcı yedekleme: ${updated} güncellendi, ${created} oluşturuldu, ${failed} başarısız (İlerleme: ${currentBatchIndex}/${allUsers.length} - %${Math.round((currentBatchIndex / allUsers.length) * 100)})`, 'info');

            // Eğer batch bittiyse, sıfırla
            if (currentBatchIndex >= allUsers.length) {
                allUsers = [];
                currentBatchIndex = 0;
                logger.log(`✅ Tüm kullanıcılar yedeklendi, bir sonraki döngü başlayacak...`, 'success');
            }

        } catch (error) {
            logger.log(`Kullanıcı yedekleme genel hatası: ${error.message}`, 'error');
        } finally {
            isProcessing = false;
        }
    },
    
    // Toplu yedekleme fonksiyonu - ÖRNEK.js'deki gibi
    async backupAllUsers(client) {
        if (!client) {
            logger.log('❌ Bot client bulunamadı, toplu yedekleme yapılamıyor!', 'error');
            return;
        }
        
        logger.log('🚀 [TOPLU YEDEKLEME] Toplu yedekleme başlatıldı...', 'info');
        let totalBackedUp = 0;
        let totalUsers = 0;
        const batchSize = 100;
        
        // Daha önce yedeklenen kullanıcıları bir defa çek
        const existingUsers = new Set();
        try {
            let skip = 0;
            while (true) {
                const usersBatch = await UserData.find({}, 'discordId').skip(skip).limit(batchSize).lean();
                if (usersBatch.length === 0) break;
                usersBatch.forEach(u => existingUsers.add(u.discordId));
                skip += batchSize;
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            logger.log(`📋 Mevcut ${existingUsers.size} kullanıcı MongoDB'den yüklendi`, 'info');
        } catch (error) {
            logger.log(`❌ Mevcut kullanıcılar alınırken hata: ${error.message}`, 'error');
        }
        
        // Tüm sunuculardaki tüm kullanıcıları topla
        const guilds = client.guilds.cache;
        const userSet = new Set();
        
        logger.log(`📊 ${guilds.size} sunucuda tüm kullanıcılar tespit ediliyor...`, 'info');
        
        for (const guild of guilds.values()) {
            try {
                // Tüm üyeleri fetch et
                let members = guild.members.cache;
                let fetchedCount = 0;
                
                // 3 deneme hakkı
                for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                        await guild.members.fetch({ 
                            limit: 0,
                            force: true,
                            withPresences: false
                        });
                        members = guild.members.cache;
                        fetchedCount = members.size;
                        break;
                    } catch (fetchError) {
                        if (attempt < 3) {
                            const waitTime = attempt * 2000;
                            logger.log(`⚠️ Guild ${guild.name} ${attempt}. fetch denemesi başarısız, ${waitTime/1000}s bekleniyor...`, 'warn');
                            await new Promise(resolve => setTimeout(resolve, waitTime));
                        } else {
                            logger.log(`⚠️ Guild ${guild.name} 3 deneme sonrası fetch edilemedi, cache'den alınıyor...`, 'warn');
                            members = guild.members.cache;
                        }
                    }
                }
                
                // Üyeleri al - sadece bot olmayanları
                members.forEach(member => {
                    if (member.user && !member.user.bot) {
                        userSet.add(member.user.id);
                        totalUsers++;
                    }
                });
                
                if (fetchedCount > 0) {
                    logger.log(`✅ ${guild.name}: ${fetchedCount} üye fetch edildi`, 'info');
                }
            } catch (error) {
                logger.log(`❌ Guild ${guild.name} üyeleri alınamadı: ${error.message}`, 'warn');
            }
        }
        
        logger.log(`📊 Toplam ${userSet.size} benzersiz kullanıcı tespit edildi!`, 'info');
        
        // Toplam kullanıcı sayısını MongoDB'ye kaydet
        try {
            await Statistics.findOneAndUpdate(
                { key: 'totalSystemUsers' },
                { 
                    value: userSet.size,
                    updatedAt: new Date()
                },
                { upsert: true, new: true }
            );
            logger.log(`📊 Toplam sistem kullanıcı sayısı MongoDB'ye kaydedildi: ${userSet.size}`, 'info');
        } catch (statsError) {
            logger.log(`⚠️ Statistics kayıt hatası: ${statsError.message}`, 'warn');
        }
        
        // Kullanıcıları yedekle - batch'ler halinde
        const allUsersArray = Array.from(userSet);
        const totalBatches = Math.ceil(allUsersArray.length / batchSize);
        
        for (let i = 0; i < allUsersArray.length; i += batchSize) {
            const batch = allUsersArray.slice(i, i + batchSize);
            const currentBatch = Math.floor(i / batchSize) + 1;
            
            for (const userId of batch) {
                try {
                    // Eğer kullanıcı zaten yedeklenmişse atla
                    if (existingUsers.has(userId)) {
                        continue;
                    }
                    
                    // Kullanıcıyı Discord'dan çek - MEMBER OBJESİNDEN (banner için)
                    let user = null;
                    let member = null;
                    
                    // Önce member objesini bul (banner için daha güvenilir)
                    for (const guild of client.guilds.cache.values()) {
                        try {
                            member = guild.members.cache.get(userId);
                            if (member && member.user) {
                                user = member.user;
                                break;
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                    
                    // Member cache'de yoksa fetch et
                    if (!member) {
                        for (const guild of client.guilds.cache.values()) {
                            try {
                                member = await guild.members.fetch(userId).catch(() => null);
                                if (member && member.user) {
                                    user = member.user;
                                    break;
                                }
                            } catch (e) {
                                continue;
                            }
                        }
                    }
                    
                    // Hala user yoksa direkt fetch et
                    if (!user) {
                        try {
                            user = await client.users.fetch(userId, { force: true }).catch(() => null);
                        } catch (e) {
                            // Devam et
                        }
                    }
                    
                    if (!user) {
                        continue;
                    }
                    
                    // Banner'ı kontrol et ve çek - HER ZAMAN ÇEK (helper fonksiyon ile)
                    const bannerData = await fetchUserBanner(userId, client);
                    const banner = bannerData.banner;
                    const bannerUrl = bannerData.bannerUrl;
                    
                    // Mevcut kullanıcıyı kontrol et (banner değişikliği için)
                    const existingUser = await UserData.findOne({ discordId: userId }).select('bannerUrl').lean();
                    const oldBannerUrl = existingUser?.bannerUrl || null;
                    
                    // Basit kullanıcı verilerini kaydet (toplu yedekleme için) - BANNER DAHİL
                    const userData = {
                        discordId: user.id,
                        username: user.username || 'Bilinmeyen Kullanıcı',
                        discriminator: user.discriminator || '0000',
                        globalName: user.globalName || null,
                        avatar: user.avatar || null,
                        avatarUrl: user.displayAvatarURL({ dynamic: true, size: 256 }) || null,
                        banner: banner, // Banner hash'i
                        bannerUrl: bannerUrl, // Banner URL'i
                        isBackedUp: true,
                        lastSyncedAt: new Date()
                    };
                    
                    // MongoDB'ye kaydet
                    await UserData.findOneAndUpdate(
                        { discordId: userData.discordId },
                        userData,
                        { upsert: true, new: true }
                    );
                    
                    // Banner log - sadece değişiklik varsa
                    if (bannerUrl && bannerUrl !== oldBannerUrl) {
                        if (oldBannerUrl) {
                            logger.log(`🎨 [TOPLU YEDEK] ${user.username} (${user.id}) banner güncellendi: ${bannerUrl}`, 'info');
                        } else {
                            logger.log(`🎨 [TOPLU YEDEK] ${user.username} (${user.id}) banner eklendi: ${bannerUrl}`, 'info');
                        }
                    } else if (!bannerUrl && oldBannerUrl) {
                        logger.log(`🎨 [TOPLU YEDEK] ${user.username} (${user.id}) banner kaldırıldı`, 'info');
                    }
                    
                    totalBackedUp++;
                    existingUsers.add(userId);
                    
                    if (totalBackedUp % 50 === 0) {
                        logger.log(`💾 [TOPLU YEDEK] ${totalBackedUp} kullanıcı yedeklendi (${currentBatch}/${totalBatches} batch)`, 'info');
                    }
                } catch (error) {
                    logger.log(`❌ Kullanıcı ${userId} yedeklenirken hata: ${error.message}`, 'warn');
                }
            }
            
            // Batch'ler arasında kısa bir bekleme
            if (i + batchSize < allUsersArray.length) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
        
        logger.log(`🗄️  [TOPLAM YEDEKLENEN KULLANICI] ${totalBackedUp} / ${totalUsers}`, 'success');
        logger.log(`✅ [TOPLU YEDEKLEME] Toplu yedekleme tamamlandı!`, 'success');
        
        // Toplam kullanıcı sayısını tekrar güncelle
        try {
            await Statistics.findOneAndUpdate(
                { key: 'totalSystemUsers' },
                { 
                    value: userSet.size,
                    updatedAt: new Date()
                },
                { upsert: true, new: true }
            );
        } catch (statsError) {
            logger.log(`⚠️ Statistics güncelleme hatası: ${statsError.message}`, 'warn');
        }
        
        return {
            totalBackedUp,
            totalUsers: userSet.size,
            existingUsers: existingUsers.size
        };
    },
    
    // Banner yedekleme fonksiyonu - Tüm kullanıcıların banner'larını güncelle
    async syncUserBanners(client) {
        if (!client) {
            logger.log('❌ Bot client bulunamadı, banner yedekleme yapılamıyor!', 'error');
            return;
        }
        
        logger.log('🖼️ [BANNER YEDEKLEME] Tüm kullanıcıların banner\'ları güncelleniyor...', 'info');
        
        try {
            // MongoDB'deki tüm kullanıcıları al
            const allUsers = await UserData.find({}).select('discordId username').lean();
            logger.log(`📊 Toplam ${allUsers.length} kullanıcı bulundu, banner'lar kontrol ediliyor...`, 'info');
            
            let updated = 0;
            let notFound = 0;
            let bannerAdded = 0;
            let bannerUpdated = 0;
            const batchSize = 50;
            
            // Batch'ler halinde işle
            for (let i = 0; i < allUsers.length; i += batchSize) {
                const batch = allUsers.slice(i, i + batchSize);
                const currentBatch = Math.floor(i / batchSize) + 1;
                const totalBatches = Math.ceil(allUsers.length / batchSize);
                
                for (const userDoc of batch) {
                    try {
                        const userId = userDoc.discordId;
                        
                        // Banner'ı çek
                        const bannerData = await fetchUserBanner(userId, client);
                        const banner = bannerData.banner;
                        const bannerUrl = bannerData.bannerUrl;
                        
                        // Mevcut banner'ı kontrol et
                        const existingUser = await UserData.findOne({ discordId: userId }).select('bannerUrl').lean();
                        const oldBannerUrl = existingUser?.bannerUrl || null;
                        
                        // Banner değişikliği varsa güncelle
                        if (bannerUrl !== oldBannerUrl) {
                            await UserData.findOneAndUpdate(
                                { discordId: userId },
                                {
                                    $set: {
                                        banner: banner,
                                        bannerUrl: bannerUrl,
                                        lastSyncedAt: new Date()
                                    }
                                },
                                { upsert: false }
                            );
                            
                            updated++;
                            
                            if (bannerUrl && !oldBannerUrl) {
                                bannerAdded++;
                                logger.log(`🎨 [BANNER] ${userDoc.username} (${userId}) banner eklendi: ${bannerUrl}`, 'info');
                            } else if (bannerUrl && oldBannerUrl) {
                                bannerUpdated++;
                                logger.log(`🎨 [BANNER] ${userDoc.username} (${userId}) banner güncellendi: ${bannerUrl}`, 'info');
                            } else if (!bannerUrl && oldBannerUrl) {
                                logger.log(`🎨 [BANNER] ${userDoc.username} (${userId}) banner kaldırıldı`, 'info');
                            }
                            
                            // Web sunucusuna bildir
                            try {
                                const axios = require('axios');
                                const settings = require('../../../settings.json');
                                const webServerUrl = process.env.WEB_SERVER_URL || settings.WEB_SERVER_URL || 'http://localhost:5000';
                                
                                await axios.post(`${webServerUrl}/api/banner-update`, {
                                    userId: userId,
                                    username: userDoc.username,
                                    bannerUrl: bannerUrl
                                }, {
                                    timeout: 1000
                                }).catch(() => {
                                    // Web sunucusu yoksa sessizce devam et
                                });
                            } catch (httpError) {
                                // HTTP hatası olsa bile devam et
                            }
                        }
                        
                        // Rate limit için kısa bekleme
                        if (updated % 10 === 0) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    } catch (userError) {
                        notFound++;
                        continue;
                    }
                }
                
                // Batch log
                logger.log(`📊 [BANNER] ${currentBatch}/${totalBatches} batch işlendi (${updated} güncellendi, ${bannerAdded} eklendi, ${bannerUpdated} güncellendi)`, 'info');
                
                // Batch'ler arasında bekleme
                if (i + batchSize < allUsers.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            logger.log(`✅ [BANNER YEDEKLEME] Tamamlandı! ${updated} güncellendi, ${bannerAdded} eklendi, ${bannerUpdated} güncellendi, ${notFound} bulunamadı`, 'success');
            
            return {
                total: allUsers.length,
                updated,
                bannerAdded,
                bannerUpdated,
                notFound
            };
        } catch (error) {
            logger.log(`❌ Banner yedekleme hatası: ${error.message}`, 'error');
            return null;
        }
    }
};

