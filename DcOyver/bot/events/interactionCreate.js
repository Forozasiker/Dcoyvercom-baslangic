const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, MessageFlags, SectionBuilder, ThumbnailBuilder, SeparatorBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, InteractionType } = require('discord.js');
const GuildData = require('../../data/schemas/guild');
const settings = require('../../settings.json');

const MAX_TEXTBLOCK_LENGTH = 1_900;

// Chunked content ekleme fonksiyonu - örnek koddan
function addChunkedContent(container, text) {
    if (!text) return;
    const lines = text.split("\n");
    let chunk = "";
    const flush = () => {
        if (!chunk) return;
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(chunk));
        chunk = "";
    };
    for (const line of lines) {
        const candidate = chunk ? `${chunk}\n${line}` : line;
        if (candidate.length > MAX_TEXTBLOCK_LENGTH) {
            flush();
            chunk = line.length > MAX_TEXTBLOCK_LENGTH ? line.slice(0, MAX_TEXTBLOCK_LENGTH - 1) + "…" : line;
            flush();
        } else {
            chunk = candidate;
        }
    }
    flush();
}

// Oy verme panelini güncelle - MongoDB'den direkt veri çek - HER ZAMAN YENİ TASARIM (ÖRNEK.js stilinde)
async function updateVoteEmbed(guild, channel, client) {
    try {
        const logger = require('../../lib/logger');
        // Log spam'ini azalt - sadece debug modunda göster
        // logger.log(`updateVoteEmbed called for guild ${guild.id} - Using NEW DESIGN (ÖRNEK.js style)`, 'info');
        
        const Vote = require('../../data/schemas/vote');
        const GuildData = require('../../data/schemas/guild');
        
        // GuildData'dan panel mesaj ID'sini al - MongoDB'den direkt
        const guildData = await GuildData.findOne({ guildId: guild.id }).lean();
        
        // Panel mesaj ID'si varsa direkt güncelle
        if (guildData && guildData.votePanelMessageId && guildData.votePanelChannelId) {
            try {
                const panelChannel = guild.channels.cache.get(guildData.votePanelChannelId);
                if (!panelChannel) {
                    // Log spam'ini azalt - sadece önemli hatalar için logla
                    // logger.log(`Panel channel not found for guild ${guild.id} (channelId: ${guildData.votePanelChannelId})`, 'warn');
                    return false;
                }
                
                const panelMessage = await panelChannel.messages.fetch(guildData.votePanelMessageId).catch((err) => {
                    // Log spam'ini azalt - sadece önemli hatalar için logla
                    // logger.log(`Panel message not found for guild ${guild.id} (messageId: ${guildData.votePanelMessageId}): ${err.message}`, 'warn');
                    return null;
                });
                if (!panelMessage) {
                    logger.log(`Panel message is null for guild ${guild.id}`, 'warn');
                    return false;
                }
                
                // Tüm oyları al ve kullanıcı bazında grupla (her oy verme işlemi ayrı kayıt)
                const allVotes = await Vote.find({ guildId: guild.id }).lean();

                // Toplam oy sayısı (tüm oy verme işlemleri)
                const totalVotes = allVotes.length;

                // Oy verenleri formatla
                let votersList = '';
                let userVoteCounts = {}; // if bloğunun dışında tanımla
                
                if (allVotes.length > 0) {
                    // Her kullanıcının toplam oy sayısını hesapla (tüm oyları say)
                    for (const vote of allVotes) {
                        if (!userVoteCounts[vote.userId]) {
                            userVoteCounts[vote.userId] = 0;
                        }
                        userVoteCounts[vote.userId]++;
                    }

                    // Kullanıcıları oy sayısına göre sırala
                    const sortedVoters = Object.entries(userVoteCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 20);

                    for (let i = 0; i < sortedVoters.length; i++) {
                        const [userId, voteCount] = sortedVoters[i];
                        try {
                            const user = await client.users.fetch(userId);
                            votersList += `<:bewrqturuncu:1438723245321748500> **${user.username}** \`${voteCount} oy\`\n`;
                        } catch {
                            votersList += `<:bewrqturuncu:1438723245321748500> **Bilinmeyen Kullanıcı** \`${voteCount} oy\`\n`;
                        }
                    }
                } else {
                    votersList = 'Henüz kimse oy vermedi.';
                }

                const settings = require('../../settings.json');

                // Butonları koru
                let buttonRow = null;
                for (const componentRow of panelMessage.components) {
                    if (componentRow.components) {
                        for (const comp of componentRow.components) {
                            if (comp.type === 2 && comp.custom_id === 'vote_start') {
                                buttonRow = componentRow;
                                break;
                            }
                        }
                    }
                    if (buttonRow) break;
                }

                // Sunucu ikonu URL'i - yüksek kalite
                const guildIcon = guild.iconURL({ dynamic: true, size: 512, extension: 'png' }) || 
                                 guild.iconURL({ dynamic: true, size: 256 }) || 
                                 'https://cdn.discordapp.com/attachments/1206385840041762829/1206385840041762829/discord-logo.png';
                
                // Discord emoji URL'leri (eğer sunucuda varsa)
                const getEmojiURL = (emojiId) => {
                    if (!emojiId) return null;
                    return `https://cdn.discordapp.com/emojis/${emojiId}.png?size=256`;
                };
                
                // Sunucu emojilerini kontrol et
                const trophyEmoji = guild.emojis.cache.find(e => e.name?.toLowerCase().includes('trophy') || e.name?.toLowerCase().includes('kupa'))?.id;
                const bookEmoji = guild.emojis.cache.find(e => e.name?.toLowerCase().includes('book') || e.name?.toLowerCase().includes('kitap'))?.id;

                // Container oluştur - ÖRNEK.js stilinde
                const container = new ContainerBuilder()
                    .setAccentColor(0x5865F2) // Discord mavisi
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`### <a:tagged1:1438758589002154036> ${guild.name} - Oy Verme Paneli`)
                    )
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    '## <a:imek:1445522998932017162> Sunucu Bilgileri\n' +
                                    `<:botopen:1445522650028834816>  **Sunucu:** ${guild.name}\n` +
                                    `<a:tagged1:1438758589002154036> **Toplam Oy:** ${totalVotes}\n` +
                                    `<a:icon:1438723312250388531> **Sunucu Sayfası:** [Tıkla](${settings.WEBSITE_URL}/sunucu/${guild.id})`
                                )
                            )
                            .setThumbnailAccessory(
                                new ThumbnailBuilder().setURL(guildIcon)
                            )
                    )
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    `### <a:Kalp:1445523676991848488> Oy Verenler Sıralaması\n\n${votersList}\n` +
                                    `<a:Kystat:1438738305712787467> Toplam ${allVotes.length > 0 ? Object.keys(userVoteCounts).length : 0} farklı kullanıcı oy vermiş!`
                                )
                            )
                            .setThumbnailAccessory(
                                new ThumbnailBuilder().setURL(
                                    trophyEmoji ? getEmojiURL(trophyEmoji) : 
                                    'https://cdn.iconscout.com/icon/premium/png-512-thumb/trophy-icon-svg-png-download-2377718.png?f=webp&w=256'
                                )
                            )
                    )
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    '## <a:Kystat:1438738305712787467> Nasıl Çalışır?\n' +
                                    '<a:talking:1438758591065493584> **12 saatte bir oy verebilirsiniz**\n' +
                                    '<:support:1438738595945910412> Oy vererek sunucuya destek olun\n' +
                                    '<a:tagged1:1438758589002154036> Yorum yaparak görünürlüğü artırın'
                                )
                            )
                            .setThumbnailAccessory(
                                new ThumbnailBuilder().setURL(
                                    bookEmoji ? getEmojiURL(bookEmoji) : 
                                    'https://cdn.discordapp.com/emojis/1425484033168506881.webp?size=96&animated=true'
                                )
                            )
                    )
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addMediaGalleryComponents(
                        new MediaGalleryBuilder().addItems(
                            new MediaGalleryItemBuilder().setURL('https://cdn.discordapp.com/attachments/1352986110002987058/1445361876534956123/dcoyver.com.gif?')
                        )
                    )
                    .addSeparatorComponents(new SeparatorBuilder());

                // Butonları yeniden oluştur
                const newButtonRow = new ActionRowBuilder();
                
                if (buttonRow && buttonRow.components && buttonRow.components.length > 0) {
                    // Mevcut butonları kopyala
                    for (const btn of buttonRow.components) {
                        if (btn.type === 2) {
                            const button = new ButtonBuilder()
                                .setCustomId(btn.custom_id || null)
                                .setLabel(btn.label || '')
                                .setStyle(btn.style || ButtonStyle.Secondary);
                            
                            if (btn.emoji) {
                                if (typeof btn.emoji === 'string') {
                                    button.setEmoji(btn.emoji);
                                } else if (btn.emoji.id) {
                                    button.setEmoji(btn.emoji.id);
                                } else if (btn.emoji.name) {
                                    button.setEmoji(btn.emoji.name);
                                }
                            }
                            
                            if (btn.url) {
                                button.setURL(btn.url);
                            }
                            
                            newButtonRow.addComponents(button);
                        }
                    }
                }
                
                // Eğer buton yoksa varsayılan butonları oluştur
                if (newButtonRow.components.length === 0) {
                    newButtonRow
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('vote_start')
                                .setLabel('OY VER')
                                .setEmoji('1208064673522520144')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('vote_comment')
                                .setLabel('YORUM YAP')
                                .setEmoji('1204354152906362890')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('vote_notification')
                                .setLabel('BİLDİRİM')
                                .setEmoji('1204351166037753866')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('vote_settings')
                                .setLabel('Settings')
                                .setEmoji('1204353573928837120')
                                .setStyle(ButtonStyle.Secondary)
                        );
                        
                }
                
                // Sadece buton varsa ekle (Discord en az 1 component istiyor)
                if (newButtonRow.components.length > 0) {
                    container.addActionRowComponents(newButtonRow);
                }
                
                container.addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('### **<a:icon:1438723312250388531> DcOyver.com - Discord Sunucu Listesi <a:icon:1438723312250388531>**')
                    );

                // Mesajı güncelle - YENİ TASARIM ile (ÖRNEK.js stilinde)
                try {
                    await panelMessage.edit({
                        components: [container],
                        flags: [MessageFlags.IsComponentsV2]
                    });
                    
                    // Başarıyla güncellendi
                    logger.log(`✅ Panel updated successfully with new design for guild ${guild.id} (${guild.name})`, 'success');
                    
                    return true; // Başarılı
                } catch (editErr) {
                    logger.log(`❌ Panel edit error for guild ${guild.id}: ${editErr.message}`, 'error');
                    logger.log(`Panel edit error stack: ${editErr.stack}`, 'error');
                    throw editErr; // Hatayı yukarı fırlat
                }
            } catch (err) {
                // Hata durumunda logla
                logger.log(`updateVoteEmbed inner error for guild ${guild.id}: ${err.message}`, 'error');
                logger.log(`updateVoteEmbed inner error stack: ${err.stack}`, 'error');
                return false;
            }
        }

        // Panel mesaj ID'si yoksa, kanalda ara (geriye dönük uyumluluk)
        // Log spam'ini azalt - sadece önemli durumlarda logla
        // logger.log(`No registered panel found for guild ${guild.id}, searching in channel ${channel.name}...`, 'info');
        
        // Kanal erişim kontrolü
        let messages;
        try {
            // Kanalın görünürlüğünü kontrol et - sessizce geç
            if (!channel.viewable) {
                // Log spam'ini azalt - sadece debug modunda göster
                // logger.log(`⚠️ Channel ${channel.name} is not viewable for guild ${guild.id}`, 'warn');
                return false;
            }
            
            messages = await channel.messages.fetch({ limit: 50 });
        } catch (fetchError) {
            // Missing Access veya diğer erişim hataları - sessizce geç
            if (fetchError.code === 50001 || fetchError.message?.includes('Missing Access')) {
                // Log spam'ini azalt - sadece debug modunda göster
                // logger.log(`⚠️ Missing access to channel ${channel.name} for guild ${guild.id} - skipping`, 'warn');
                return false;
            }
            // Diğer hatalar için logla - sadece önemli hatalar
            if (!fetchError.message?.includes('rate limit') && !fetchError.message?.includes('429')) {
                logger.log(`❌ Error fetching messages from channel ${channel.name} for guild ${guild.id}: ${fetchError.message}`, 'error');
            }
            return false;
        }
        
        for (const message of messages.values()) {
            // Bot tarafından gönderilmiş ve Components V2 içeren mesajları kontrol et
            if (message.author.bot && message.components && message.components.length > 0) {
                const hasComponentsV2 = message.flags && message.flags.has(MessageFlags.IsComponentsV2);
                
                if (hasComponentsV2) {
                    try {
                        // vote_start butonu olan mesajı bul
                        let hasVoteButton = false;
                        let buttonRow = null;
                        
                        for (const componentRow of message.components) {
                            if (componentRow.components) {
                                for (const comp of componentRow.components) {
                                    if (comp.type === 2 && comp.custom_id === 'vote_start') {
                                        hasVoteButton = true;
                                        buttonRow = componentRow;
                                        break;
                                    }
                                }
                            }
                            if (hasVoteButton) break;
                        }
                        
                        if (hasVoteButton) {
                            // Panel mesaj ID'sini kaydet
                            await GuildData.findOneAndUpdate(
                                { guildId: guild.id },
                                { 
                                    votePanelMessageId: message.id,
                                    votePanelChannelId: channel.id
                                }
                            );

                            // Son oy verenleri getir
                            const recentVotes = await Vote.find({ guildId: guild.id })
                                .sort({ votedAt: -1 })
                                .limit(20);

                            // Tüm oyları al ve kullanıcı bazında grupla
                            const allVotes2 = await Vote.find({ guildId: guild.id }).lean();
                            const totalVotes2 = allVotes2.length;

                            // Oy verenleri formatla
                            let votersList2 = '';
                            let userVoteCounts2 = {};
                            
                            if (allVotes2.length > 0) {
                                // Her kullanıcının toplam oy sayısını hesapla
                                for (const vote of allVotes2) {
                                    if (!userVoteCounts2[vote.userId]) {
                                        userVoteCounts2[vote.userId] = 0;
                                    }
                                    userVoteCounts2[vote.userId]++;
                                }

                                // Kullanıcıları oy sayısına göre sırala
                                const sortedVoters = Object.entries(userVoteCounts2)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 20);

                                for (let i = 0; i < sortedVoters.length; i++) {
                                    const [userId, voteCount] = sortedVoters[i];
                                    try {
                                        const user = await client.users.fetch(userId);
                                        votersList2 += `<:bewrqturuncu:1438723245321748500> **${user.username}** \`${voteCount} oy\`\n`;
                                    } catch {
                                        votersList2 += `<:bewrqturuncu:1438723245321748500> **Bilinmeyen Kullanıcı** \`${voteCount} oy\`\n`;
                                    }
                                }
                            } else {
                                votersList2 = 'Henüz kimse oy vermedi.';
                            }

                            const settings = require('../../settings.json');

                            // Sunucu ikonu URL'i - yüksek kalite
                            const guildIcon2 = guild.iconURL({ dynamic: true, size: 512, extension: 'png' }) || 
                                              guild.iconURL({ dynamic: true, size: 256 }) || 
                                              'https://cdn.discordapp.com/attachments/1206385840041762829/1206385840041762829/discord-logo.png';
                            
                            // Discord emoji URL'leri (eğer sunucuda varsa)
                            const getEmojiURL2 = (emojiId) => {
                                if (!emojiId) return null;
                                return `https://cdn.discordapp.com/emojis/${emojiId}.png?size=256`;
                            };
                            
                            // Sunucu emojilerini kontrol et
                            const trophyEmoji2 = guild.emojis.cache.find(e => e.name?.toLowerCase().includes('trophy') || e.name?.toLowerCase().includes('kupa'))?.id;
                            const bookEmoji2 = guild.emojis.cache.find(e => e.name?.toLowerCase().includes('book') || e.name?.toLowerCase().includes('kitap'))?.id;

                            // Container oluştur - ÖRNEK.js stilinde
                            const container = new ContainerBuilder()
                                .setAccentColor(0x5865F2) // Discord mavisi
                                .addTextDisplayComponents(
                                    new TextDisplayBuilder().setContent(`### <a:tagged1:1438758589002154036> ${guild.name} - Oy Verme Paneli`)
                                )
                                .addSeparatorComponents(new SeparatorBuilder())
                                .addSectionComponents(
                                    new SectionBuilder()
                                        .addTextDisplayComponents(
                                            new TextDisplayBuilder().setContent(
                                                '## <a:imek:1445522998932017162> Sunucu Bilgileri\n' +
                                                `<:botopen:1445522650028834816>  **Sunucu:** ${guild.name}\n` +
                                                `<a:tagged1:1438758589002154036> **Toplam Oy:** ${totalVotes2}\n` +
                                                `<a:icon:1438723312250388531> **Sunucu Sayfası:** [Tıkla](${settings.WEBSITE_URL}/sunucu/${guild.id})`
                                            )
                                        )
                                        .setThumbnailAccessory(
                                            new ThumbnailBuilder().setURL(guildIcon2)
                                        )
                                )
                                .addSeparatorComponents(new SeparatorBuilder())
                                .addSectionComponents(
                                    new SectionBuilder()
                                        .addTextDisplayComponents(
                                            new TextDisplayBuilder().setContent(
                                                `### <a:Kalp:1445523676991848488> Oy Verenler Sıralaması\n\n${votersList2}\n` +
                                                `<a:Kystat:1438738305712787467> Toplam ${allVotes2.length > 0 ? Object.keys(userVoteCounts2).length : 0} farklı kullanıcı oy vermiş!`
                                            )
                                        )
                                        .setThumbnailAccessory(
                                            new ThumbnailBuilder().setURL(
                                                trophyEmoji2 ? getEmojiURL2(trophyEmoji2) : 
                                                'https://cdn.iconscout.com/icon/premium/png-512-thumb/trophy-icon-svg-png-download-2377718.png?f=webp&w=256'
                                            )
                                        )
                                )
                                .addSeparatorComponents(new SeparatorBuilder())
                                .addSectionComponents(
                                    new SectionBuilder()
                                        .addTextDisplayComponents(
                                            new TextDisplayBuilder().setContent(
                                                '## <a:Kystat:1438738305712787467> Nasıl Çalışır?\n' +
                                                '<a:talking:1438758591065493584> **12 saatte bir oy verebilirsiniz**\n' +
                                                '<:support:1438738595945910412> Oy vererek sunucuya destek olun\n' +
                                                '<a:tagged1:1438758589002154036> Yorum yaparak görünürlüğü artırın'
                                            )
                                        )
                                        .setThumbnailAccessory(
                                            new ThumbnailBuilder().setURL(
                                                bookEmoji2 ? getEmojiURL2(bookEmoji2) : 
                                                'https://cdn.discordapp.com/emojis/1425484033168506881.webp?size=96&animated=true'
                                            )
                                        )
                                )
                                .addSeparatorComponents(new SeparatorBuilder())
                                .addMediaGalleryComponents(
                                    new MediaGalleryBuilder().addItems(
                                        new MediaGalleryItemBuilder().setURL('https://cdn.discordapp.com/attachments/1352986110002987058/1445361876534956123/dcoyver.com.gif?')
                                    )
                                )
                                .addSeparatorComponents(new SeparatorBuilder());

                            const newButtonRow = new ActionRowBuilder();
                            
                            if (buttonRow && buttonRow.components && buttonRow.components.length > 0) {
                                // Mevcut butonları kopyala
                                for (const btn of buttonRow.components) {
                                    if (btn.type === 2) {
                                        const button = new ButtonBuilder()
                                            .setCustomId(btn.custom_id || null)
                                            .setLabel(btn.label || '')
                                            .setStyle(btn.style || ButtonStyle.Secondary);
                                        
                                        if (btn.emoji) {
                                            if (typeof btn.emoji === 'string') {
                                                button.setEmoji(btn.emoji);
                                            } else if (btn.emoji.id) {
                                                button.setEmoji(btn.emoji.id);
                                            } else if (btn.emoji.name) {
                                                button.setEmoji(btn.emoji.name);
                                            }
                                        }
                                        
                                        if (btn.url) {
                                            button.setURL(btn.url);
                                        }
                                        
                                        newButtonRow.addComponents(button);
                                    }
                                }
                            }
                            
                            // Eğer buton yoksa varsayılan butonları oluştur
                            if (newButtonRow.components.length === 0) {
                                newButtonRow
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('vote_start')
                                            .setLabel('OY VER')
                                            .setEmoji('1208064673522520144')
                                            .setStyle(ButtonStyle.Primary),
                                        new ButtonBuilder()
                                            .setCustomId('vote_comment')
                                            .setLabel('YORUM YAP')
                                            .setEmoji('1204354152906362890')
                                            .setStyle(ButtonStyle.Secondary),
                                        new ButtonBuilder()
                                            .setCustomId('vote_notification')
                                            .setLabel('BİLDİRİM')
                                            .setEmoji('1204351166037753866')
                                            .setStyle(ButtonStyle.Secondary),
                                        new ButtonBuilder()
                                            .setCustomId('vote_settings')
                                            .setEmoji('1204353573928837120')
                                            .setStyle(ButtonStyle.Secondary)
                                    );
                            }
                            
                            // Sadece buton varsa ekle (Discord en az 1 component istiyor)
                            if (newButtonRow.components.length > 0) {
                                container.addActionRowComponents(newButtonRow);
                            }
                            
                            container.addSeparatorComponents(new SeparatorBuilder())
                                .addTextDisplayComponents(
                                    new TextDisplayBuilder().setContent('### **<a:icon:1438723312250388531> DcOyver.com - Discord Sunucu Listesi <a:icon:1438723312250388531>**')
                                );

                            await message.edit({
                                components: [container],
                                flags: [MessageFlags.IsComponentsV2]
                            });
                            
                            // Panel mesaj ID'sini kaydet (eğer yoksa)
                            await GuildData.findOneAndUpdate(
                                { guildId: guild.id },
                                { 
                                    votePanelMessageId: message.id,
                                    votePanelChannelId: channel.id
                                },
                                { upsert: true }
                            );
                            
                            // mesaj.json'a ekle
                            const mesajHelper = require('../../lib/mesajHelper');
                            mesajHelper.addMessageToJson(guild.id, channel.id, message.id);
                            
                            logger.log(`✅ Panel found and updated (backward compatibility) for guild ${guild.id} (${guild.name})`, 'success');
                            
                            return true; // Başarılı
                        }
                    } catch (err) {
                        continue;
                    }
                }
            }
        }
        
        // Panel bulunamadı - sessizce geç (log spam'ini azalt)
        // logger.log(`❌ Panel not found in channel ${channel.name} for guild ${guild.id}`, 'warn');
        return false;
    } catch (error) {
        const logger = require('../../lib/logger');
        
        // Missing Access hatalarını daha sessiz logla
        if (error.code === 50001 || error.message?.includes('Missing Access')) {
            logger.log(`⚠️ Missing access for guild ${guild.id} (${guild.name || 'unknown'}) - channel: ${channel?.name || 'unknown'}`, 'warn');
            return false;
        }
        
        // Diğer hataları normal şekilde logla
        logger.log(`updateVoteEmbed general error for guild ${guild.id}: ${error.message}`, 'error');
        if (error.stack && !error.message?.includes('Missing Access')) {
            logger.log(`updateVoteEmbed general error stack: ${error.stack}`, 'error');
        }
        return false;
    }
}

