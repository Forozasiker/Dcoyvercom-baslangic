const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const GuildData = require('../../data/schemas/guild');
const Vote = require('../../data/schemas/vote');
const Comment = require('../../data/schemas/comment');
const UserNotification = require('../../data/schemas/userNotification');
const settings = require('../../settings.json');

const GUILD_LEAVE_LOG_CHANNEL_ID = settings.GUILD_LEAVE_LOG_CHANNEL_ID || '1444689636332015683';
const GUILD_LEAVE_LOG_GUILD_ID = settings.GUILD_LEAVE_LOG_GUILD_ID || settings.COMMENT_LOG_GUILD_ID || '1424724411457736798';

module.exports = {
    name: 'guildDelete',
    once: false,
    async execute(guild, client) {
        const logger = global.logger;
        
        try {
            logger.log(`Bot sunucudan atıldı: ${guild.name} (${guild.id})`, "info");
            
            // Sunucu verilerini bul
            const guildData = await GuildData.findOne({ guildId: guild.id });
            
            // Log kanalını bul
            let logChannel = null;
            try {
                const logGuild = await client.guilds.fetch(GUILD_LEAVE_LOG_GUILD_ID);
                if (logGuild) {
                    logChannel = await logGuild.channels.fetch(GUILD_LEAVE_LOG_CHANNEL_ID);
                    if (!logChannel) {
                        logger.log(`Log channel not found: ${GUILD_LEAVE_LOG_CHANNEL_ID} in guild ${GUILD_LEAVE_LOG_GUILD_ID}`, 'warn');
                    }
                } else {
                    logger.log(`Log guild not found: ${GUILD_LEAVE_LOG_GUILD_ID}`, 'warn');
                }
            } catch (error) {
                logger.log(`Log guild/channel fetch error: ${error.message}`, 'error');
                logger.log(`Log guild ID: ${GUILD_LEAVE_LOG_GUILD_ID}, Channel ID: ${GUILD_LEAVE_LOG_CHANNEL_ID}`, 'error');
            }
            
            let deletedVotesCount = 0;
            let deletedCommentsCount = 0;
            let deletedNotificationsCount = 0;
            let hadSetup = false;
            let totalVotes = 0;
            let memberCount = 0;
            
            if (guildData) {
                hadSetup = guildData.isSetup || false;
                totalVotes = guildData.totalVotes || 0;
                memberCount = guildData.memberCount || 0;
                
                // Sunucuya ait tüm oyları sil
                const deletedVotes = await Vote.deleteMany({ guildId: guild.id });
                deletedVotesCount = deletedVotes.deletedCount;
                logger.log(`${deletedVotesCount} oy silindi (Sunucu: ${guild.name})`, "info");
                
                // Sunucuya ait tüm yorumları sil
                const deletedComments = await Comment.deleteMany({ guildId: guild.id });
                deletedCommentsCount = deletedComments.deletedCount;
                logger.log(`${deletedCommentsCount} yorum silindi (Sunucu: ${guild.name})`, "info");
                
                // Sunucuya ait tüm bildirim ayarlarını sil
                const deletedNotifications = await UserNotification.deleteMany({ guildId: guild.id });
                deletedNotificationsCount = deletedNotifications.deletedCount;
                logger.log(`${deletedNotificationsCount} bildirim ayarı silindi (Sunucu: ${guild.name})`, "info");
                
                // Sunucu kaydını sil
                await GuildData.deleteOne({ guildId: guild.id });
                logger.log(`Sunucu verisi silindi: ${guild.name} (${guild.id})`, "success");
            } else {
                logger.log(`Sunucu verisi bulunamadı: ${guild.id}`, "warn");
            }
            
            // Log mesajı gönder
            if (logChannel) {
                try {
                    const container = new ContainerBuilder();
                    
                    // Başlık
                    const titleDisplay = new TextDisplayBuilder()
                        .setContent(`<a:tagged1:1438758589002154036> **Bot Sunucudan Atıldı**`);
                    container.addTextDisplayComponents(titleDisplay);
                    
                    // Sunucu sahibi bilgisi
                    let ownerTag = 'Bilinmiyor';
                    try {
                        const owner = await client.users.fetch(guild.ownerId).catch(() => null);
                        if (owner) ownerTag = owner.tag;
                    } catch (e) {}
                    
                    // Sunucu bilgileri
                    const guildInfo = new TextDisplayBuilder()
                        .setContent(`**📛 Sunucu Adı:** ${guild.name}\n**🆔 Sunucu ID:** \`${guild.id}\`\n**👑 Sunucu Sahibi:** <@${guild.ownerId}> (${ownerTag})\n**👥 Üye Sayısı:** ${memberCount > 0 ? memberCount.toLocaleString('tr-TR') : guild.memberCount.toLocaleString('tr-TR')}\n**⚙️ Setup Durumu:** ${hadSetup ? '✅ Setup Yapılmış' : '❌ Setup Yapılmamış'}`);
                    container.addTextDisplayComponents(guildInfo);
                    
                    // Silinen veriler
                    const deletedInfo = new TextDisplayBuilder()
                        .setContent(`**🗑️ Silinen Veriler:**\n**❤️ Toplam Oy:** ${totalVotes.toLocaleString('tr-TR')} (${deletedVotesCount} oy kaydı silindi)\n**💬 Yorumlar:** ${deletedCommentsCount} yorum silindi\n**🔔 Bildirimler:** ${deletedNotificationsCount} bildirim ayarı silindi`);
                    container.addTextDisplayComponents(deletedInfo);
                    
                    // Sunucu icon'u bilgisi
                    if (guild.iconURL()) {
                        const iconDisplay = new TextDisplayBuilder()
                            .setContent(`**🖼️ Sunucu İkonu:**\n${guild.iconURL({ dynamic: true, size: 256 })}`);
                        container.addTextDisplayComponents(iconDisplay);
                    }
                    
                    // Zaman bilgisi
                    const today = new Date();
                    const timeStr = today.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                    const dateStr = today.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const footerDisplay = new TextDisplayBuilder()
                        .setContent(`🕐 **Tarih:** ${dateStr} • ${timeStr}`);
                    container.addTextDisplayComponents(footerDisplay);
                    
                    await logChannel.send({
                        components: [container],
                        flags: [MessageFlags.IsComponentsV2]
                    });
                    
                    logger.log(`Guild delete log sent to channel ${GUILD_LEAVE_LOG_CHANNEL_ID}`, 'success');
                } catch (logError) {
                    logger.log(`Guild delete log error: ${logError.message}`, 'error');
                    logger.log(`Guild delete log error stack: ${logError.stack}`, 'error');
                }
            } else {
                logger.log(`Log channel not found: ${GUILD_LEAVE_LOG_CHANNEL_ID}`, 'warn');
            }
            
        } catch (error) {
            logger.log(`Guild delete error: ${error.message}`, "error");
            console.error(error);
        }
    }
};

