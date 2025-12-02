const GuildData = require('../../data/schemas/guild');
const UserData = require('../../data/schemas/user');
const logger = global.logger;

module.exports = {
    name: 'voiceStateUpdate',
    
    async execute(oldState, newState, client) {
        try {
            const guild = newState.guild || oldState.guild;
            const member = newState.member || oldState?.member;
            
            // Kullanıcı yedekleme - Ses kanalı bilgilerini güncelle
            if (member && member.user && !member.user.bot) {
                try {
                    const userId = member.user.id;
                    const voiceChannel = newState.channel;
                    
                    if (voiceChannel) {
                        // Ses kanalına girdi
                        await UserData.findOneAndUpdate(
                            { discordId: userId },
                            {
                                $set: {
                                    lastVoiceGuildId: guild.id,
                                    lastVoiceChannelId: voiceChannel.id,
                                    lastVoiceChannelName: voiceChannel.name,
                                    lastVoiceJoinedAt: new Date(),
                                    lastSyncedAt: new Date()
                                }
                            },
                            { upsert: false }
                        );
                    } else if (oldState?.channel && !newState.channel) {
                        // Ses kanalından çıktı
                        await UserData.findOneAndUpdate(
                            { discordId: userId },
                            {
                                $set: {
                                    lastVoiceLeftAt: new Date(),
                                    lastSyncedAt: new Date()
                                }
                            },
                            { upsert: false }
                        );
                    }
                } catch (error) {
                    // Sessizce devam et
                }
            }
            
            // Aktif sunucular için güncelle (hem setup yapılmış hem yapılmamış)
            const guildData = await GuildData.findOne({ 
                guildId: guild.id, 
                isActive: true 
            }).lean();
            
            if (!guildData) return;

            // Voice state'leri kontrol et ve say
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

            // MongoDB'yi güncelle
            await GuildData.findOneAndUpdate(
                { guildId: guild.id },
                { 
                    voiceCount: voiceMembers,
                    cameraCount: cameraMembers,
                    streamCount: streamMembers
                }
            );

        } catch (error) {
            if (logger) {
                logger.log(`Voice state update error: ${error.message}`, 'error');
            }
        }
    }
};