// Panel güncelleme helper fonksiyonu - Herhangi bir buton tıklandığında çağrılır
async function updatePanelOnButtonClick(interaction, client) {
    try {
        const logger = require('../../lib/logger');
        const guildData = await GuildData.findOne({ guildId: interaction.guild.id });
        
        if (!guildData || !guildData.isSetup) {
            return; // Sunucu setup edilmemiş
        }
        
        // Önce kayıtlı panel mesaj ID'si varsa onu güncelle
        if (guildData.votePanelMessageId && guildData.votePanelChannelId) {
            const panelChannel = interaction.guild.channels.cache.get(guildData.votePanelChannelId);
            
            if (panelChannel) {
                // YENİ TASARIM ile güncelle - direkt await ile
                await updateVoteEmbed(interaction.guild, panelChannel, client).catch(err => {
                    logger.log(`Panel auto-update error (registered): ${err.message}`, 'warn');
                });
                return; // Başarılı, çık
            }
        }
        
        // Kayıtlı panel yoksa, tüm metin kanallarında panel ara ve güncelle
        const textChannels = interaction.guild.channels.cache.filter(ch => ch.type === 0); // Text channel type
        
        for (const channel of textChannels.values()) {
            try {
                const result = await updateVoteEmbed(interaction.guild, channel, client);
                if (result === true || result === undefined) {
                    // Panel bulundu ve güncellendi - sessizce geç (log spam'ini azalt)
                    // logger.log(`Panel found and updated in channel ${channel.name} for guild ${interaction.guild.id}`, 'info');
                    return;
                }
            } catch (error) {
                // Bu kanalda panel yok, devam et
                continue;
            }
        }
    } catch (error) {
        // Hata durumunda logla ama devam et
        const logger = require('../../lib/logger');
        logger.log(`Panel auto-update error: ${error.message}`, 'warn');
    }
}

