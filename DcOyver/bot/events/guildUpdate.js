const GuildData = require('../../data/schemas/guild');
const logger = global.logger;

module.exports = {
    name: 'guildUpdate',
    once: false,
    async execute(oldGuild, newGuild) {
        const client = newGuild.client;
        try {
            // Sadece aktif sunucular için kontrol et
            const guildData = await GuildData.findOne({ 
                guildId: newGuild.id, 
                isActive: true 
            });
            
            if (!guildData) return;
            
            // Vanity URL ve davet linki kontrolü
            let inviteURL = guildData.inviteURL || null;
            let shouldUpdate = false;
            
            try {
                // ÖNCE: Vanity URL kontrolü (özel URL varsa onu kullan)
                const vanityData = await newGuild.fetchVanityData();
                if (vanityData && vanityData.code) {
                    const newVanityURL = `https://discord.gg/${vanityData.code}`;
                    // Eğer vanity URL değişmişse veya yoksa güncelle
                    if (inviteURL !== newVanityURL) {
                        inviteURL = newVanityURL;
                        shouldUpdate = true;
                        logger.log(`✅ Vanity URL bulundu/güncellendi: ${inviteURL} (${newGuild.name})`, 'success');
                    }
                }
            } catch (vanityError) {
                // Vanity URL yoksa veya erişim yoksa, mevcut linki kontrol et
                // Eğer davet linki yoksa ve setup yapılmamışsa, oluştur
                if (!inviteURL && !guildData.isSetup) {
                    try {
                        await newGuild.channels.fetch();
                        const botMember = newGuild.members.me;
                        if (botMember) {
                            const textChannel = newGuild.channels.cache
                                .filter(channel => {
                                    if (channel.type !== 0) return false;
                                    const permissions = channel.permissionsFor(botMember);
                                    if (!permissions) return false;
                                    return permissions.has(['ViewChannels', 'CreateInstantInvite']);
                                })
                                .first();
                            
                            if (textChannel) {
                                const invite = await textChannel.createInvite({
                                    maxAge: 0,      // Sınırsız süre
                                    maxUses: 0,     // Sınırsız kullanım
                                    unique: false
                                });
                                inviteURL = `https://discord.gg/${invite.code}`;
                                shouldUpdate = true;
                                logger.log(`✅ Davet linki oluşturuldu: ${inviteURL} (${newGuild.name})`, 'success');
                            }
                        }
                    } catch (inviteError) {
                        logger.log(`⚠️ Davet linki oluşturulamadı (${newGuild.name}): ${inviteError.message}`, 'warn');
                    }
                }
            }
            
            // Sunucu bilgilerini güncelle
            const updateData = {
                name: newGuild.name,
                iconURL: newGuild.iconURL(),
                bannerURL: newGuild.bannerURL() || null,
                memberCount: newGuild.memberCount
            };
            
            // Davet linkini güncelle (varsa)
            if (inviteURL && shouldUpdate) {
                updateData.inviteURL = inviteURL;
            }
            
            // Sadece değişiklik varsa güncelle
            if (shouldUpdate || 
                guildData.name !== newGuild.name || 
                guildData.memberCount !== newGuild.memberCount ||
                guildData.iconURL !== newGuild.iconURL() ||
                (newGuild.bannerURL() && guildData.bannerURL !== newGuild.bannerURL())) {
                await GuildData.findOneAndUpdate(
                    { guildId: newGuild.id },
                    updateData
                );
                logger.log(`📝 Sunucu bilgileri güncellendi: ${newGuild.name} (${newGuild.id})`, 'info');
            }
            
        } catch (error) {
            if (logger) {
                logger.log(`Guild update error: ${error.message}`, 'error');
            }
        }
    }
};

