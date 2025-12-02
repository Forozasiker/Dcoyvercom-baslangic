const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    ThumbnailBuilder, 
    SectionBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionFlagsBits, 
    MessageFlags,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder
} = require('discord.js');
const GuildData = require('../../../data/schemas/guild');

module.exports = {
    name: 'oyver',
    description: 'Oy verme panelini oluşturur (Sadece yöneticiler)',
    
    async execute(message) {
        try {
            // Yönetici kontrolü
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                const errorContainer = new ContainerBuilder()
                    .setAccentColor(0xFF0000)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('### ❌ Yetki Hatası\n\nBu komutu kullanmak için yönetici olmalısınız!')
                    );
                
                const reply = await message.reply({ 
                    components: [errorContainer],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
                setTimeout(() => reply.delete().catch(() => {}), 5000);
                return;
            }

            // Sunucu kayıtlı mı kontrol et
            const guildData = await GuildData.findOne({ guildId: message.guild.id });
            
            if (!guildData || !guildData.isSetup) {
                const notSetupContainer = new ContainerBuilder()
                    .setAccentColor(0xFFA500)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('### <a:icon:1438723312250388531> Sunucu Kayıtlı Değil')
                    )
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    '## <:support:1438738595945910412> Yapmanız Gerekenler\n' +
                                    '<a:tagged1:1438758589002154036> Yöneticiler `.setup` komutu ile sunucuyu ekleyebilir\n' +
                                    '<a:Kystat:1438738305712787467> Sunucu bilgilerini doldurun\n' +
                                    '<a:talking:1438758591065493584> Kurulum tamamlandıktan sonra panel oluşturulabilir'
                                )
                            )
                            .setThumbnailAccessory(
                                new ThumbnailBuilder().setURL('https://cdn.iconscout.com/icon/premium/png-512-thumb/settings-icon-svg-png-download-2377725.png?f=webp&w=256')
                            )
                    );
                
                const reply = await message.reply({ 
                    components: [notSetupContainer],
                    flags: [MessageFlags.IsComponentsV2]
                });
                setTimeout(() => reply.delete().catch(() => {}), 10000);
                return;
            }

            // Tüm oyları al ve kullanıcı bazında grupla (her oy verme işlemi ayrı kayıt)
            const Vote = require('../../../data/schemas/vote');
            const allVotes = await Vote.find({ guildId: message.guild.id }).lean();

            // Oy verenleri formatla
            let votersList = '';
            let userVoteCounts = {};
            
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
                        const user = await message.client.users.fetch(userId);
                        votersList += `<:bewrqturuncu:1438723245321748500> **${user.username}** \`${voteCount} oy\`\n`;
                    } catch {
                        votersList += `<:bewrqturuncu:1438723245321748500> **Bilinmeyen Kullanıcı** \`${voteCount} oy\`\n`;
                    }
                }
            } else {
                votersList = 'Henüz kimse oy vermedi.';
            }

            // Toplam oy sayısı (tüm oy verme işlemleri)
            const totalVotes = allVotes.length;
            const settings = require('../../../settings.json');

            // Sunucu ikonu URL'i - yüksek kalite
            const guildIcon = message.guild.iconURL({ dynamic: true, size: 512, extension: 'png' }) || 
                             message.guild.iconURL({ dynamic: true, size: 256 }) || 
                             'https://cdn.discordapp.com/attachments/1206385840041762829/1206385840041762829/discord-logo.png';
            
            // Discord emoji URL'leri (eğer sunucuda varsa)
            const getEmojiURL = (emojiId) => {
                if (!emojiId) return null;
                return `https://cdn.discordapp.com/emojis/${emojiId}.png?size=256`;
            };
            
            // Sunucu emojilerini kontrol et
            const voteEmoji = message.guild.emojis.cache.find(e => e.name?.toLowerCase().includes('vote') || e.name?.toLowerCase().includes('oy'))?.id;
            const trophyEmoji = message.guild.emojis.cache.find(e => e.name?.toLowerCase().includes('trophy') || e.name?.toLowerCase().includes('kupa'))?.id;
            const bookEmoji = message.guild.emojis.cache.find(e => e.name?.toLowerCase().includes('book') || e.name?.toLowerCase().includes('kitap'))?.id;

            // Components V2 Container oluştur - ÖRNEK.js stilinde
            const container = new ContainerBuilder()
                .setAccentColor(0x5865F2) // Discord mavisi
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`### <a:tagged1:1438758589002154036> ${message.guild.name} - Oy Verme Paneli`)
                )
                .addSeparatorComponents(new SeparatorBuilder())
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                '## <a:imek:1445522998932017162> Sunucu Bilgileri\n' +
                                `<:botopen:1445522650028834816>  **Sunucu:** ${message.guild.name}\n` +
                                `<a:tagged1:1438758589002154036> **Toplam Oy:** ${totalVotes}\n` +
                                `<a:icon:1438723312250388531> **Sunucu Sayfası:** [Tıkla](https://dcoyver.com/sunucu/${message.guild.id})`
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
                .addSeparatorComponents(new SeparatorBuilder())
                .addActionRowComponents(
                    new ActionRowBuilder().addComponents(
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
                    )
                )
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('### **<a:icon:1438723312250388531> DcOyver.com - Discord Sunucu Listesi <a:icon:1438723312250388531>**')
                );

            const panelMessage = await message.channel.send({
                components: [container],
                flags: [MessageFlags.IsComponentsV2]
            });

            // Panel mesaj ID'sini kaydet
            await GuildData.findOneAndUpdate(
                { guildId: message.guild.id },
                { 
                    votePanelMessageId: panelMessage.id,
                    votePanelChannelId: message.channel.id
                }
            );

            // mesaj.json'a ekle
            const mesajHelper = require('../../../lib/mesajHelper');
            mesajHelper.addMessageToJson(message.guild.id, message.channel.id, panelMessage.id);

            // Komutu sil
            message.delete().catch(() => {});

        } catch (error) {
            const logger = require('../../../lib/logger');
            logger.log(`Oyver command error: ${error.message}`, 'error');
            
            const errorContainer = new ContainerBuilder()
                .setAccentColor(0xFF0000)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('### ❌ Sistem Hatası')
                )
                .addSeparatorComponents(new SeparatorBuilder())
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                '## <:support:1438738595945910412> Bir hata oluştu\n' +
                                'Lütfen daha sonra tekrar deneyin.\n\n' +
                                `**Hata:** \`${error.message}\``
                            )
                        )
                        .setThumbnailAccessory(
                            new ThumbnailBuilder().setURL('https://cdn.iconscout.com/icon/premium/png-512-thumb/error-icon-svg-png-download-2377708.png?f=webp&w=256')
                        )
                );
            
            const reply = await message.reply({ 
                components: [errorContainer],
                flags: [MessageFlags.IsComponentsV2]
            });
            setTimeout(() => reply.delete().catch(() => {}), 10000);
        }
    }
};
