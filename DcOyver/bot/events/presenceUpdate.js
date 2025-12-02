const UserData = require('../../data/schemas/user');
const logger = global.logger;

module.exports = {
    name: 'presenceUpdate',
    
    async execute(oldPresence, newPresence, client) {
        try {
            const member = newPresence.member || oldPresence?.member;
            if (!member || !member.user || member.user.bot) return;

            const userId = member.user.id;
            const status = newPresence?.status || oldPresence?.status || 'offline';

            // Custom status
            let customStatus = null;
            const customActivity = newPresence?.activities?.find(a => a.type === 4) || 
                                  oldPresence?.activities?.find(a => a.type === 4);
            if (customActivity && customActivity.state) {
                customStatus = customActivity.state;
            }

            // Activities - Düzgün formatla ve type'ı Number'a cast et
            let activities = [];
            if (newPresence?.activities && newPresence.activities.length > 0) {
                activities = newPresence.activities.map(activity => {
                    try {
                        return {
                            name: activity.name || null,
                            type: typeof activity.type === 'number' ? activity.type : (parseInt(activity.type) || 0),
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
                        if (logger) {
                            logger.log(`⚠️ Activity parse hatası (${userId}): ${activityError.message}`, 'warn');
                        }
                        return null;
                    }
                }).filter(a => a !== null); // null değerleri filtrele
            }

            // Nitro bilgileri
            let hasNitro = false;
            let nitroType = null;
            if (member.premiumSince) {
                hasNitro = true;
                nitroType = 'boost';
            }

            // Nitro rozetleri
            const flags = member.user.flags?.toArray() || [];
            const nitroBadges = flags.filter(flag => 
                flag.includes('PREMIUM') || 
                flag.includes('NITRO') ||
                flag.includes('BOOST')
            );

            // MongoDB'yi güncelle - Hata yönetimi ile
            try {
                await UserData.findOneAndUpdate(
                    { discordId: userId },
                    {
                        $set: {
                            status: status,
                            customStatus: customStatus,
                            activities: activities || [], // Boş array fallback
                            hasNitro: hasNitro,
                            nitroType: nitroType,
                            nitroBadges: nitroBadges || [],
                            lastSyncedAt: new Date()
                        }
                    },
                    { upsert: false } // Sadece mevcut kullanıcıları güncelle
                );
            } catch (dbError) {
                // Activities hatası varsa, activities'i boş array yap ve tekrar dene - sessizce işle (log spam'ini azalt)
                if (dbError.message && (dbError.message.includes('activities') || dbError.message.includes('Cast'))) {
                    // Log spam'ini azalt - sadece önemli durumlarda logla
                    // if (logger) {
                    //     logger.log(`⚠️ Activities cast hatası (${userId}), activities temizleniyor...`, 'warn');
                    // }
                    try {
                        await UserData.findOneAndUpdate(
                            { discordId: userId },
                            {
                                $set: {
                                    status: status,
                                    customStatus: customStatus,
                                    activities: [], // Boş array
                                    hasNitro: hasNitro,
                                    nitroType: nitroType,
                                    nitroBadges: nitroBadges || [],
                                    lastSyncedAt: new Date()
                                }
                            },
                            { upsert: false }
                        );
                    } catch (retryError) {
                        if (logger) {
                            logger.log(`❌ Activities temizleme hatası (${userId}): ${retryError.message}`, 'error');
                        }
                    }
                } else {
                    throw dbError; // Diğer hataları fırlat
                }
            }

        } catch (error) {
            if (logger) {
                logger.log(`Presence update error: ${error.message}`, 'warn');
            }
        }
    }
};

