const UserNotification = require('../../data/schemas/userNotification');
const Vote = require('../../data/schemas/vote');
const GuildData = require('../../data/schemas/guild');

module.exports = {
    name: 'sendVoteNotifications',
    interval: 60000, // 1 dakika
    
    async execute(client) {
        try {
            // Bildirim aktif olan tüm kullanıcı-guild çiftlerini al
            const notifications = await UserNotification.find({ notificationEnabled: true });
            
            for (const notification of notifications) {
                try {
                    // Kullanıcının son oyunu bul
                    const lastVote = await Vote.findOne({
                        userId: notification.userId,
                        guildId: notification.guildId
                    }).sort({ votedAt: -1 });

                    if (!lastVote) {
                        continue; // Hiç oy vermemiş, bildirim gönderme
                    }

                    // 12 saat geçti mi kontrol et
                    const now = new Date();
                    const timeDiff = now - lastVote.votedAt;
                    const hoursDiff = timeDiff / (1000 * 60 * 60);

                    // 12 saat geçtiyse ve daha önce bildirim gönderilmediyse veya son bildirim 12 saatten önce gönderildiyse
                    if (hoursDiff >= 12) {
                        // Son bildirim ne zaman gönderildi kontrol et
                        const lastNotificationTime = notification.lastNotificationSent;
                        const voteTime = lastVote.votedAt.getTime();
                        const twelveHoursAfterVote = voteTime + (12 * 60 * 60 * 1000);

                        // Eğer son bildirim, oy verme zamanından 12 saat sonra gönderilmediyse veya hiç gönderilmediyse
                        if (!lastNotificationTime || lastNotificationTime.getTime() < twelveHoursAfterVote) {
                            // Sunucu bilgisini al
                            const guildData = await GuildData.findOne({ guildId: notification.guildId });
                            if (!guildData) continue;

                            // Kullanıcıyı bul
                            const user = await client.users.fetch(notification.userId).catch(() => null);
                            if (!user) continue;

                            // DM gönder
                            try {
                                await user.send({
                                    content: `🔔 **Oy Verme Bildirimi**\n\nSüren doldu! Oy verebilirsin.\n\n**Sunucu:** ${guildData.name}`
                                });

                                // Son bildirim zamanını güncelle (oy verme zamanından 12 saat sonra)
                                notification.lastNotificationSent = new Date(twelveHoursAfterVote);
                                await notification.save();

                                const logger = require('../../lib/logger');
                                logger.log(`Vote notification sent to ${user.username} for guild ${guildData.name}`, 'info');
                            } catch (dmError) {
                                // DM gönderilemedi (kullanıcı DM'leri kapalı olabilir)
                                // Sessizce devam et
                            }
                        }
                    }
                } catch (error) {
                    // Hata olsa bile devam et
                    continue;
                }
            }
        } catch (error) {
            const logger = require('../../lib/logger');
            logger.log(`Vote notification interval error: ${error.message}`, 'error');
        }
    }
};

