const UserData = require('../../data/schemas/user');
const logger = global.logger;

module.exports = {
    name: 'userUpdate',
    
    async execute(oldUser, newUser, client) {
        try {
            if (!newUser || newUser.bot) return;

            const userId = newUser.id;

            // Avatar ve banner URL'lerini oluştur
            const avatarUrl = newUser.displayAvatarURL({ dynamic: true, size: 256 });
            // Banner URL'ini 2048 size ile oluştur (yüksek kalite)
            const bannerUrl = newUser.banner ? 
                `https://cdn.discordapp.com/banners/${newUser.id}/${newUser.banner}.${newUser.banner.startsWith('a_') ? 'gif' : 'png'}?size=2048` : 
                null;

            // Nitro rozetleri
            const flags = newUser.flags?.toArray() || [];
            const nitroBadges = flags.filter(flag => 
                flag.includes('PREMIUM') || 
                flag.includes('NITRO') ||
                flag.includes('BOOST')
            );

            // Güncelleme objesi
            const updateData = {
                username: newUser.username,
                discriminator: newUser.discriminator !== '0' ? newUser.discriminator : null,
                globalName: newUser.globalName || null,
                avatar: newUser.avatar,
                avatarUrl: avatarUrl,
                banner: newUser.banner || null,
                bannerUrl: bannerUrl,
                nitroBadges: nitroBadges,
                lastSyncedAt: new Date()
            };

            // Eğer avatar değiştiyse
            if (oldUser && oldUser.avatar !== newUser.avatar) {
                updateData.avatar = newUser.avatar;
                updateData.avatarUrl = avatarUrl;
            }

            // Eğer banner değiştiyse
            if (oldUser && oldUser.banner !== newUser.banner) {
                updateData.banner = newUser.banner || null;
                updateData.bannerUrl = bannerUrl;
                
                // Banner değişikliğini logla
                if (bannerUrl) {
                    logger.log(`🎨 [EVENT] ${newUser.username} (${userId}) banner güncellendi: ${bannerUrl}`, 'info');
                } else {
                    logger.log(`🎨 [EVENT] ${newUser.username} (${userId}) banner kaldırıldı`, 'info');
                }
            }

            // MongoDB'yi güncelle
            const updatedUser = await UserData.findOneAndUpdate(
                { discordId: userId },
                {
                    $set: updateData
                },
                { upsert: false, new: true } // Sadece mevcut kullanıcıları güncelle
            );
            
            // Banner değişikliği varsa ve kullanıcı bulunduysa, Web sunucusuna bildir
            if (updatedUser && oldUser && oldUser.banner !== newUser.banner) {
                try {
                    // Web sunucusuna HTTP POST isteği gönder
                    const axios = require('axios');
                    const settings = require('../../../settings.json');
                    const webServerUrl = process.env.WEB_SERVER_URL || settings.WEB_SERVER_URL || 'http://localhost:5000';
                    
                    await axios.post(`${webServerUrl}/api/banner-update`, {
                        userId: userId,
                        username: newUser.username,
                        bannerUrl: bannerUrl
                    }, {
                        timeout: 2000 // 2 saniye timeout
                    }).catch(() => {
                        // Web sunucusu yoksa sessizce devam et
                    });
                } catch (httpError) {
                    // HTTP hatası olsa bile devam et
                }
            }

        } catch (error) {
            if (logger) {
                logger.log(`User update error: ${error.message}`, 'warn');
            }
        }
    }
};

