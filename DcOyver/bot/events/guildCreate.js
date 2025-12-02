const { ContainerBuilder, TextDisplayBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const GuildData = require('../../data/schemas/guild');
const settings = require('../../settings.json');

// syncGuilds fonksiyonunu global'dan al
const syncGuilds = global.syncGuilds;

const GUILD_JOIN_LOG_CHANNEL_ID = settings.GUILD_JOIN_LOG_CHANNEL_ID || '1444653303299571752';
const GUILD_JOIN_LOG_GUILD_ID = settings.GUILD_JOIN_LOG_GUILD_ID || settings.COMMENT_LOG_GUILD_ID || '1424724411457736798';
const GUILD_APPROVAL_CHANNEL_ID = settings.GUILD_APPROVAL_CHANNEL_ID || settings.GUILD_JOIN_LOG_CHANNEL_ID || '1444653303299571752';

module.exports = {
    name: 'guildCreate',
    once: false,
    async execute(guild, client) {
        const logger = global.logger;
        
        try {
            logger.log(`Bot sunucuya eklendi: ${guild.name} (${guild.id})`, "info");
            
            // Log kanalını bul
            let logChannel = null;
            try {
                const logGuild = await client.guilds.fetch(GUILD_JOIN_LOG_GUILD_ID);
                if (logGuild) {
                    logChannel = await logGuild.channels.fetch(GUILD_JOIN_LOG_CHANNEL_ID);
                    if (!logChannel) {
                        logger.log(`Log channel not found: ${GUILD_JOIN_LOG_CHANNEL_ID} in guild ${GUILD_JOIN_LOG_GUILD_ID}`, 'warn');
                    }
                } else {
                    logger.log(`Log guild not found: ${GUILD_JOIN_LOG_GUILD_ID}`, 'warn');
                }
            } catch (error) {
                logger.log(`Log guild/channel fetch error: ${error.message}`, 'error');
                logger.log(`Log guild ID: ${GUILD_JOIN_LOG_GUILD_ID}, Channel ID: ${GUILD_JOIN_LOG_CHANNEL_ID}`, 'error');
            }
            
            // Sunucu verilerini kontrol et veya oluştur
            let guildData = await GuildData.findOne({ guildId: guild.id });
            const isNewGuild = !guildData;
            
            // Owner bilgilerini Discord'dan çek
            let ownerInfo = null;
            if (guild.ownerId) {
                try {
                    const owner = await client.users.fetch(guild.ownerId);
                    ownerInfo = {
                        username: owner.username,
                        globalName: owner.globalName || null,
                        avatarURL: owner.displayAvatarURL({ dynamic: true, size: 256 })
                    };
                } catch (error) {
                    logger.log(`Owner fetch error for ${guild.ownerId}: ${error.message}`, 'warn');
                }
            }
            
            // Anlık istatistikleri Discord API'den çek
            let onlineCount = 0;
            let voiceCount = 0;
            let cameraCount = 0;
            let streamCount = 0;
            let boostCount = 0;
            
            try {
                // Sunucuyu fetch et (tam bilgiler için)
                await guild.fetch();
                
                // Üyeleri fetch et (presence bilgileri için)
                await guild.members.fetch();
                
                // Çevrimiçi üye sayısını hesapla (online, dnd, idle)
                onlineCount = guild.members.cache.filter(member => {
                    const status = member.presence?.status;
                    return status === 'online' || status === 'dnd' || status === 'idle';
                }).size;
                
                // Voice state'leri kontrol et
                guild.voiceStates.cache.forEach(voiceState => {
                    if (voiceState.channel) {
                        voiceCount++;
                        if (voiceState.selfVideo === true) {
                            cameraCount++;
                        }
                        if (voiceState.streaming === true) {
                            streamCount++;
                        }
                    }
                });
                
                // Boost sayısı
                boostCount = guild.premiumSubscriptionCount || 0;
                
                logger.log(`📊 İstatistikler çekildi: ${guild.memberCount} üye, ${onlineCount} çevrimiçi, ${voiceCount} seste (${guild.name})`, 'info');
            } catch (error) {
                logger.log(`⚠️ İstatistik çekme hatası (${guild.name}): ${error.message}`, 'warn');
            }
            
            // Otomatik davet bağlantısı oluştur (önce vanity URL kontrolü, sonra sınırsız davet linki)
            let inviteURL = null;
            try {
                // ÖNCE: Vanity URL kontrolü (özel URL varsa onu kullan)
                try {
                    const vanityData = await guild.fetchVanityData();
                    if (vanityData && vanityData.code) {
                        inviteURL = `https://discord.gg/${vanityData.code}`;
                        logger.log(`✅ Vanity URL bulundu: ${inviteURL} (${guild.name})`, 'success');
                    }
                } catch (vanityError) {
                    // Vanity URL yoksa veya erişim yoksa, normal davet linki oluştur
                    logger.log(`ℹ️ Vanity URL yok veya erişim yok, normal davet linki oluşturulacak (${guild.name})`, 'info');
                }
                
                // Eğer vanity URL yoksa, sınırsız davet linki oluştur
                if (!inviteURL) {
                    // Sunucunun kanallarını fetch et
                    await guild.channels.fetch();
                    
                    // Bot'un üye bilgisini al
                    const botMember = guild.members.me;
                    if (!botMember) {
                        logger.log(`Bot üye bilgisi alınamadı (${guild.name})`, 'warn');
                    } else {
                        // İlk yazılabilir text kanalını bul (bot'un erişim izni olan)
                        const textChannel = guild.channels.cache
                            .filter(channel => {
                                // Text channel kontrolü (type 0 = GUILD_TEXT)
                                if (channel.type !== 0) return false;
                                
                                // Bot'un izinlerini kontrol et
                                const permissions = channel.permissionsFor(botMember);
                                if (!permissions) return false;
                                
                                // ViewChannels ve CreateInstantInvite izinleri olmalı
                                return permissions.has(['ViewChannels', 'CreateInstantInvite']);
                            })
                            .first();
                        
                        if (textChannel) {
                            // Sınırsız davet linki oluştur
                            const invite = await textChannel.createInvite({
                                maxAge: 0,      // Sınırsız süre (0 = sınırsız)
                                maxUses: 0,     // Sınırsız kullanım (0 = sınırsız)
                                unique: false   // Aynı linki tekrar kullanabilir
                            });
                            
                            inviteURL = `https://discord.gg/${invite.code}`;
                            logger.log(`✅ Sınırsız davet linki oluşturuldu: ${inviteURL} (${guild.name})`, 'success');
                        } else {
                            logger.log(`⚠️ Davet linki oluşturulamadı: Yazılabilir kanal bulunamadı (${guild.name})`, 'warn');
                        }
                    }
                }
            } catch (error) {
                logger.log(`❌ Davet linki oluşturma hatası (${guild.name}): ${error.message}`, 'error');
            }
            
            // wasRemoved değişkenini başta tanımla (scope için)
            let wasRemoved = false;
            
            if (!guildData) {
                guildData = new GuildData({
                    guildId: guild.id,
                    name: guild.name,
                    memberCount: guild.memberCount,
                    onlineCount: onlineCount,
                    voiceCount: voiceCount,
                    cameraCount: cameraCount,
                    streamCount: streamCount,
                    boostCount: boostCount,
                    ownerId: guild.ownerId,
                    ownerUsername: ownerInfo?.username || null,
                    ownerGlobalName: ownerInfo?.globalName || null,
                    ownerAvatarURL: ownerInfo?.avatarURL || null,
                    guildCreatedAt: guild.createdAt,
                    iconURL: guild.iconURL(),
                    bannerURL: guild.bannerURL() || null,
                    description: 'Henüz kurulu değil',
                    inviteURL: inviteURL || null,
                    isActive: true,
                    isSetup: false,
                    // Onay sistemi - yeni sunucular pending durumunda
                    isApproved: false,
                    approvalStatus: 'pending',
                    requestedAt: new Date()
                });
                await guildData.save();
                logger.log(`✅ Yeni sunucu MongoDB'ye kaydedildi (Pending): ${guild.name} (${guild.id}) - ${guild.memberCount} üye, ${onlineCount} çevrimiçi, ${voiceCount} seste`, 'success');
            } else {
                // Mevcut sunucu - sadece bilgileri güncelle, onay durumunu koru
                wasRemoved = !guildData.isActive; // Daha önce kaldırılmış mı?
                guildData.isActive = true;
                guildData.name = guild.name;
                guildData.memberCount = guild.memberCount;
                guildData.onlineCount = onlineCount;
                guildData.voiceCount = voiceCount;
                guildData.cameraCount = cameraCount;
                guildData.streamCount = streamCount;
                guildData.boostCount = boostCount;
                guildData.iconURL = guild.iconURL();
                if (guild.bannerURL()) guildData.bannerURL = guild.bannerURL();
                if (!guildData.ownerId) guildData.ownerId = guild.ownerId;
                if (!guildData.guildCreatedAt) guildData.guildCreatedAt = guild.createdAt;
                
                // ÖNEMLİ: Onay durumu kontrolü
                // Eğer sunucu daha önce kaldırılmışsa (isActive: false) ve tekrar eklendiyse, başvuruya düşür
                const wasApproved = guildData.isApproved === true || guildData.approvalStatus === 'approved';
                const wasRejected = guildData.approvalStatus === 'rejected';
                const hasPendingStatus = guildData.approvalStatus === 'pending';
                
                if (wasRemoved) {
                    // Sunucu daha önce kaldırılmışsa - başvuruya düşür (tekrar onaylanabilir)
                    guildData.approvalStatus = 'pending';
                    guildData.isApproved = false;
                    guildData.requestedAt = new Date();
                    guildData.rejectedAt = null;
                    guildData.rejectedBy = null;
                    guildData.rejectionReason = null;
                    guildData.approvedAt = null;
                    guildData.approvedBy = null;
                    logger.log(`🔄 Kaldırılmış sunucu başvuruya düşürüldü: ${guild.name} (${guild.id})`, 'info');
                } else if (wasApproved) {
                    // Daha önce onaylanmışsa - durumu koru, ASLA değiştirme
                    guildData.approvalStatus = 'approved';
                    guildData.isApproved = true;
                    logger.log(`✅ Onay durumu korundu (Approved): ${guild.name} (${guild.id})`, 'info');
                } else if (wasRejected) {
                    // Daha önce reddedilmişse - durumu koru
                    guildData.approvalStatus = 'rejected';
                    guildData.isApproved = false;
                    logger.log(`✅ Onay durumu korundu (Rejected): ${guild.name} (${guild.id})`, 'info');
                } else if (hasPendingStatus) {
                    // Pending durumundaysa - durumu koru
                    guildData.approvalStatus = 'pending';
                    guildData.isApproved = false;
                    logger.log(`✅ Onay durumu korundu (Pending): ${guild.name} (${guild.id})`, 'info');
                } else {
                    // Hiç onay durumu yoksa (eski sunucular için) pending yap
                    guildData.approvalStatus = 'pending';
                    guildData.isApproved = false;
                    if (!guildData.requestedAt) {
                        guildData.requestedAt = new Date();
                    }
                    logger.log(`⚠️ Onay durumu yoktu, pending yapıldı: ${guild.name} (${guild.id})`, 'warn');
                }
                
                // Davet linkini güncelle (vanity URL varsa öncelik, yoksa oluşturulan link)
                if (inviteURL) {
                    // Eğer mevcut link yoksa veya vanity URL bulunduysa güncelle
                    if (!guildData.inviteURL) {
                        guildData.inviteURL = inviteURL;
                        logger.log(`✅ Davet linki eklendi: ${inviteURL} (${guild.name})`, 'success');
                    } else if (inviteURL.includes('discord.gg/') && !guildData.inviteURL.includes('discord.gg/')) {
                        // Vanity URL bulunduysa, mevcut normal linki güncelle
                        guildData.inviteURL = inviteURL;
                        logger.log(`✅ Vanity URL ile davet linki güncellendi: ${inviteURL} (${guild.name})`, 'success');
                    } else if (inviteURL.includes('discord.gg/') && guildData.inviteURL.includes('discord.gg/')) {
                        // Her iki link de vanity URL formatında, yeni olanı kullan (vanity URL öncelikli)
                        guildData.inviteURL = inviteURL;
                        logger.log(`✅ Davet linki güncellendi: ${inviteURL} (${guild.name})`, 'success');
                    }
                } else if (!guildData.inviteURL) {
                    // Eğer hiç davet linki yoksa ve oluşturulamadıysa
                    logger.log(`⚠️ Davet linki oluşturulamadı (${guild.name})`, 'warn');
                }
                
                // Eğer setup yapılmamışsa, açıklamayı "Henüz kurulu değil" olarak ayarla
                if (!guildData.isSetup && !guildData.description) {
                    guildData.description = 'Henüz kurulu değil';
                }
                
                // Owner bilgilerini güncelle
                if (ownerInfo) {
                    guildData.ownerUsername = ownerInfo.username;
                    guildData.ownerGlobalName = ownerInfo.globalName;
                    guildData.ownerAvatarURL = ownerInfo.avatarURL;
                } else if (guild.ownerId && guild.ownerId !== guildData.ownerId) {
                    // Owner değişmişse, yeni owner bilgilerini çek
                    guildData.ownerId = guild.ownerId;
                    try {
                        const owner = await client.users.fetch(guild.ownerId);
                        guildData.ownerUsername = owner.username;
                        guildData.ownerGlobalName = owner.globalName || null;
                        guildData.ownerAvatarURL = owner.displayAvatarURL({ dynamic: true, size: 256 });
                    } catch (error) {
                        logger.log(`Owner fetch error for ${guild.ownerId}: ${error.message}`, 'warn');
                    }
                }
                
                await guildData.save();
                logger.log(`Sunucu bilgileri güncellendi: ${guild.name} (${guild.id})`, 'success');
            }
            
            // Yeni sunucuya eklendiğinde TÜM üyeleri hemen çek
            try {
                logger.log(`🔄 Yeni sunucuya eklendi, üyeler çekiliyor: ${guild.name} (${guild.id})`, 'info');
                
                // Tüm üyeleri fetch et
                await guild.members.fetch({ limit: 0 }).then(() => {
                    const memberCount = guild.members.cache.size;
                    const userCount = guild.members.cache.filter(m => m.user && !m.user.bot).size;
                    logger.log(`✅ ${guild.name} (${guild.id}): ${memberCount} üye fetch edildi (${userCount} kullanıcı)`, 'success');
                }).catch((fetchError) => {
                    logger.log(`⚠️ ${guild.name} (${guild.id}) üyeleri fetch edilemedi: ${fetchError.message}`, 'warn');
                });
                
                // syncUsers interval'ını tetikle (eğer varsa)
                const syncUsersInterval = require('../intervals/syncUsers');
                if (syncUsersInterval && syncUsersInterval.execute) {
                    // Arka planda çalıştır, bekleme
                    syncUsersInterval.execute(client).catch(err => {
                        logger.log(`⚠️ syncUsers tetikleme hatası: ${err.message}`, 'warn');
                    });
                }
            } catch (userSyncError) {
                logger.log(`⚠️ Üye çekme hatası (${guild.name}): ${userSyncError.message}`, 'warn');
            }
            
            // syncGuilds çağrısı - SADECE ONAYLANMIŞ SUNUCULAR İÇİN
            // Yeni sunucular veya pending durumundaki sunucular web'e eklenmeyecek
            if (syncGuilds && typeof syncGuilds === 'function' && guildData.isApproved && guildData.approvalStatus === 'approved') {
                await syncGuilds();
            }
            
            // Onay mesajı gönder (yeni sunucular veya kaldırılmış sunucular için)
            // Normal log mesajı kaldırıldı, sadece başvuru mesajı gönderiliyor
            if (guildData.approvalStatus === 'pending' && logChannel && (isNewGuild || wasRemoved)) {
                try {
                    const approvalContainer = new ContainerBuilder();
                    
                    // Başlık
                    const titleDisplay = new TextDisplayBuilder()
                        .setContent(`🔔 **Yeni Sunucu Başvurusu**`);
                    approvalContainer.addTextDisplayComponents(titleDisplay);
                    
                    // Sunucu bilgileri
                    const owner = await client.users.fetch(guild.ownerId).catch(() => ({ tag: 'Bilinmiyor', id: guild.ownerId }));
                    const guildInfo = new TextDisplayBuilder()
                        .setContent(`**📛 Sunucu Adı:** ${guild.name}\n**🆔 Sunucu ID:** \`${guild.id}\`\n**👑 Sunucu Sahibi:** <@${guild.ownerId}> (${owner.tag || 'Bilinmiyor'})\n**👥 Üye Sayısı:** ${guild.memberCount.toLocaleString('tr-TR')}\n**📊 Çevrimiçi:** ${onlineCount.toLocaleString('tr-TR')}\n**🎤 Seste:** ${voiceCount.toLocaleString('tr-TR')}\n**🔗 Davet Linki:** ${inviteURL || 'Oluşturulamadı'}\n\n⚠️ Bu sunucu web sitesine eklenmek için onay bekliyor.\n\n🌐 **Onay/Red için:** https://dcoyver.com/basvuru-paneli`);
                    approvalContainer.addTextDisplayComponents(guildInfo);
                    
                    // Sunucu icon'u bilgisi
                    if (guild.iconURL()) {
                        const iconDisplay = new TextDisplayBuilder()
                            .setContent(`**🖼️ Sunucu İkonu:**\n${guild.iconURL({ dynamic: true, size: 256 })}`);
                        approvalContainer.addTextDisplayComponents(iconDisplay);
                    }
                    
                    // Butonlar kaldırıldı - Sadece web'den onay/red yapılacak
                    // Web'den onay/red için: https://dcoyver.com/basvuru-paneli
                    
                    // Zaman bilgisi
                    const today = new Date();
                    const timeStr = today.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                    const dateStr = today.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const footerDisplay = new TextDisplayBuilder()
                        .setContent(`🕐 **Tarih:** ${dateStr} • ${timeStr}`);
                    approvalContainer.addTextDisplayComponents(footerDisplay);
                    
                    const approvalMessage = await logChannel.send({
                        components: [approvalContainer],
                        flags: [MessageFlags.IsComponentsV2]
                    });
                    
                    // Mesaj ID'sini kaydet
                    guildData.approvalMessageId = approvalMessage.id;
                    await guildData.save();
                    
                    logger.log(`✅ Onay mesajı gönderildi: ${guild.name} (${guild.id}) - Message ID: ${approvalMessage.id}`, 'success');
                } catch (approvalError) {
                    logger.log(`❌ Onay mesajı gönderme hatası: ${approvalError.message}`, 'error');
                }
            }
            
        } catch (error) {
            logger.log(`Guild create error: ${error.message}`, "error");
            console.error(error);
        }
    }
};

