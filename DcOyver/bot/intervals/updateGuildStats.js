const GuildData = require('../../data/schemas/guild');
const logger = global.logger;

module.exports = {
    name: 'updateGuildStats',
    interval: 1 * 60 * 1000, // 1 dakika
    
    async execute(client) {
        try {
            // Hem setup yapılmış hem de yapılmamış aktif sunucuları güncelle
            const guilds = await GuildData.find({ isActive: true }).lean();
            
            let updated = 0;
            let failed = 0;

            for (const guildData of guilds) {
                try {
                    const guild = client.guilds.cache.get(guildData.guildId);
                    
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
                    let voiceMutedMembers = 0;
                    let voiceUnmutedMembers = 0;
                    let voiceDeafenedMembers = 0;
                    let voiceUndeafenedMembers = 0;
                    let cameraMembers = 0;
                    let streamMembers = 0;
                    
                    // Voice state'leri doğru şekilde çek - Tüm voice kanallarını kontrol et
                    try {
                        // Tüm voice kanallarını al (type 2 = Voice Channel, type 13 = Stage Channel)
                        const voiceChannels = guild.channels.cache.filter(ch => ch.type === 2 || ch.type === 13);
                        
                        // Her voice kanalındaki üyeleri kontrol et
                        for (const channel of voiceChannels.values()) {
                            try {
                                // Kanaldaki tüm üyeleri al (cache'den)
                                const members = channel.members;
                                
                                for (const member of members.values()) {
                                    // Bot'ları sayma
                                    if (member.user.bot) continue;
                                    
                                    const voiceState = member.voice;
                                    if (voiceState && voiceState.channel && voiceState.channel.id === channel.id) {
                                        voiceMembers++;
                                        
                                        // Mikrofon durumu - hem server mute hem de self mute kontrol et
                                        // Mute: Server tarafından mute edilmiş
                                        // SelfMute: Kullanıcı kendi kendini mute etmiş
                                        const isMuted = voiceState.mute === true || voiceState.selfMute === true;
                                        if (isMuted) {
                                            voiceMutedMembers++;
                                        } else {
                                            voiceUnmutedMembers++;
                                        }
                                        
                                        // Kulaklık durumu - hem server deaf hem de self deaf kontrol et
                                        // Deaf: Server tarafından deaf edilmiş
                                        // SelfDeaf: Kullanıcı kendi kendini deaf etmiş
                                        const isDeafened = voiceState.deaf === true || voiceState.selfDeaf === true;
                                        if (isDeafened) {
                                            voiceDeafenedMembers++;
                                        } else {
                                            voiceUndeafenedMembers++;
                                        }
                                        
                                        // Video durumu (kamera açık mı)
                                        if (voiceState.selfVideo === true) {
                                            cameraMembers++;
                                        }
                                        
                                        // Stream durumu (yayın yapıyor mu)
                                        if (voiceState.streaming === true) {
                                            streamMembers++;
                                        }
                                    }
                                }
                            } catch (channelError) {
                                // Kanal hatası, devam et
                                continue;
                            }
                        }
                        
                        // Eğer voice kanallarından hiç üye bulunamadıysa, voiceStates.cache'i kontrol et (fallback)
                        if (voiceMembers === 0) {
                            guild.voiceStates.cache.forEach(voiceState => {
                                if (voiceState.channel && voiceState.member && !voiceState.member.user.bot) {
                                    voiceMembers++;
                                    
                                    const isMuted = voiceState.mute === true || voiceState.selfMute === true;
                                    if (isMuted) {
                                        voiceMutedMembers++;
                                    } else {
                                        voiceUnmutedMembers++;
                                    }
                                    
                                    const isDeafened = voiceState.deaf === true || voiceState.selfDeaf === true;
                                    if (isDeafened) {
                                        voiceDeafenedMembers++;
                                    } else {
                                        voiceUndeafenedMembers++;
                                    }
                                    
                                    if (voiceState.selfVideo === true) {
                                        cameraMembers++;
                                    }
                                    
                                    if (voiceState.streaming === true) {
                                        streamMembers++;
                                    }
                                }
                            });
                        }
                    } catch (voiceError) {
                        logger.log(`Voice state fetch error for ${guild.name}: ${voiceError.message}`, 'warn');
                        // Hata durumunda sıfır değerlerle devam et
                    }

                    // Get boost count
                    const boostCount = guild.premiumSubscriptionCount || 0;

                    // Vanity URL ve davet linki kontrolü (önce vanity URL, sonra sınırsız davet linki)
                    let inviteURL = guildData.inviteURL || null;
                    let shouldUpdateInvite = false;
                    
                    try {
                        // ÖNCE: Vanity URL kontrolü (özel URL varsa onu kullan)
                        const vanityData = await guild.fetchVanityData();
                        if (vanityData && vanityData.code) {
                            const newVanityURL = `https://discord.gg/${vanityData.code}`;
                            // Eğer vanity URL değişmişse veya yoksa güncelle
                            if (inviteURL !== newVanityURL) {
                                inviteURL = newVanityURL;
                                shouldUpdateInvite = true;
                                logger.log(`✅ Vanity URL bulundu/güncellendi: ${inviteURL} (${guild.name})`, 'info');
                            }
                        }
                    } catch (vanityError) {
                        // Vanity URL yoksa veya erişim yoksa, mevcut linki kontrol et
                        // Eğer davet linki yoksa (hem setup yapılmış hem yapılmamış sunucular için), oluştur
                        if (!inviteURL) {
                            try {
                                await guild.channels.fetch();
                                const botMember = guild.members.me;
                                if (botMember) {
                                    const textChannel = guild.channels.cache
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
                                        shouldUpdateInvite = true;
                                        logger.log(`✅ Davet linki oluşturuldu: ${inviteURL} (${guild.name})`, 'info');
                                    } else {
                                        logger.log(`⚠️ Davet linki oluşturulamadı: Yazılabilir kanal bulunamadı (${guild.name})`, 'warn');
                                    }
                                }
                            } catch (inviteError) {
                                logger.log(`⚠️ Davet linki oluşturulamadı (${guild.name}): ${inviteError.message}`, 'warn');
                            }
                        }
                    }

                    // Update database
                    const updateData = {
                        name: guild.name,
                        memberCount: guild.memberCount,
                        onlineCount: onlineMembers,
                        voiceCount: voiceMembers,
                        voiceMutedCount: voiceMutedMembers,
                        voiceUnmutedCount: voiceUnmutedMembers,
                        voiceDeafenedCount: voiceDeafenedMembers,
                        voiceUndeafenedCount: voiceUndeafenedMembers,
                        cameraCount: cameraMembers,
                        streamCount: streamMembers,
                        boostCount: boostCount,
                        iconURL: guild.iconURL(),
                        bannerURL: guild.bannerURL()
                    };
                    
                    // Davet linkini güncelle (varsa ve değişmişse)
                    if (inviteURL && shouldUpdateInvite) {
                        updateData.inviteURL = inviteURL;
                    }
                    
                    await GuildData.findOneAndUpdate(
                        { guildId: guild.id },
                        updateData
                    );

                    updated++;
                    logger.log(`Updated stats for '${guild.name}': ${onlineMembers} online / ${voiceMembers} voice / ${voiceMutedMembers} muted / ${voiceUnmutedMembers} unmuted / ${voiceDeafenedMembers} deafened / ${voiceUndeafenedMembers} undeafened / ${cameraMembers} camera / ${streamMembers} stream / ${guild.memberCount} members`, 'info');

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
};
