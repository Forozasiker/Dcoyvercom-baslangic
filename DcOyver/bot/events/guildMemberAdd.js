const UserData = require('../../data/schemas/user');
const Statistics = require('../../data/schemas/statistics');
const logger = global.logger;

module.exports = {
    name: 'guildMemberAdd',
    
    async execute(member, client) {
        try {
            if (!member || !member.user || member.user.bot) return;

            const userId = member.user.id;
            const guild = member.guild;

            // Banner'ı kontrol et ve çek
            let banner = null;
            let bannerUrl = null;
            
            // user.banner varsa direkt kullan
            if (member.user.banner) {
                banner = member.user.banner;
                bannerUrl = `https://cdn.discordapp.com/banners/${member.user.id}/${member.user.banner}.${member.user.banner.startsWith('a_') ? 'gif' : 'png'}?size=2048`;
            } else {
                // Banner yoksa null olarak kaydet
                banner = null;
                bannerUrl = null;
            }

            // Kullanıcının guilds array'ine bu sunucuyu ekle veya güncelle
            const guildInfo = {
                guildId: guild.id,
                guildName: guild.name,
                joinedAt: member.joinedAt || new Date(),
                lastSeenAt: new Date(),
                roles: member.roles.cache.map(r => r.id),
                isOwner: guild.ownerId === userId,
                permissions: member.permissions.bitfield?.toString() || '0'
            };

            // MongoDB'de kullanıcıyı bul
            const userData = await UserData.findOne({ discordId: userId });
            
            if (userData) {
                // Mevcut kullanıcı - guilds array'ini güncelle ve banner'ı güncelle
                const existingGuildIndex = userData.guilds.findIndex(g => g.guildId === guild.id);
                
                if (existingGuildIndex >= 0) {
                    // Mevcut sunucuyu güncelle
                    userData.guilds[existingGuildIndex] = guildInfo;
                } else {
                    // Yeni sunucu ekle
                    userData.guilds.push(guildInfo);
                }
                
                // Banner'ı güncelle (varsa)
                if (banner) {
                    userData.banner = banner;
                    userData.bannerUrl = bannerUrl;
                }
                
                userData.lastGuildJoinedId = guild.id;
                userData.lastGuildJoinedAt = new Date();
                userData.lastSyncedAt = new Date();
                
                await userData.save();
            } else {
                // Kullanıcı yoksa, interval sistemi ekleyecek
                // Burada sadece temel bilgileri kaydet - BANNER DAHİL
                const newUser = new UserData({
                    discordId: userId,
                    username: member.user.username,
                    discriminator: member.user.discriminator !== '0' ? member.user.discriminator : null,
                    globalName: member.user.globalName || null,
                    avatar: member.user.avatar,
                    avatarUrl: member.user.displayAvatarURL({ dynamic: true, size: 256 }),
                    banner: banner, // Banner hash'i
                    bannerUrl: bannerUrl, // Banner URL'i
                    guilds: [guildInfo],
                    lastGuildJoinedId: guild.id,
                    lastGuildJoinedAt: new Date(),
                    lastSyncedAt: new Date(),
                    isBackedUp: false
                });
                
                await newUser.save();
                
                // Banner log
                if (bannerUrl) {
                    logger.log(`🎨 [YENİ ÜYE] ${member.user.username} (${userId}) banner yedeklendi: ${bannerUrl}`, 'info');
                }
            }
            
            // Toplam kullanıcı sayısını anlık güncelle
            try {
                const guilds = client.guilds.cache;
                const userSet = new Set();
                
                for (const g of guilds.values()) {
                    try {
                        const members = g.members.cache;
                        members.forEach(m => {
                            if (m.user && !m.user.bot) {
                                userSet.add(m.user.id);
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
                
                logger.log(`📊 [ANLIK GÜNCELLEME] Toplam sistem kullanıcı sayısı güncellendi: ${userSet.size} (Yeni üye: ${member.user.username})`, 'info');
            } catch (statsError) {
                logger.log(`⚠️ Statistics anlık güncelleme hatası: ${statsError.message}`, 'warn');
            }

        } catch (error) {
            if (logger) {
                logger.log(`Guild member add error: ${error.message}`, 'warn');
            }
        }
    }
};

