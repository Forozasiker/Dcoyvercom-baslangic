const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    ThumbnailBuilder, 
    SectionBuilder, 
    MessageFlags, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder
} = require('discord.js');
const GuildData = require('../../data/schemas/guild');
const Vote = require('../../data/schemas/vote');

module.exports = {
    name: 'updateVotePanels',
    interval: 5 * 1000, // 5 saniye
    
    async execute(client) {
        try {
            const logger = global.logger;
            // Tüm setup yapılmış sunucuları al - MongoDB'den direkt
            const guilds = await GuildData.find({ isSetup: true, isActive: true }).lean();
            
            // Log spam'ini azalt - sadece önemli durumlarda logla
            // if (logger) {
            //     logger.log(`updateVotePanels: ${guilds.length} sunucu kontrol ediliyor...`, 'info');
            // }
            
            for (const guildData of guilds) {
                try {
                    const guild = client.guilds.cache.get(guildData.guildId);
                    
                    if (!guild) {
                        continue;
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

                    // Panel mesaj ID'si varsa direkt güncelle
                    if (guildData.votePanelMessageId && guildData.votePanelChannelId) {
                        try {
                            const channel = guild.channels.cache.get(guildData.votePanelChannelId);
                            if (!channel) {
                                // Kanal bulunamadı, ID'leri temizle
                                await GuildData.findOneAndUpdate(
                                    { guildId: guild.id },
                                    { votePanelMessageId: null, votePanelChannelId: null }
                                );
                                continue;
                            }

                            const panelMessage = await channel.messages.fetch(guildData.votePanelMessageId).catch(() => null);
                            if (!panelMessage) {
                                // Mesaj bulunamadı, ID'leri temizle
                                await GuildData.findOneAndUpdate(
                                    { guildId: guild.id },
                                    { votePanelMessageId: null, votePanelChannelId: null }
                                );
                                continue;
                            }

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

                            // Mesajı güncelle
                            await panelMessage.edit({
                                components: [container],
                                flags: [MessageFlags.IsComponentsV2]
                            }).catch(err => {
                                const logger = global.logger;
                                if (logger) {
                                    logger.log(`Panel edit error for ${guild.name}: ${err.message}`, 'error');
                                }
                            });
                            
                            // Log spam'ini azalt - sadece önemli durumlarda logla
                            // const logger = global.logger;
                            // if (logger) {
                            //     logger.log(`Panel güncellendi: ${guild.name} (${totalVotes} oy)`, 'info');
                            // }
                            
                            continue; // Başarılı, diğer sunucuya geç
                        } catch (err) {
                            // Hata durumunda ID'leri temizle ve devam et
                            await GuildData.findOneAndUpdate(
                                { guildId: guild.id },
                                { votePanelMessageId: null, votePanelChannelId: null }
                            ).catch(() => {});
                            continue;
                        }
                    }

                    // Panel mesaj ID'si yoksa, tüm kanallarda ara (geriye dönük uyumluluk)
                    const channels = guild.channels.cache.filter(ch => ch.isTextBased() && ch.viewable);
                    
                    for (const channel of channels.values()) {
                        try {
                            // Son 50 mesajı kontrol et
                            const messages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
                            if (!messages) continue;
                            
                            for (const message of messages.values()) {
                                // Bot tarafından gönderilmiş ve Components V2 içeren mesajları kontrol et
                                if (message.author.bot && message.components && message.components.length > 0) {
                                    const hasComponentsV2 = message.flags && message.flags.has(MessageFlags.IsComponentsV2);
                                    
                                    if (hasComponentsV2) {
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

                                            // Oy verme paneli bulundu, güncelle - ÖRNEK.js stilinde
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
                                                            new ThumbnailBuilder().setURL(guildIcon2)
                                                        )
                                                )
                                                .addSeparatorComponents(new SeparatorBuilder())
                                                .addSectionComponents(
                                                    new SectionBuilder()
                                                        .addTextDisplayComponents(
                                                            new TextDisplayBuilder().setContent(
                                                                `#<a:Kalp:1445523676991848488> Oy Verenler Sıralaması\n\n${votersList}\n` +
                                                                `<a:Kystat:1438738305712787467> Toplam ${allVotes.length > 0 ? Object.keys(userVoteCounts).length : 0} farklı kullanıcı oy vermiş!`
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

                                            // Mesajı güncelle
                                            await message.edit({
                                                components: [container],
                                                flags: [MessageFlags.IsComponentsV2]
                                            }).catch(() => {});
                                            
                                            // Bir kanalda bir panel bulundu, diğer kanallara bakmaya gerek yok
                                            break;
                                        }
                                    }
                                }
                            }
                        } catch (err) {
                            // Kanal hatası, devam et
                            continue;
                        }
                    }
                } catch (error) {
                    // Sunucu hatası, devam et
                    continue;
                }
            }
        } catch (error) {
            // Genel hata - logla
            const logger = global.logger;
            if (logger) {
                logger.log(`updateVotePanels general error: ${error.message}`, 'error');
            }
        }
    }
};