module.exports = {
    name: 'interactionCreate',
    updateVoteEmbed, // Export updateVoteEmbed fonksiyonunu bot.js'de kullanmak için
    
    async execute(interaction, client) {
        const logger = require('../../lib/logger');
        logger.log(`🔔 Interaction geldi: type=${interaction.type}, customId=${interaction.customId || 'N/A'}, isButton=${interaction.isButton ? interaction.isButton() : 'N/A'}, isMessageComponent=${interaction.isMessageComponent ? interaction.isMessageComponent() : 'N/A'}`, 'info');
        
        // Slash komutlar
        if (interaction.isChatInputCommand()) {
            const command = client.slashCommands.get(interaction.commandName);

            if (!command) {
                const errorContainer = new ContainerBuilder();
                const errorDisplay = new TextDisplayBuilder()
                    .setContent(`Komut Bulunamadı\nBu komut bulunamadı!`);
                errorContainer.addTextDisplayComponents(errorDisplay);
                
                return await interaction.reply({ 
                    components: [errorContainer],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                const logger = require('../../lib/logger');
                logger.log(`Error executing command ${interaction.commandName}: ${error.message}`, 'error');
                logger.log(`Error executing command stack: ${error.stack}`, 'error');
                
                const errorContainer = new ContainerBuilder();
                const errorDisplay = new TextDisplayBuilder()
                    .setContent(`Sistem Hatası\nBu komutu çalıştırırken bir hata oluştu!`);
                errorContainer.addTextDisplayComponents(errorDisplay);
                
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.editReply({
                            components: [errorContainer],
                            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                        }).catch(() => {
                            // Edit başarısız olursa followUp dene
                            return interaction.followUp({
                                components: [errorContainer],
                                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                            });
                        });
                    } else {
                        await interaction.reply({
                            components: [errorContainer],
                            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                        });
                    }
                } catch (replyError) {
                    // Interaction geçersizse sadece logla
                    logger.log(`Failed to reply to interaction: ${replyError.message}`, 'error');
                }
            }
        }

        // Button interactions - Components V2 butonları için de kontrol et
        // Discord.js'de Components V2 butonları için interaction.type === InteractionType.MessageComponent (3)
        // Ayrıca customId varsa ve isButton() true ise veya type === 3 ise buton interaction'ıdır
        const isButtonInteraction = (interaction.isButton && interaction.isButton()) || 
            (interaction.type === InteractionType.MessageComponent && interaction.customId) ||
            (interaction.type === 3 && interaction.customId);
        
        logger.log(`🔍 Buton kontrolü: isButtonInteraction=${isButtonInteraction}, type=${interaction.type}, InteractionType.MessageComponent=${InteractionType.MessageComponent}, customId=${interaction.customId || 'N/A'}`, 'info');
        
        if (isButtonInteraction && interaction.customId) {
            logger.log(`✅ Buton handler'a girdi: customId=${interaction.customId}`, 'info');
            
            // Ana oy verme butonu
            if (interaction.customId === 'vote_start') {
                try {
                    const Vote = require('../../data/schemas/vote');
                    
                    // Kullanıcının son oy verme zamanını kontrol et (12 saat)
                    const lastVote = await Vote.findOne({
                        guildId: interaction.guild.id,
                        userId: interaction.user.id
                    })
                    .sort({ votedAt: -1 }) // En son oy verme zamanına göre sırala
                    .catch(() => null);

                    if (lastVote) {
                        const now = new Date();
                        const timeDiff = now - lastVote.votedAt;
                        const hoursDiff = timeDiff / (1000 * 60 * 60);

                        if (hoursDiff < 12) {
                            const remainingHours = Math.ceil(12 - hoursDiff);
                            const cooldownContainer = new ContainerBuilder();
                            const cooldownDisplay = new TextDisplayBuilder()
                                .setContent(`Bekleme Süresi\nBu sunucuya tekrar oy verebilmek için **${remainingHours} saat** daha beklemelisiniz.\n\nSon oy verme zamanınız: <t:${Math.floor(lastVote.votedAt.getTime() / 1000)}:R>`);
                            cooldownContainer.addTextDisplayComponents(cooldownDisplay);
                            
                            try {
                                return await interaction.reply({
                                    components: [cooldownContainer],
                                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                                });
                            } catch (replyError) {
                                const logger = require('../../lib/logger');
                                logger.log(`Vote start cooldown reply error: ${replyError.message}`, 'error');
                                return;
                            }
                        }
                    }

                    // Matematik sorusu oluştur
                    const num1 = Math.floor(Math.random() * 20) + 1;
                    const num2 = Math.floor(Math.random() * 20) + 1;
                    const correctAnswer = num1 + num2;

                    // Yanlış cevaplar oluştur
                    const wrongAnswers = new Set();
                    while (wrongAnswers.size < 3) {
                        const wrong = correctAnswer + Math.floor(Math.random() * 10) - 5;
                        if (wrong !== correctAnswer && wrong > 0) {
                            wrongAnswers.add(wrong);
                        }
                    }

                    // Cevapları karıştır
                    const answers = [correctAnswer, ...Array.from(wrongAnswers)];
                    answers.sort(() => Math.random() - 0.5);

                    // Components V2 Container oluştur
                    const container = new ContainerBuilder();
                    
                    // Soru gösterimi
                    const questionDisplay = new TextDisplayBuilder()
                        .setContent(`Matematik Sorusu\n**${interaction.guild.name}** sunucusuna oy vermek için aşağıdaki soruyu cevaplayın:\n\n## ${num1} + ${num2} = ?\n\nDoğru cevabı seçerek oy verebilirsiniz!`);
                    container.addTextDisplayComponents(questionDisplay);

                    // Butonları oluştur
                    const row = new ActionRowBuilder();
                    answers.forEach(answer => {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId(`vote_answer_${answer}_${correctAnswer}_${interaction.user.id}`)
                                .setLabel(answer.toString())
                                .setStyle(ButtonStyle.Primary)
                        );
                    });

                    container.addActionRowComponents(row);

                    try {
                        await interaction.reply({
                            components: [container],
                            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                        });
                        
                        // Panel güncelle
                        updatePanelOnButtonClick(interaction, client).catch(() => {});
                        return;
                    } catch (replyError) {
                        const logger = require('../../lib/logger');
                        logger.log(`Vote start reply error: ${replyError.message}`, 'error');
                        return;
                    }
                } catch (error) {
                    const logger = require('../../lib/logger');
                    logger.log(`Vote start error: ${error.message}`, 'error');
                    logger.log(`Vote start error stack: ${error.stack}`, 'error');
                    return;
                }
            }

            // Oy verme cevap butonları
            if (interaction.customId.startsWith('vote_answer_')) {
                try {
                    const [, , selectedAnswer, correctAnswer, userId] = interaction.customId.split('_');
                    
                    // Sadece soruyu alan kullanıcı cevaplayabilir
                    if (interaction.user.id !== userId) {
                        const notOwnerContainer = new ContainerBuilder();
                        const notOwnerDisplay = new TextDisplayBuilder()
                            .setContent(`Yetki Hatası\nBu soru size ait değil! Sadece soruyu başlatan kullanıcı cevaplayabilir.`);
                        notOwnerContainer.addTextDisplayComponents(notOwnerDisplay);
                        
                        try {
                            return await interaction.reply({
                                components: [notOwnerContainer],
                                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                            });
                        } catch (replyError) {
                            const logger = require('../../lib/logger');
                            logger.log(`Vote answer not owner reply error: ${replyError.message}`, 'error');
                            return;
                        }
                    }

                    const isCorrect = parseInt(selectedAnswer) === parseInt(correctAnswer);

                    if (!isCorrect) {
                        const wrongAnswerContainer = new ContainerBuilder();
                        const wrongAnswerDisplay = new TextDisplayBuilder()
                            .setContent(`Yanlış Cevap\nMaalesef cevabınız yanlış!\n\n**Doğru Cevap:** ${correctAnswer}\n\nTekrar denemek için \`.oyver\` komutunu kullanabilirsiniz.`);
                        wrongAnswerContainer.addTextDisplayComponents(wrongAnswerDisplay);
                        
                        try {
                            return await interaction.update({
                                components: [wrongAnswerContainer],
                                flags: [MessageFlags.IsComponentsV2]
                            });
                        } catch (updateError) {
                            const logger = require('../../lib/logger');
                            logger.log(`Vote answer wrong update error: ${updateError.message}`, 'error');
                            return;
                        }
                    }

                    // Doğru cevap - Oy kaydet
                    try {
                        const Vote = require('../../data/schemas/vote');
                        
                        // Yeni oy kaydı oluştur (her oy verme işlemi ayrı kayıt)
                        await Vote.create({
                            guildId: interaction.guild.id,
                            userId: interaction.user.id,
                            votedAt: new Date()
                        });

                        // Kullanıcının oy verdiği sunucuları güncelle
                        try {
                            const UserData = require('../../data/schemas/user');
                            const userId = interaction.user.id;
                            const guildId = interaction.guild.id;
                            
                            const userData = await UserData.findOne({ discordId: userId });
                            if (userData) {
                                const totalVotesForGuild = await Vote.countDocuments({ userId, guildId });
                                
                                // votedGuilds array'inde bu sunucuyu bul veya ekle
                                const existingVoteIndex = userData.votedGuilds.findIndex(v => v.guildId === guildId);
                                
                                if (existingVoteIndex >= 0) {
                                    // Mevcut oyu güncelle
                                    userData.votedGuilds[existingVoteIndex] = {
                                        guildId: guildId,
                                        votedAt: new Date(),
                                        voteCount: totalVotesForGuild
                                    };
                                } else {
                                    // Yeni oy ekle
                                    userData.votedGuilds.push({
                                        guildId: guildId,
                                        votedAt: new Date(),
                                        voteCount: totalVotesForGuild
                                    });
                                }
                                
                                userData.lastSyncedAt = new Date();
                                await userData.save();
                            }
                        } catch (userUpdateError) {
                            // Sessizce devam et
                        }

                        // Sunucu toplam oy sayısını güncelle
                        const totalVotes = await Vote.countDocuments({ guildId: interaction.guild.id });
                        await GuildData.findOneAndUpdate(
                            { guildId: interaction.guild.id },
                            { totalVotes: totalVotes }
                        );

                        const successContainer = new ContainerBuilder();
                        const successDisplay = new TextDisplayBuilder()
                            .setContent(`<a:tagged1:1438758589002154036> Oy Verildi\n\n**${interaction.guild.name}** sunucusuna başarıyla oy verdiniz!\n\n**<a:sagok:1443084319567646793> Teşekkür ederiz!**\n<a:Kystat:1438738305712787467> 12 saat sonra tekrar oy verebilirsiniz.\n\n**<:support:1438738595945910412> Toplam Oy:** ${totalVotes}\n**<a:icon:1438723312250388531> Sunucu Sayfası:** [Tıkla](https://dcoyver.com)`);
                        successContainer.addTextDisplayComponents(successDisplay);

                        try {
                            await interaction.update({
                                components: [successContainer],
                                flags: [MessageFlags.IsComponentsV2]
                            });
                        } catch (updateError) {
                            const logger = require('../../lib/logger');
                            logger.log(`Vote answer success update error: ${updateError.message}`, 'error');
                            return;
                        }

                    // Oy verme panelini anında güncelle - YENİ TASARIM ile (herhangi bir sunucuda oy verildiğinde)
                    // MongoDB'den direkt veri çek ve anında güncelle - HER ZAMAN YENİ TASARIM
                    try {
                        // GuildData'dan panel bilgilerini al
                        const guildData = await GuildData.findOne({ guildId: interaction.guild.id });
                        
                        if (guildData && guildData.votePanelMessageId && guildData.votePanelChannelId) {
                            const panelChannel = interaction.guild.channels.cache.get(guildData.votePanelChannelId);
                            
                            if (panelChannel) {
                                // mesaj.json'a ekle (eğer yoksa)
                                const mesajHelper = require('../../lib/mesajHelper');
                                mesajHelper.addMessageToJson(interaction.guild.id, guildData.votePanelChannelId, guildData.votePanelMessageId);
                                
                                // YENİ TASARIM ile güncelle - updateVoteEmbed HER ZAMAN yeni tasarımı kullanıyor
                                // await ile bekle ve hata olursa logla
                                const updateResult = await updateVoteEmbed(interaction.guild, panelChannel, interaction.client);
                                
                                if (updateResult === true) {
                                    // updateVoteEmbed başarıyla çalıştı
                                    const logger = require('../../lib/logger');
                                    logger.log(`✅ Vote panel updated successfully with new design for guild ${interaction.guild.id}`, 'info');
                                } else if (updateResult === false) {
                                    const logger = require('../../lib/logger');
                                    logger.log(`⚠️ Vote panel update returned false for guild ${interaction.guild.id}`, 'warn');
                                }
                            } else {
                                const logger = require('../../lib/logger');
                                logger.log(`Panel channel not found for guild ${interaction.guild.id}`, 'warn');
                            }
                        } else {
                            const logger = require('../../lib/logger');
                            logger.log(`Panel message ID or channel ID not found for guild ${interaction.guild.id}`, 'warn');
                        }
                        
                        // mesaj.json'daki TÜM panelleri güncelle (oy verildiğinde)
                        // Async olarak çalıştır (ana işlemi bloklamadan)
                        setImmediate(async () => {
                            try {
                                const updatePanelsFromMesajJson = global.updatePanelsFromMesajJson;
                                if (updatePanelsFromMesajJson) {
                                    await updatePanelsFromMesajJson();
                                }
                            } catch (error) {
                                const logger = require('../../lib/logger');
                                logger.log(`mesaj.json panel update error after vote: ${error.message}`, 'warn');
                            }
                        });
                    } catch (updateError) {
                        // Panel güncelleme hatası - logla ama devam et
                        const logger = require('../../lib/logger');
                        logger.log(`Vote panel update error: ${updateError.message}`, 'error');
                        logger.log(`Vote panel update error stack: ${updateError.stack}`, 'error');
                    }

                    } catch (error) {
                        const logger = require('../../lib/logger');
                        logger.log(`Vote save error: ${error.message}`, 'error');
                        logger.log(`Vote save error stack: ${error.stack}`, 'error');
                        
                        const errorContainer = new ContainerBuilder();
                        const errorDisplay = new TextDisplayBuilder()
                            .setContent(`Sistem Hatası\nOy kaydedilirken bir hata oluştu.\n\nLütfen daha sonra tekrar deneyin veya bir yöneticiye bildirin.`);
                        errorContainer.addTextDisplayComponents(errorDisplay);
                        
                        try {
                            await interaction.update({
                                components: [errorContainer],
                                flags: [MessageFlags.IsComponentsV2]
                            });
                        } catch (updateError) {
                            logger.log(`Vote save error update error: ${updateError.message}`, 'error');
                        }
                    }
                } catch (error) {
                    const logger = require('../../lib/logger');
                    logger.log(`Vote answer general error: ${error.message}`, 'error');
                    logger.log(`Vote answer general error stack: ${error.stack}`, 'error');
                }
                return;
            }

            // Yorum yap butonu
            if (interaction.customId === 'vote_comment') {
                // Direkt modal göster (yetkilendirme gereksiz)
                const modal = new ModalBuilder()
                    .setCustomId('comment_modal')
                    .setTitle('BU SUNUCUYA YORUM YAP');

                const commentInput = new TextInputBuilder()
                    .setCustomId('comment_text')
                    .setLabel('Yorum Yap *')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Yorum Yap')
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(450);

                const ratingInput = new TextInputBuilder()
                    .setCustomId('comment_rating')
                    .setLabel('Puan Ver (1 ile 5 arası) *')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('5')
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(1)
                    .setValue('5');

                const row1 = new ActionRowBuilder().addComponents(commentInput);
                const row2 = new ActionRowBuilder().addComponents(ratingInput);

                modal.addComponents(row1, row2);

                await interaction.showModal(modal);
                
                // Panel güncelle
                updatePanelOnButtonClick(interaction, client).catch(() => {});
                return;
            }

            // Bildirim butonu
            if (interaction.customId === 'vote_settings') {
                await interaction.deferReply({ 
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });

                try {
                    const guildData = await GuildData.findOne({ guildId: interaction.guild.id }).lean();
                    
                    if (!guildData || !guildData.isSetup) {
                        const notSetupContainer = new ContainerBuilder();
                        const notSetupDisplay = new TextDisplayBuilder()
                            .setContent(`<a:icon:1438723312250388531> Sunucu Bulunamadı\n\nBu sunucu henüz DcOyver.com'a eklenmemiş!`);
                        notSetupContainer.addTextDisplayComponents(notSetupDisplay);
                        
                        return await interaction.editReply({
                            components: [notSetupContainer],
                            flags: [MessageFlags.IsComponentsV2]
                        });
                    }

                    // Sunucu banner URL'i - örnek koddaki gibi tam görünsün
                    const bannerURL = interaction.guild.bannerURL({ dynamic: true, size: 1024, extension: 'webp' }) || 
                                      interaction.guild.bannerURL({ dynamic: true, size: 1024 }) ||
                                      interaction.guild.bannerURL({ dynamic: true, size: 2048 });
                    const imageURL = bannerURL || guildData.bannerURL || null;

                    // Metin içeriğini güvenli hale getir (Discord limitleri için)
                    const safeText = (text, maxLength = 1900) => {
                        if (!text || typeof text !== 'string') return '';
                        return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
                    };

                    // Kategori isimleri
                    const categoryNames = {
                        public: 'GENEL',
                        private: 'ÖZEL',
                        game: 'OYUN'
                    };

                    // Durum
                    const status = guildData.isActive ? 'Aktif' : 'Pasif';

                    // Toplam oy sayısı
                    const Vote = require('../../data/schemas/vote');
                    const totalVotes = await Vote.countDocuments({ guildId: interaction.guild.id });

                    // Sunucu ikonu URL'i
                    const guildIcon = interaction.guild.iconURL({ dynamic: true, size: 512, extension: 'png' }) || 
                                     interaction.guild.iconURL({ dynamic: true, size: 256 }) || 
                                     'https://cdn.discordapp.com/attachments/1206385840041762829/1206385840041762829/discord-logo.png';
                    
                    const guildName = safeText(interaction.guild.name, 100);

                    // Container oluştur - Banner'ı en başa ekle
                    const container = new ContainerBuilder()
                        .setAccentColor(0xFFB6D9);

                    // Banner görseli ekle - örnek koddaki gibi tam ekle
                    if (imageURL) {
                        try {
                            const mediaGallery = new MediaGalleryBuilder();
                            mediaGallery.addItems(
                                new MediaGalleryItemBuilder().setURL(imageURL)
                            );
                            container.addMediaGalleryComponents(mediaGallery);
                        } catch (error) {
                            // Banner eklenemezse sessizce devam et
                            const logger = require('../../lib/logger');
                            logger.log(`Banner URL eklenirken hata: ${error.message}`, 'warn');
                        }
                    }

                    // Container'a başlık ekle
                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`### <a:tagged1:1438758589002154036> ${guildName} - Sunucu Detayları`)
                    )
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    '## <a:imek:1445522998932017162> Sunucu Bilgileri\n' +
                                    `<:botopen:1445522650028834816>  **Sunucu:** ${guildName}\n` +
                                    `<a:tagged1:1438758589002154036> **Durum:** ${status}\n` +
                                    `<a:Kystat:1438738305712787467> **Kategori:** ${categoryNames[guildData.category] || 'GENEL'}`
                                )
                            )
                            .setThumbnailAccessory(
                                new ThumbnailBuilder().setURL(guildIcon)
                            )
                    )
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    '## <a:talking:1438758591065493584> Bağlantılar\n' +
                                    `<:botopen:1445522650028834816>  **Davet Linki:**\n${safeText(guildData.inviteURL || 'Belirtilmemiş', 200)}\n` +
                                    `<a:icon:1438723312250388531> **Sunucu Sayfası:** [Tıkla](${settings.WEBSITE_URL}/sunucu/${interaction.guild.id})`
                                )
                            )
                            .setThumbnailAccessory(
                                new ThumbnailBuilder().setURL('https://cdn.iconscout.com/icon/premium/png-512-thumb/link-icon-svg-png-download-2377715.png?f=webp&w=256')
                            )
                    )
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    '## <a:tagged1:1438758589002154036> İstatistikler\n' +
                                    `<:botopen:1445522650028834816>  **Oy Sayısı:** ${totalVotes}\n` +
                                    `<a:Kystat:1438738305712787467> **Görüntülenme:** ${guildData.views || 0}\n` +
                                    `<a:talking:1438758591065493584> **Tıklanma:** ${guildData.clicks || 0}`
                                )
                            )
                            .setThumbnailAccessory(
                                new ThumbnailBuilder().setURL('https://cdn.iconscout.com/icon/premium/png-512-thumb/chart-icon-svg-png-download-2377703.png?f=webp&w=256')
                            )
                    );
                    
                    // Sunucu açıklaması varsa ekle
                    if (guildData.description) {
                        const description = safeText(guildData.description, 500);
                        container.addSeparatorComponents(new SeparatorBuilder())
                            .addSectionComponents(
                                new SectionBuilder()
                                    .addTextDisplayComponents(
                                        new TextDisplayBuilder().setContent(
                                            '## <a:icon:1438723312250388531> Açıklama\n' +
                                            `<:botopen:1445522650028834816>  ${description}`
                                        )
                                    )
                                    .setThumbnailAccessory(
                                        new ThumbnailBuilder().setURL('https://cdn.iconscout.com/icon/premium/png-512-thumb/book-icon-svg-png-download-2377730.png?f=webp&w=256')
                                    )
                            );
                    }
                    
                    container.addSeparatorComponents(new SeparatorBuilder())
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('### **<a:icon:1438723312250388531> DcOyver.com - Discord Sunucu Listesi <a:icon:1438723312250388531>**')
                        );

                    await interaction.editReply({
                        components: [container],
                        flags: [MessageFlags.IsComponentsV2]
                    });
                    
                    // Panel güncelle
                    updatePanelOnButtonClick(interaction, client).catch(() => {});

                } catch (error) {
                    const logger = require('../../lib/logger');
                    logger.log(`Vote settings error: ${error.message}`, 'error');
                    logger.log(`Vote settings error stack: ${error.stack}`, 'error');
                    
                    // Hata detaylarını logla
                    if (error.errors) {
                        logger.log(`Vote settings validation errors: ${JSON.stringify(error.errors)}`, 'error');
                    }
                    if (error.response) {
                        logger.log(`Vote settings API response: ${JSON.stringify(error.response)}`, 'error');
                    }
                    
                    const errorContainer = new ContainerBuilder();
                    const errorDisplay = new TextDisplayBuilder()
                        .setContent(`Sistem Hatası\nSunucu bilgileri yüklenirken bir hata oluştu.\n\nLütfen daha sonra tekrar deneyin.`);
                    errorContainer.addTextDisplayComponents(errorDisplay);
                    
                    try {
                        await interaction.editReply({
                            components: [errorContainer],
                            flags: [MessageFlags.IsComponentsV2]
                        });
                    } catch (replyError) {
                        logger.log(`Vote settings reply error: ${replyError.message}`, 'error');
                    }
                }
            }

            if (interaction.customId === 'vote_notification') {
                await interaction.deferReply({ 
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });

                try {
                    const UserNotification = require('../../data/schemas/userNotification');
                    
                    // Kullanıcının bildirim ayarını bul veya oluştur
                    let userNotification = await UserNotification.findOne({
                        userId: interaction.user.id,
                        guildId: interaction.guild.id
                    });

                    if (!userNotification) {
                        userNotification = new UserNotification({
                            userId: interaction.user.id,
                            guildId: interaction.guild.id,
                            notificationEnabled: true
                        });
                    } else {
                        // Toggle et
                        userNotification.notificationEnabled = !userNotification.notificationEnabled;
                    }

                    await userNotification.save();

                    const statusContainer = new ContainerBuilder();
                    const statusDisplay = new TextDisplayBuilder()
                        .setContent(userNotification.notificationEnabled 
                            ? `✅ Bildirim Aktif\n\n**${interaction.guild.name}** sunucusu için bildirimler aktifleştirildi!\n\n12 saatlik süre dolduğunda size DM yoluyla bildirim gönderilecek.`
                            : `❌ Bildirim Pasif\n\n**${interaction.guild.name}** sunucusu için bildirimler kapatıldı.`);
                    statusContainer.addTextDisplayComponents(statusDisplay);

                    await interaction.editReply({
                        components: [statusContainer],
                        flags: [MessageFlags.IsComponentsV2]
                    });
                    
                    // Panel güncelle
                    updatePanelOnButtonClick(interaction, client).catch(() => {});
                } catch (error) {
                    const logger = require('../../lib/logger');
                    logger.log(`Notification toggle error: ${error.message}`, 'error');
                    
                    const errorContainer = new ContainerBuilder();
                    const errorDisplay = new TextDisplayBuilder()
                        .setContent(`Sistem Hatası\nBildirim ayarı değiştirilirken bir hata oluştu.`);
                    errorContainer.addTextDisplayComponents(errorDisplay);
                    
                    await interaction.editReply({
                        components: [errorContainer],
                        flags: [MessageFlags.IsComponentsV2]
                    });
                }
                return;
            }

            // Tüm panelleri güncelle butonu
            if (interaction.customId === 'update_all_panels') {
                // OWNER_IDS kontrolü
                if (!settings.OWNER_IDS || !settings.OWNER_IDS.includes(interaction.user.id)) {
                    const errorContainer = new ContainerBuilder()
                        .setAccentColor(0xFF0000)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('### ❌ Yetki Hatası\n\nBu komutu sadece bot sahipleri kullanabilir!')
                        );
                    
                    return await interaction.reply({
                        components: [errorContainer],
                        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                    });
                }

                await interaction.deferUpdate();

                try {
                    // "Güncelleniyor..." mesajı göster
                    const updatingContainer = new ContainerBuilder()
                        .setAccentColor(0x5865F2)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                '### 🔄 Güncelleniyor...\n\n' +
                                'Tüm sunuculardaki oy verme panelleri güncelleniyor. Lütfen bekleyin...\n\n' +
                                'Bu işlem biraz zaman alabilir.'
                            )
                        );

                    await interaction.editReply({
                        components: [updatingContainer],
                        flags: [MessageFlags.IsComponentsV2]
                    });

                    // Tüm panelleri güncelle
                    const allGuilds = await GuildData.find({ isSetup: true, isActive: true });
                    
                    const logger = require('../../lib/logger');
                    // Log spam'ini azalt - sadece özet logla
                    logger.log(`Panel update başlatıldı: ${allGuilds.length} sunucu`, 'info');
                    
                    let updated = 0;
                    let failed = 0;
                    let notFound = 0;
                    
                    for (const guildData of allGuilds) {
                        try {
                            const guild = interaction.client.guilds.cache.get(guildData.guildId);
                            
                            if (!guild) {
                                notFound++;
                                continue;
                            }
                            
                            let panelUpdated = false;
                            
                            // Önce kayıtlı panel mesaj ID'si varsa onu güncelle
                            if (guildData.votePanelMessageId && guildData.votePanelChannelId) {
                                try {
                                    const panelChannel = guild.channels.cache.get(guildData.votePanelChannelId);
                                    
                                    if (panelChannel) {
                                        // Log spam'ini azalt - sessizce güncelle
                                        const result = await updateVoteEmbed(guild, panelChannel, interaction.client);
                                        if (result === true) {
                                            updated++;
                                            panelUpdated = true;
                                            // Sadece başarılı güncellemeleri logla
                                            // logger.log(`✅ Panel updated for guild ${guild.name} (${guild.id})`, 'success');
                                        }
                                        // Başarısız güncellemeleri sessizce geç
                                    }
                                    // Kanal bulunamadı durumunu sessizce geç
                                } catch (error) {
                                    logger.log(`Error updating registered panel for guild ${guild.name} (${guild.id}): ${error.message}`, 'error');
                                }
                            }
                            
                            // Kayıtlı panel yoksa veya güncellenemediyse, tüm metin kanallarında panel ara
                            if (!panelUpdated) {
                                // Log spam'ini azalt - sessizce ara
                                const textChannels = guild.channels.cache.filter(ch => ch.type === 0);
                                
                                for (const channel of textChannels.values()) {
                                    try {
                                        const result = await updateVoteEmbed(guild, channel, interaction.client);
                                        if (result === true) {
                                            updated++;
                                            panelUpdated = true;
                                            // Başarılı bulma durumunu sessizce geç
                                            break;
                                        }
                                    } catch (error) {
                                        // Bu kanalda panel yok, devam et
                                        continue;
                                    }
                                }
                            }
                            
                            if (!panelUpdated) {
                                notFound++;
                                // Log spam'ini azalt - sadece özet logla
                                // logger.log(`❌ Panel not found for guild ${guild.name} (${guild.id})`, 'warn');
                            }
                        } catch (error) {
                            failed++;
                            logger.log(`Panel update error for guild ${guildData.guildId}: ${error.message}`, 'warn');
                        }
                    }
                    
                    // Başarı mesajı
                    const successContainer = new ContainerBuilder()
                        .setAccentColor(0x00FF00)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                '### ✅ Güncelleme Tamamlandı\n\n' +
                                `**Güncellenen:** ${updated} sunucu\n` +
                                `**Başarısız:** ${failed} sunucu\n` +
                                `**Panel Bulunamadı:** ${notFound} sunucu\n\n` +
                                `Toplam ${allGuilds.length} sunucu kontrol edildi.`
                            )
                        );

                    await interaction.editReply({
                        components: [successContainer],
                        flags: [MessageFlags.IsComponentsV2]
                    });

                    logger.log(`Panel update completed: ${updated} updated, ${failed} failed, ${notFound} not found`, 'success');

                } catch (error) {
                    const logger = require('../../lib/logger');
                    logger.log(`Update all panels error: ${error.message}`, 'error');
                    
                    const errorContainer = new ContainerBuilder()
                        .setAccentColor(0xFF0000)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('### ❌ Sistem Hatası\n\nGüncelleme sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
                        );
                    
                    await interaction.editReply({
                        components: [errorContainer],
                        flags: [MessageFlags.IsComponentsV2]
                    });
                }
                return;
            }

            if (interaction.customId === 'setup_start') {
                const modal = new ModalBuilder()
                    .setCustomId('setup_modal')
                    .setTitle('Sunucu Kurulumu');

                const descriptionInput = new TextInputBuilder()
                    .setCustomId('description')
                    .setLabel('Sunucu Hakkında')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Sunucunuz hakkında kısa bir açıklama yazın...')
                    .setRequired(true)
                    .setMinLength(20)
                    .setMaxLength(500);

                const inviteInput = new TextInputBuilder()
                    .setCustomId('invite')
                    .setLabel('Davet Linki')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('https://discord.gg/...')
                    .setRequired(true)
                    .setMinLength(10)
                    .setMaxLength(100);

                const categoryInput = new TextInputBuilder()
                    .setCustomId('category')
                    .setLabel('Kategori (public/private/game)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('public, private veya game')
                    .setRequired(true)
                    .setMinLength(4)
                    .setMaxLength(7);

                const row1 = new ActionRowBuilder().addComponents(descriptionInput);
                const row2 = new ActionRowBuilder().addComponents(inviteInput);
                const row3 = new ActionRowBuilder().addComponents(categoryInput);

                modal.addComponents(row1, row2, row3);

                await interaction.showModal(modal);
            }

            if (interaction.customId === 'setup_delete_confirm') {
                await interaction.deferReply({ 
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });

                try {
                    const guildData = await GuildData.findOne({ guildId: interaction.guild.id });

                    if (!guildData) {
                        const notFoundContainer = new ContainerBuilder();
                        const notFoundDisplay = new TextDisplayBuilder()
                            .setContent(`Sunucu Bulunamadı\nSunucu zaten kayıtlı değil!`);
                        notFoundContainer.addTextDisplayComponents(notFoundDisplay);
                        
                        return await interaction.editReply({
                            components: [notFoundContainer],
                            flags: [MessageFlags.IsComponentsV2]
                        });
                    }

                    // Sunucuya ait tüm oyları sil
                    const Vote = require('../../data/schemas/vote');
                    const deletedVotes = await Vote.deleteMany({ guildId: interaction.guild.id });

                    // Sunucuya ait tüm yorumları sil
                    const Comment = require('../../data/schemas/comment');
                    const deletedComments = await Comment.deleteMany({ guildId: interaction.guild.id });

                    // Sunucu kaydını sil
                    await GuildData.deleteOne({ guildId: interaction.guild.id });

                    const settings = require('../../settings.json');
                    
                    const deleteContainer = new ContainerBuilder();
                    const deleteDisplay = new TextDisplayBuilder()
                        .setContent(`✅ Kurulum Silindi\n**${interaction.guild.name}** sunucusunun DcOyver.com kaydı başarıyla silindi!\n\n**🗑️ Silinen Veriler:**\n> ${deletedVotes.deletedCount} oy\n> ${deletedComments.deletedCount} yorum\n> Sunucu bilgileri\n\nYeniden eklemek için \`${settings.PREFIX}setup\` komutunu kullanabilirsiniz.`);
                    deleteContainer.addTextDisplayComponents(deleteDisplay);

                    await interaction.editReply({ 
                        components: [deleteContainer],
                        flags: [MessageFlags.IsComponentsV2]
                    });
                    await interaction.message.delete().catch(() => {});

                } catch (error) {
                    const logger = require('../../lib/logger');
                    logger.log(`Setup delete error: ${error.message}`, 'error');
                    
                    const errorContainer = new ContainerBuilder();
                    const errorDisplay = new TextDisplayBuilder()
                        .setContent(`Sistem Hatası\nSilme işlemi sırasında bir hata oluştu.\n\nLütfen daha sonra tekrar deneyin.`);
                    errorContainer.addTextDisplayComponents(errorDisplay);
                    
                    await interaction.editReply({
                        components: [errorContainer],
                        flags: [MessageFlags.IsComponentsV2]
                    });
                }
            }

            if (interaction.customId === 'setup_delete_cancel') {
                const cancelContainer = new ContainerBuilder();
                const cancelDisplay = new TextDisplayBuilder()
                    .setContent(`İptal Edildi\nKurulum silme işlemi iptal edildi.`);
                cancelContainer.addTextDisplayComponents(cancelDisplay);
                
                await interaction.update({
                    components: [cancelContainer],
                    flags: [MessageFlags.IsComponentsV2]
                });
            }
        }

        // String Select Menu interactions
        if (interaction.isStringSelectMenu()) {
            // UserUpdate select menü handler
            if (interaction.customId === 'userupdate_select') {
                // OWNER_IDS kontrolü
                if (!settings.OWNER_IDS || !settings.OWNER_IDS.includes(interaction.user.id)) {
                    const errorContainer = new ContainerBuilder()
                        .setAccentColor(0xFF0000)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('### ❌ Yetki Hatası\n\nBu komutu sadece bot sahipleri kullanabilir!')
                        );
                    
                    return await interaction.reply({
                        components: [errorContainer],
                        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                    });
                }

                await interaction.deferUpdate();

                const selectedValue = interaction.values[0];
                const logger = require('../../lib/logger');

                try {
                    // Güncelleme başladı mesajı
                    const updatingContainer = new ContainerBuilder()
                        .setAccentColor(0x5865F2)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                '### 🔄 Güncelleniyor...\n\n' +
                                'Seçilen güncelleme işlemi başlatıldı. Lütfen bekleyin...\n\n' +
                                'Bu işlem biraz zaman alabilir.'
                            )
                        );

                    await interaction.editReply({
                        components: [updatingContainer],
                        flags: [MessageFlags.IsComponentsV2]
                    });

                    let resultMessage = '';
                    let success = false;

                    switch (selectedValue) {
                        case 'update_guilds':
                            logger.log('🔄 Discord sunucu verileri güncelleniyor...', 'info');
                            const syncGuilds = global.syncGuilds;
                            if (syncGuilds) {
                                await syncGuilds();
                                resultMessage = '✅ **Discord Sunucu Verileri Güncellendi**\n\nTüm Discord sunucu verileri başarıyla güncellendi!';
                                success = true;
                            } else {
                                resultMessage = '❌ **Hata**\n\nSunucu senkronizasyon fonksiyonu bulunamadı!';
                            }
                            break;

                        case 'update_users':
                            logger.log('🔄 Kullanıcılar güncelleniyor...', 'info');
                            const syncUsersInterval = require('../intervals/syncUsers');
                            if (syncUsersInterval && syncUsersInterval.execute) {
                                // Kullanıcı yedeklemeyi başlat
                                await syncUsersInterval.execute(client).catch(err => {
                                    logger.log(`❌ Kullanıcı yedekleme hatası: ${err.message}`, 'error');
                                    throw err;
                                });
                                resultMessage = '✅ **Kullanıcılar Güncellendi**\n\nTüm kullanıcı verileri başarıyla güncellendi ve yedeklendi!';
                                success = true;
                            } else {
                                resultMessage = '❌ **Hata**\n\nKullanıcı senkronizasyon fonksiyonu bulunamadı!';
                            }
                            break;

                        case 'update_user_data':
                            logger.log('🔄 Kullanıcı user verileri güncelleniyor...', 'info');
                            const syncUsersInterval2 = require('../intervals/syncUsers');
                            if (syncUsersInterval2 && syncUsersInterval2.execute) {
                                // Kullanıcı yedeklemeyi başlat (banner, avatar, profil bilgileri dahil)
                                await syncUsersInterval2.execute(client).catch(err => {
                                    logger.log(`❌ Kullanıcı veri güncelleme hatası: ${err.message}`, 'error');
                                    throw err;
                                });
                                resultMessage = '✅ **Kullanıcı User Verileri Güncellendi**\n\nKullanıcıların banner, avatar ve profil bilgileri başarıyla güncellendi!';
                                success = true;
                            } else {
                                resultMessage = '❌ **Hata**\n\nKullanıcı senkronizasyon fonksiyonu bulunamadı!';
                            }
                            break;

                        case 'update_user_banners':
                            logger.log('🔄 Kullanıcı banner\'ları güncelleniyor...', 'info');
                            const syncUsersInterval3 = require('../intervals/syncUsers');
                            if (syncUsersInterval3 && syncUsersInterval3.syncUserBanners) {
                                // Banner yedeklemeyi başlat
                                const result = await syncUsersInterval3.syncUserBanners(client).catch(err => {
                                    logger.log(`❌ Banner yedekleme hatası: ${err.message}`, 'error');
                                    throw err;
                                });
                                
                                if (result) {
                                    resultMessage = `✅ **Kullanıcı Banner'ları Güncellendi**\n\n**Toplam:** ${result.total} kullanıcı kontrol edildi\n**Güncellenen:** ${result.updated} kullanıcı\n**Yeni Banner:** ${result.bannerAdded} eklendi\n**Güncellenen Banner:** ${result.bannerUpdated} güncellendi\n**Bulunamayan:** ${result.notFound} kullanıcı`;
                                } else {
                                    resultMessage = '❌ **Hata**\n\nBanner yedekleme sırasında bir hata oluştu!';
                                }
                                success = true;
                            } else {
                                resultMessage = '❌ **Hata**\n\nBanner senkronizasyon fonksiyonu bulunamadı!';
                            }
                            break;

                        case 'update_all':
                            logger.log('🔄 Tüm sistem verileri güncelleniyor...', 'info');
                            const syncGuilds2 = global.syncGuilds;
                            const syncUsersIntervalAll = require('../intervals/syncUsers');
                            
                            if (syncGuilds2) {
                                await syncGuilds2();
                                logger.log('✅ Sunucu verileri güncellendi', 'success');
                            }
                            
                            if (syncUsersIntervalAll && syncUsersIntervalAll.execute) {
                                await syncUsersIntervalAll.execute(client).catch(err => {
                                    logger.log(`❌ Kullanıcı yedekleme hatası: ${err.message}`, 'error');
                                    throw err;
                                });
                                logger.log('✅ Kullanıcı verileri güncellendi', 'success');
                            }
                            
                            resultMessage = '✅ **Tüm Sistem Verileri Güncellendi**\n\nDiscord sunucu verileri ve kullanıcı verileri başarıyla güncellendi!';
                            success = true;
                            break;

                        default:
                            resultMessage = '❌ **Geçersiz Seçim**\n\nLütfen geçerli bir seçenek seçin!';
                    }

                    // Sonuç mesajı
                    const resultContainer = new ContainerBuilder()
                        .setAccentColor(success ? 0x00FF00 : 0xFF0000)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(resultMessage)
                        );

                    await interaction.editReply({
                        components: [resultContainer],
                        flags: [MessageFlags.IsComponentsV2]
                    });

                } catch (error) {
                    logger.log(`UserUpdate select menu error: ${error.message}`, 'error');
                    logger.log(`Error stack: ${error.stack}`, 'error');
                    
                    const errorContainer = new ContainerBuilder()
                        .setAccentColor(0xFF0000)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                '### ❌ Sistem Hatası\n\n' +
                                `Güncelleme sırasında bir hata oluştu:\n\n` +
                                `**Hata:** ${error.message}\n\n` +
                                'Lütfen daha sonra tekrar deneyin.'
                            )
                        );
                    
                    await interaction.editReply({
                        components: [errorContainer],
                        flags: [MessageFlags.IsComponentsV2]
                    });
                }
                return;
            }
        }

        // Modal submissions
        if (interaction.isModalSubmit()) {
            // Yorum modal submit
            if (interaction.customId === 'comment_modal') {
                await interaction.deferReply({ 
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });

                try {
                    const commentText = interaction.fields.getTextInputValue('comment_text');
                    const ratingInput = interaction.fields.getTextInputValue('comment_rating');
                    const rating = parseInt(ratingInput);

                    // Rating kontrolü
                    if (isNaN(rating) || rating < 1 || rating > 5) {
                        const ratingErrorContainer = new ContainerBuilder();
                        const ratingErrorDisplay = new TextDisplayBuilder()
                            .setContent(`Geçersiz Puan\nLütfen 1 ile 5 arasında bir puan girin.`);
                        ratingErrorContainer.addTextDisplayComponents(ratingErrorDisplay);
                        
                        return await interaction.editReply({
                            components: [ratingErrorContainer],
                            flags: [MessageFlags.IsComponentsV2]
                        });
                    }

                    // Yorumu kaydet
                    const Comment = require('../../data/schemas/comment');
                    const settings = require('../../settings.json');

                    // 12 saatlik cooldown kontrolü
                    const lastComment = await Comment.findOne({
                        guildId: interaction.guild.id,
                        userId: interaction.user.id
                    }).sort({ createdAt: -1 });

                    if (lastComment) {
                        const now = new Date();
                        const timeDiff = now - lastComment.createdAt;
                        const hoursDiff = timeDiff / (1000 * 60 * 60);

                        if (hoursDiff < 12) {
                            const remainingHours = Math.ceil(12 - hoursDiff);
                            const cooldownContainer = new ContainerBuilder();
                            const cooldownDisplay = new TextDisplayBuilder()
                                .setContent(`Bekleme Süresi\nBu sunucuya tekrar yorum yapabilmek için **${remainingHours} saat** daha beklemelisiniz.\n\nSon yorum zamanınız: <t:${Math.floor(lastComment.createdAt.getTime() / 1000)}:R>`);
                            cooldownContainer.addTextDisplayComponents(cooldownDisplay);
                            
                            return await interaction.editReply({
                                components: [cooldownContainer],
                                flags: [MessageFlags.IsComponentsV2]
                            });
                        }
                    }

                    // Yorumu oluştur
                    const comment = new Comment({
                        guildId: interaction.guild.id,
                        userId: interaction.user.id,
                        username: interaction.user.username,
                        avatar: interaction.user.avatar,
                        avatarUrl: interaction.user.displayAvatarURL(),
                        content: commentText,
                        rating: rating
                    });

                    await comment.save();

                    // Yorumu log kanalına gönder
                    try {
                        const logGuild = await interaction.client.guilds.fetch(settings.COMMENT_LOG_GUILD_ID).catch(() => null);
                        if (!logGuild) {
                            throw new Error('Log guild not found');
                        }
                        
                        const logChannel = await logGuild.channels.fetch(settings.COMMENT_LOG_CHANNEL_ID).catch(() => null);
                        if (!logChannel) {
                            throw new Error('Log channel not found');
                        }

                        // Components V2 ile detaylı log mesajı
                        const logContainer = new ContainerBuilder();

                        // Sunucu bilgisi ve yorum başlığı
                        const guildIcon = interaction.guild.iconURL() ? `[${interaction.guild.name}](${interaction.guild.iconURL()})` : interaction.guild.name;
                        const logTitle = new TextDisplayBuilder()
                            .setContent(`${guildIcon} adlı sunucuya yorum yaptı!`);
                        logContainer.addTextDisplayComponents(logTitle);

                        // Yorum içeriği
                        const logContent = new TextDisplayBuilder()
                            .setContent(`${commentText}`);
                        logContainer.addTextDisplayComponents(logContent);

                        // Rating (yıldızlar) - 5 yıldız göster
                        const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
                        const logRating = new TextDisplayBuilder()
                            .setContent(`${stars}`);
                        logContainer.addTextDisplayComponents(logRating);

                        // Yorum ID ve zaman
                        const today = new Date();
                        const timeStr = today.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                        const logFooter = new TextDisplayBuilder()
                            .setContent(`Yorum ID: ${comment.commentId} • bugün saat ${timeStr}`);
                        logContainer.addTextDisplayComponents(logFooter);

                        // Mesajı gönder - Components V2'de content kullanılamaz, sadece components
                        await logChannel.send({
                            components: [logContainer],
                            flags: [MessageFlags.IsComponentsV2]
                        });
                    } catch (logError) {
                        const logger = require('../../lib/logger');
                        logger.log(`Comment log error: ${logError.message}`, 'error');
                    }

                    // Başarı mesajı
                    const successContainer = new ContainerBuilder();
                    const successDisplay = new TextDisplayBuilder()
                        .setContent(`✅ Yorum Gönderildi\n**${interaction.guild.name}** sunucusuna yorumunuz başarıyla gönderildi!\n\n**📝 Yorum:** ${commentText.length > 100 ? commentText.substring(0, 100) + '...' : commentText}\n**⭐ Puan:** ${rating}/5\n**🆔 Yorum ID:** ${comment.commentId}`);
                    successContainer.addTextDisplayComponents(successDisplay);

                    await interaction.editReply({
                        components: [successContainer],
                        flags: [MessageFlags.IsComponentsV2]
                    });

                } catch (error) {
                    const logger = require('../../lib/logger');
                    logger.log(`Comment modal error: ${error.message}`, 'error');
                    
                    const errorContainer = new ContainerBuilder();
                    const errorDisplay = new TextDisplayBuilder()
                        .setContent(`Sistem Hatası\nYorum gönderilirken bir hata oluştu.\n\nLütfen daha sonra tekrar deneyin.`);
                    errorContainer.addTextDisplayComponents(errorDisplay);
                    
                    await interaction.editReply({
                        components: [errorContainer],
                        flags: [MessageFlags.IsComponentsV2]
                    });
                }
                return;
            }

            if (interaction.customId === 'setup_modal') {
                await interaction.deferReply({ 
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });

                const description = interaction.fields.getTextInputValue('description');
                const invite = interaction.fields.getTextInputValue('invite');
                const category = interaction.fields.getTextInputValue('category').toLowerCase();

                // Kategori kontrolü
                if (!['public', 'private', 'game'].includes(category)) {
                    const categoryErrorContainer = new ContainerBuilder();
                    const categoryErrorDisplay = new TextDisplayBuilder()
                        .setContent(`Geçersiz Kategori\nLütfen \`public\`, \`private\` veya \`game\` yazın.`);
                    categoryErrorContainer.addTextDisplayComponents(categoryErrorDisplay);
                    
                    return await interaction.editReply({
                        components: [categoryErrorContainer],
                        flags: [MessageFlags.IsComponentsV2]
                    });
                }

                // Davet linki kontrolü
                if (!invite.includes('discord.gg/') && !invite.includes('discord.com/invite/')) {
                    const inviteErrorContainer = new ContainerBuilder();
                    const inviteErrorDisplay = new TextDisplayBuilder()
                        .setContent(`Geçersiz Davet Linki\nDiscord davet linki olmalı.\n\nÖrnek: https://discord.gg/xxxxx`);
                    inviteErrorContainer.addTextDisplayComponents(inviteErrorDisplay);
                    
                    return await interaction.editReply({
                        components: [inviteErrorContainer],
                        flags: [MessageFlags.IsComponentsV2]
                    });
                }

                try {
                    let guildData = await GuildData.findOne({ guildId: interaction.guild.id });

                    if (!guildData) {
                        guildData = new GuildData({
                            guildId: interaction.guild.id,
                            name: interaction.guild.name,
                            memberCount: interaction.guild.memberCount,
                            ownerId: interaction.guild.ownerId,
                            guildCreatedAt: interaction.guild.createdAt,
                            iconURL: interaction.guild.iconURL() || null,
                            bannerURL: interaction.guild.bannerURL() || null
                        });
                    } else {
                        if (!guildData.ownerId) guildData.ownerId = interaction.guild.ownerId;
                        if (!guildData.guildCreatedAt) guildData.guildCreatedAt = interaction.guild.createdAt;
                        // Icon ve banner'ı güncelle
                        guildData.iconURL = interaction.guild.iconURL() || guildData.iconURL || null;
                        guildData.bannerURL = interaction.guild.bannerURL() || guildData.bannerURL || null;
                    }

                    guildData.description = description;
                    guildData.inviteURL = invite;
                    guildData.category = category;
                    guildData.isSetup = true;
                    guildData.setupBy = interaction.user.id;
                    guildData.setupAt = new Date();
                    
                    // Başvuru paneli için onay bekliyor durumuna al
                    guildData.approvalStatus = 'pending';
                    guildData.isActive = false; // Onaylanana kadar aktif değil
                    guildData.requestedAt = new Date(); // Başvuru tarihi

                    await guildData.save();
                    
                    const logger = require('../../lib/logger');
                    logger.log(`✅ Sunucu başvuru paneli için kaydedildi: ${interaction.guild.name} (${interaction.guild.id}) - Onay bekliyor`, 'info');

                    const categoryEmojis = {
                        public: '🌐',
                        private: '🔒',
                        game: '🎮'
                    };

                    const categoryNames = {
                        public: 'Genel',
                        private: 'Özel',
                        game: 'Oyun'
                    };

                    const successContainer = new ContainerBuilder();
                    const successDisplay = new TextDisplayBuilder()
                        .setContent(`✅ Kurulum Tamamlandı\n**${interaction.guild.name}** başarıyla DcOyver.com'a eklendi!\n\n**📝 Açıklama:** ${description.length > 150 ? description.substring(0, 150) + '...' : description}\n**${categoryEmojis[category]} Kategori:** ${categoryNames[category]}\n**👤 Kuran:** <@${interaction.user.id}>\n\n⏳ **Onay Bekleniyor**\nSunucunuz admin onayından sonra web sitesinde görünecektir. Onaylandıktan sonra kullanıcılar sunucunuza oy verebilecek!\n\n[🌐 Başvuru Durumu](${settings.WEBSITE_URL}/basvuru-paneli)`);
                    successContainer.addTextDisplayComponents(successDisplay);

                    await interaction.editReply({ 
                        components: [successContainer],
                        flags: [MessageFlags.IsComponentsV2]
                    });

                    // Genel kanala bilgilendirme mesajı
                    if (interaction.channel.permissionsFor(interaction.guild.members.me).has('SendMessages')) {
                        const publicContainer = new ContainerBuilder();
                        const publicDisplay = new TextDisplayBuilder()
                            .setContent(`🎉 Sunucu DcOyver.com'a Eklendi!\n\nBu sunucu admin onayından sonra [DcOyver.com](${settings.WEBSITE_URL}) üzerinde listelenecek!\n\n⏳ **Onay Bekleniyor** - Onaylandıktan sonra kullanıcılar \`${settings.PREFIX}oyver\` komutu ile oy verebilecek.`);
                        publicContainer.addTextDisplayComponents(publicDisplay);

                        await interaction.channel.send({ 
                            components: [publicContainer],
                            flags: [MessageFlags.IsComponentsV2]
                        });
                    }

                } catch (error) {
                    const logger = require('../../lib/logger');
                    logger.log(`❌ Setup modal error: ${error.message}`, 'error');
                    logger.log(`❌ Setup modal error stack: ${error.stack}`, 'error');
                    console.error('Setup modal error details:', error);
                    
                    const errorContainer = new ContainerBuilder();
                    const errorDisplay = new TextDisplayBuilder()
                        .setContent(`Sistem Hatası\nKurulum sırasında bir hata oluştu.\n\n**Hata:** ${error.message}\n\nLütfen daha sonra tekrar deneyin veya bir yöneticiye bildirin.`);
                    errorContainer.addTextDisplayComponents(errorDisplay);
                    
                    await interaction.editReply({
                        components: [errorContainer],
                        flags: [MessageFlags.IsComponentsV2]
                    });
                }
            }
            
            // Onay/Red butonları kaldırıldı - Sadece web'den onay/red yapılacak
            // Web'den onay/red için: https://dcoyver.com/basvuru-paneli
            if (false && interaction.customId.startsWith('approve_guild_')) {
                const logger = require('../../lib/logger');
                const guildId = interaction.customId.replace('approve_guild_', '');
                
                try {
                    logger.log(`🔔 Onay butonu tıklandı: ${guildId} - Kullanıcı: ${interaction.user.tag} (${interaction.user.id})`, 'info');
                    logger.log(`🔔 Interaction detayları: replied=${interaction.replied}, deferred=${interaction.deferred}`, 'info');
                    
                    // Önce interaction'ı defer et (3 saniye içinde yanıt vermemiz gerekiyor)
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.deferUpdate();
                        logger.log(`✅ Interaction defer edildi`, 'info');
                    }
                    
                    // Admin kontrolü
                    const adminIds = settings.OWNER_IDS || [];
                    logger.log(`🔔 Admin ID'ler: ${JSON.stringify(adminIds)}`, 'info');
                    logger.log(`🔔 Kullanıcı ID: ${interaction.user.id}`, 'info');
                    
                    if (!adminIds.includes(interaction.user.id)) {
                        logger.log(`❌ Yetki hatası: ${interaction.user.tag} (${interaction.user.id}) admin değil`, 'warn');
                        const errorContainer = new ContainerBuilder();
                        const errorDisplay = new TextDisplayBuilder()
                            .setContent(`Yetki Hatası\nBu işlemi yapmak için yönetici yetkisine sahip olmalısınız.`);
                        errorContainer.addTextDisplayComponents(errorDisplay);
                        
                        try {
                            if (interaction.deferred) {
                                await interaction.editReply({
                                    components: [errorContainer],
                                    flags: [MessageFlags.IsComponentsV2]
                                });
                            } else {
                                await interaction.reply({
                                    components: [errorContainer],
                                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                                });
                            }
                        } catch (replyError) {
                            logger.log(`❌ Yanıt gönderme hatası: ${replyError.message}`, 'error');
                        }
                        return;
                    }
                    
                    // Guild verisini bul ve onayla
                    logger.log(`🔍 Guild verisi aranıyor: ${guildId}`, 'info');
                    const guildData = await GuildData.findOne({ guildId });
                    if (!guildData) {
                        logger.log(`❌ Guild bulunamadı: ${guildId}`, 'error');
                        const errorContainer = new ContainerBuilder();
                        const errorDisplay = new TextDisplayBuilder()
                            .setContent(`Hata\nSunucu bulunamadı.`);
                        errorContainer.addTextDisplayComponents(errorDisplay);
                        
                        try {
                            if (interaction.deferred) {
                                await interaction.editReply({
                                    components: [errorContainer],
                                    flags: [MessageFlags.IsComponentsV2]
                                });
                            } else {
                                await interaction.reply({
                                    components: [errorContainer],
                                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                                });
                            }
                        } catch (replyError) {
                            logger.log(`❌ Yanıt gönderme hatası: ${replyError.message}`, 'error');
                        }
                        return;
                    }
                    
                    logger.log(`✅ Guild bulundu: ${guildData.name} - Mevcut durum: ${guildData.approvalStatus}`, 'info');
                    
                    if (guildData.approvalStatus === 'approved') {
                        logger.log(`⚠️ Guild zaten onaylanmış: ${guildId}`, 'warn');
                        const errorContainer = new ContainerBuilder();
                        const errorDisplay = new TextDisplayBuilder()
                            .setContent(`Bilgi\nBu sunucu zaten onaylanmış.`);
                        errorContainer.addTextDisplayComponents(errorDisplay);
                        
                        try {
                            if (interaction.deferred) {
                                await interaction.editReply({
                                    components: [errorContainer],
                                    flags: [MessageFlags.IsComponentsV2]
                                });
                            } else {
                                await interaction.reply({
                                    components: [errorContainer],
                                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                                });
                            }
                        } catch (replyError) {
                            logger.log(`❌ Yanıt gönderme hatası: ${replyError.message}`, 'error');
                        }
                        return;
                    }
                    
                    // Onayla
                    guildData.isApproved = true;
                    guildData.approvalStatus = 'approved';
                    guildData.approvedAt = new Date();
                    guildData.approvedBy = interaction.user.id;
                    
                    // Discord sunucusunu al
                    const discordGuild = await client.guilds.fetch(guildId).catch(() => null);
                    
                    // Davet linkini sınırsız oluştur
                    let inviteURL = guildData.inviteURL;
                    if (discordGuild) {
                        try {
                            // Önce vanity URL kontrolü
                            try {
                                const vanityData = await discordGuild.fetchVanityData();
                                if (vanityData && vanityData.code) {
                                    inviteURL = `https://discord.gg/${vanityData.code}`;
                                    logger.log(`✅ Vanity URL bulundu: ${inviteURL}`, 'success');
                                }
                            } catch (vanityError) {
                                // Vanity URL yoksa normal davet linki oluştur
                            }
                            
                            // Eğer vanity URL yoksa, sınırsız davet linki oluştur
                            if (!inviteURL || !inviteURL.includes('discord.gg/')) {
                                await discordGuild.channels.fetch();
                                const botMember = discordGuild.members.me;
                                
                                if (botMember) {
                                    const textChannel = discordGuild.channels.cache
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
                                        logger.log(`✅ Sınırsız davet linki oluşturuldu: ${inviteURL}`, 'success');
                                    }
                                }
                            }
                            
                            guildData.inviteURL = inviteURL;
                        } catch (inviteError) {
                            logger.log(`⚠️ Davet linki oluşturma hatası: ${inviteError.message}`, 'warn');
                        }
                    }
                    
                    // Setup yap
                    guildData.isSetup = true;
                    guildData.setupBy = interaction.user.id;
                    guildData.setupAt = new Date();
                    
                    await guildData.save();
                    
                    // Web'e senkronize et
                    if (syncGuilds && typeof syncGuilds === 'function') {
                        await syncGuilds();
                    }
                    
                    // Orijinal mesajı güncelle (butonları kaldır)
                    if (guildData.approvalMessageId) {
                        try {
                            const logGuild = await client.guilds.fetch(settings.GUILD_JOIN_LOG_GUILD_ID || settings.COMMENT_LOG_GUILD_ID);
                            const logChannel = await logGuild.channels.fetch(settings.GUILD_JOIN_LOG_CHANNEL_ID);
                            const approvalMessage = await logChannel.messages.fetch(guildData.approvalMessageId);
                            
                            const approvedContainer = new ContainerBuilder();
                            const approvedDisplay = new TextDisplayBuilder()
                                .setContent(`✅ **Sunucu Onaylandı**\n\n**📛 Sunucu:** ${guildData.name}\n**🆔 ID:** \`${guildId}\`\n**✅ Onaylayan:** <@${interaction.user.id}>\n**🕐 Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>\n**🔗 Davet Linki:** ${inviteURL || 'Oluşturulamadı'}\n\n✅ Bu sunucu artık web sitesinde görünecek ve setup yapıldı.`);
                            approvedContainer.addTextDisplayComponents(approvedDisplay);
                            
                            await approvalMessage.edit({
                                components: [approvedContainer],
                                flags: [MessageFlags.IsComponentsV2]
                            });
                            
                            logger.log(`✅ Onay mesajı güncellendi: ${guildData.name} (${guildId}) - Log kanalı: ${settings.GUILD_JOIN_LOG_CHANNEL_ID}`, 'success');
                        } catch (messageError) {
                            logger.log(`Onay mesajı güncelleme hatası: ${messageError.message}`, 'warn');
                        }
                    }
                    
                    // Interaction'ı güncelle
                    logger.log(`📝 Interaction güncelleniyor...`, 'info');
                    const successContainer = new ContainerBuilder();
                    const successDisplay = new TextDisplayBuilder()
                        .setContent(`✅ **Sunucu Onaylandı**\n\n**📛 Sunucu:** ${guildData.name}\n**🆔 ID:** \`${guildId}\`\n**✅ Onaylayan:** <@${interaction.user.id}>\n**🕐 Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>\n**🔗 Davet Linki:** ${inviteURL || 'Oluşturulamadı'}\n\n✅ Bu sunucu artık web sitesinde görünecek ve setup yapıldı.`);
                    successContainer.addTextDisplayComponents(successDisplay);
                    
                    try {
                        if (interaction.deferred) {
                            await interaction.editReply({
                                components: [successContainer],
                                flags: [MessageFlags.IsComponentsV2]
                            });
                            logger.log(`✅ Deferred interaction güncellendi`, 'success');
                        } else {
                            await interaction.update({
                                components: [successContainer],
                                flags: [MessageFlags.IsComponentsV2]
                            });
                            logger.log(`✅ Interaction update edildi`, 'success');
                        }
                    } catch (updateError) {
                        logger.log(`❌ Interaction güncelleme hatası: ${updateError.message}`, 'error');
                        logger.log(`❌ Stack: ${updateError.stack}`, 'error');
                        throw updateError;
                    }
                    
                    logger.log(`✅ Sunucu onaylandı: ${guildData.name} (${guildId}) - Onaylayan: ${interaction.user.tag}`, 'success');
                } catch (error) {
                    logger.log(`❌ Approve guild error: ${error.message}`, 'error');
                    logger.log(`❌ Error stack: ${error.stack}`, 'error');
                    logger.log(`❌ Error name: ${error.name}`, 'error');
                    
                    const errorContainer = new ContainerBuilder();
                    const errorDisplay = new TextDisplayBuilder()
                        .setContent(`Sistem Hatası\nOnaylama işlemi sırasında bir hata oluştu.\n\nHata: ${error.message}`);
                    errorContainer.addTextDisplayComponents(errorDisplay);
                    
                    try {
                        if (interaction.deferred) {
                            await interaction.editReply({
                                components: [errorContainer],
                                flags: [MessageFlags.IsComponentsV2]
                            });
                        } else if (!interaction.replied) {
                            await interaction.reply({
                                components: [errorContainer],
                                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                            });
                        }
                    } catch (replyError) {
                        logger.log(`❌ Hata yanıtı gönderilemedi: ${replyError.message}`, 'error');
                    }
                }
            }
            
            // Reddet butonu kaldırıldı - Sadece web'den red yapılacak
            if (false && interaction.customId.startsWith('reject_guild_')) {
                const logger = require('../../lib/logger');
                const guildId = interaction.customId.replace('reject_guild_', '');
                
                try {
                    logger.log(`🔔 Red butonu tıklandı: ${guildId} - Kullanıcı: ${interaction.user.tag} (${interaction.user.id})`, 'info');
                    logger.log(`🔔 Interaction detayları: replied=${interaction.replied}, deferred=${interaction.deferred}`, 'info');
                    
                    // Admin kontrolü
                    const adminIds = settings.OWNER_IDS || [];
                    logger.log(`🔔 Admin ID'ler: ${JSON.stringify(adminIds)}`, 'info');
                    logger.log(`🔔 Kullanıcı ID: ${interaction.user.id}`, 'info');
                    
                    if (!adminIds.includes(interaction.user.id)) {
                        logger.log(`❌ Yetki hatası: ${interaction.user.tag} (${interaction.user.id}) admin değil`, 'warn');
                        const errorContainer = new ContainerBuilder();
                        const errorDisplay = new TextDisplayBuilder()
                            .setContent(`Yetki Hatası\nBu işlemi yapmak için yönetici yetkisine sahip olmalısınız.`);
                        errorContainer.addTextDisplayComponents(errorDisplay);
                        
                        try {
                            if (!interaction.replied && !interaction.deferred) {
                                await interaction.reply({
                                    components: [errorContainer],
                                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                                });
                            }
                        } catch (replyError) {
                            logger.log(`❌ Yanıt gönderme hatası: ${replyError.message}`, 'error');
                        }
                        return;
                    }
                    
                    // Modal göster - reddetme nedeni için
                    logger.log(`📝 Modal gösteriliyor...`, 'info');
                    const modal = new ModalBuilder()
                        .setCustomId(`reject_modal_${guildId}`)
                        .setTitle('Sunucu Reddetme');
                    
                    const reasonInput = new TextInputBuilder()
                        .setCustomId('rejection_reason')
                        .setLabel('Reddetme Nedeni')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('Sunucuyu neden reddediyorsunuz? (Opsiyonel)')
                        .setRequired(false)
                        .setMaxLength(500);
                    
                    const reasonRow = new ActionRowBuilder().addComponents(reasonInput);
                    modal.addComponents(reasonRow);
                    
                    await interaction.showModal(modal);
                    logger.log(`✅ Modal gösterildi`, 'success');
                } catch (error) {
                    logger.log(`❌ Reject guild modal error: ${error.message}`, 'error');
                    logger.log(`❌ Error stack: ${error.stack}`, 'error');
                    logger.log(`❌ Error name: ${error.name}`, 'error');
                    
                    try {
                        const errorContainer = new ContainerBuilder();
                        const errorDisplay = new TextDisplayBuilder()
                            .setContent(`Sistem Hatası\nModal gösterilirken bir hata oluştu.\n\nHata: ${error.message}`);
                        errorContainer.addTextDisplayComponents(errorDisplay);
                        
                        if (!interaction.replied && !interaction.deferred) {
                            await interaction.reply({
                                components: [errorContainer],
                                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                            });
                        }
                    } catch (replyError) {
                        logger.log(`❌ Hata yanıtı gönderilemedi: ${replyError.message}`, 'error');
                    }
                }
            }
            
            // Reddetme modal submit kaldırıldı - Sadece web'den red yapılacak
            if (false && interaction.isModalSubmit() && interaction.customId.startsWith('reject_modal_')) {
                const logger = require('../../lib/logger');
                const guildId = interaction.customId.replace('reject_modal_', '');
                
                try {
                    logger.log(`🔔 Red modal submit: ${guildId} - Kullanıcı: ${interaction.user.tag} (${interaction.user.id})`, 'info');
                    
                    const rejectionReason = interaction.fields.getTextInputValue('rejection_reason') || 'Neden belirtilmedi';
                    logger.log(`📝 Reddetme nedeni: ${rejectionReason}`, 'info');
                    
                    // Önce interaction'ı defer et
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.deferReply({ ephemeral: true });
                        logger.log(`✅ Interaction defer edildi`, 'info');
                    }
                    
                    // Admin kontrolü
                    const adminIds = settings.OWNER_IDS || [];
                    logger.log(`🔔 Admin ID'ler: ${JSON.stringify(adminIds)}`, 'info');
                    
                    if (!adminIds.includes(interaction.user.id)) {
                        logger.log(`❌ Yetki hatası: ${interaction.user.tag} (${interaction.user.id}) admin değil`, 'warn');
                        const errorContainer = new ContainerBuilder();
                        const errorDisplay = new TextDisplayBuilder()
                            .setContent(`Yetki Hatası\nBu işlemi yapmak için yönetici yetkisine sahip olmalısınız.`);
                        errorContainer.addTextDisplayComponents(errorDisplay);
                        
                        try {
                            if (interaction.deferred) {
                                await interaction.editReply({
                                    components: [errorContainer],
                                    flags: [MessageFlags.IsComponentsV2]
                                });
                            } else {
                                await interaction.reply({
                                    components: [errorContainer],
                                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                                });
                            }
                        } catch (replyError) {
                            logger.log(`❌ Yanıt gönderme hatası: ${replyError.message}`, 'error');
                        }
                        return;
                    }
                    
                    // Guild verisini bul ve reddet
                    logger.log(`🔍 Guild verisi aranıyor: ${guildId}`, 'info');
                    const guildData = await GuildData.findOne({ guildId });
                    if (!guildData) {
                        logger.log(`❌ Guild bulunamadı: ${guildId}`, 'error');
                        const errorContainer = new ContainerBuilder();
                        const errorDisplay = new TextDisplayBuilder()
                            .setContent(`Hata\nSunucu bulunamadı.`);
                        errorContainer.addTextDisplayComponents(errorDisplay);
                        
                        try {
                            if (interaction.deferred) {
                                await interaction.editReply({
                                    components: [errorContainer],
                                    flags: [MessageFlags.IsComponentsV2]
                                });
                            } else {
                                await interaction.reply({
                                    components: [errorContainer],
                                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                                });
                            }
                        } catch (replyError) {
                            logger.log(`❌ Yanıt gönderme hatası: ${replyError.message}`, 'error');
                        }
                        return;
                    }
                    
                    logger.log(`✅ Guild bulundu: ${guildData.name} - Mevcut durum: ${guildData.approvalStatus}`, 'info');
                    
                    if (guildData.approvalStatus === 'rejected') {
                        logger.log(`⚠️ Guild zaten reddedilmiş: ${guildId}`, 'warn');
                        const errorContainer = new ContainerBuilder();
                        const errorDisplay = new TextDisplayBuilder()
                            .setContent(`Bilgi\nBu sunucu zaten reddedilmiş.`);
                        errorContainer.addTextDisplayComponents(errorDisplay);
                        
                        try {
                            if (interaction.deferred) {
                                await interaction.editReply({
                                    components: [errorContainer],
                                    flags: [MessageFlags.IsComponentsV2]
                                });
                            } else {
                                await interaction.reply({
                                    components: [errorContainer],
                                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                                });
                            }
                        } catch (replyError) {
                            logger.log(`❌ Yanıt gönderme hatası: ${replyError.message}`, 'error');
                        }
                        return;
                    }
                    
                    // Reddet
                    guildData.isApproved = false;
                    guildData.approvalStatus = 'rejected';
                    guildData.rejectedAt = new Date();
                    guildData.rejectedBy = interaction.user.id;
                    guildData.rejectionReason = rejectionReason;
                    await guildData.save();
                    
                    // Onay mesajını bul ve güncelle (butonları kaldır)
                    if (guildData.approvalMessageId) {
                        try {
                            const logGuild = await client.guilds.fetch(settings.GUILD_JOIN_LOG_GUILD_ID || settings.COMMENT_LOG_GUILD_ID);
                            const logChannel = await logGuild.channels.fetch(settings.GUILD_JOIN_LOG_CHANNEL_ID);
                            const approvalMessage = await logChannel.messages.fetch(guildData.approvalMessageId);
                            
                            const rejectedContainer = new ContainerBuilder();
                            const rejectedDisplay = new TextDisplayBuilder()
                                .setContent(`❌ **Sunucu Reddedildi**\n\n**📛 Sunucu:** ${guildData.name}\n**🆔 ID:** \`${guildId}\`\n**❌ Reddeden:** <@${interaction.user.id}>\n**📝 Neden:** ${rejectionReason}\n**🕐 Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>`);
                            rejectedContainer.addTextDisplayComponents(rejectedDisplay);
                            
                            await approvalMessage.edit({
                                components: [rejectedContainer],
                                flags: [MessageFlags.IsComponentsV2]
                            });
                            
                            logger.log(`❌ Red mesajı güncellendi: ${guildData.name} (${guildId}) - Log kanalı: ${settings.GUILD_JOIN_LOG_CHANNEL_ID}`, 'success');
                        } catch (messageError) {
                            logger.log(`Onay mesajı güncelleme hatası: ${messageError.message}`, 'warn');
                        }
                    }
                    
                    // Modal yanıtı
                    logger.log(`📝 Modal yanıtı gönderiliyor...`, 'info');
                    const successContainer = new ContainerBuilder();
                    const successDisplay = new TextDisplayBuilder()
                        .setContent(`✅ **Sunucu Reddedildi**\n\n**📛 Sunucu:** ${guildData.name}\n**📝 Neden:** ${rejectionReason}\n\nBu sunucu web sitesinde görünmeyecek.`);
                    successContainer.addTextDisplayComponents(successDisplay);
                    
                    try {
                        if (interaction.deferred) {
                            await interaction.editReply({
                                components: [successContainer],
                                flags: [MessageFlags.IsComponentsV2]
                            });
                            logger.log(`✅ Deferred interaction güncellendi`, 'success');
                        } else {
                            await interaction.reply({
                                components: [successContainer],
                                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                            });
                            logger.log(`✅ Interaction reply edildi`, 'success');
                        }
                    } catch (replyError) {
                        logger.log(`❌ Modal yanıtı gönderme hatası: ${replyError.message}`, 'error');
                        logger.log(`❌ Stack: ${replyError.stack}`, 'error');
                        throw replyError;
                    }
                    
                    logger.log(`❌ Sunucu reddedildi: ${guildData.name} (${guildId}) - Reddeden: ${interaction.user.tag} - Neden: ${rejectionReason}`, 'info');
                } catch (error) {
                    logger.log(`❌ Reject guild error: ${error.message}`, 'error');
                    logger.log(`❌ Error stack: ${error.stack}`, 'error');
                    logger.log(`❌ Error name: ${error.name}`, 'error');
                    
                    const errorContainer = new ContainerBuilder();
                    const errorDisplay = new TextDisplayBuilder()
                        .setContent(`Sistem Hatası\nReddetme işlemi sırasında bir hata oluştu.\n\nHata: ${error.message}`);
                    errorContainer.addTextDisplayComponents(errorDisplay);
                    
                    try {
                        if (interaction.deferred) {
                            await interaction.editReply({
                                components: [errorContainer],
                                flags: [MessageFlags.IsComponentsV2]
                            });
                        } else if (!interaction.replied) {
                            await interaction.reply({
                                components: [errorContainer],
                                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                            });
                        }
                    } catch (replyError) {
                        logger.log(`❌ Hata yanıtı gönderilemedi: ${replyError.message}`, 'error');
                    }
                }
            }
        }
    }
};
