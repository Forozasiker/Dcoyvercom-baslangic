const { PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const GuildData = require('../../../data/schemas/guild');

module.exports = {
    name: 'setup',
    description: 'Sunucunuzu DcOyver.com\'a ekleyin',
    permissions: [PermissionFlagsBits.Administrator],
    
    async execute(message, args) {
        try {
            // Yetki kontrolü
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                const errorContainer = new ContainerBuilder();
                const errorDisplay = new TextDisplayBuilder()
                    .setContent(`Yetki Hatası\nBu komutu kullanmak için **Yönetici** yetkisine sahip olmalısınız!`);
                errorContainer.addTextDisplayComponents(errorDisplay);
                
                return message.reply({ 
                    components: [errorContainer],
                    flags: [MessageFlags.IsComponentsV2]
                });
            }

            const settings = require('../../../settings.json');
            const guildData = await GuildData.findOne({ guildId: message.guild.id });

            if (guildData && guildData.isSetup) {
                const alreadySetupContainer = new ContainerBuilder();
                const alreadySetupDisplay = new TextDisplayBuilder()
                    .setContent(`<a:tagged1:1438758589002154036> **Sunucu Zaten Kayıtlı**\n\nBu sunucu zaten DcOyver.com'da kayıtlı!\n\n**<a:icon:1438723312250388531> Bilgiler:**\n> <:support:1438738595945910412> **Kategori:** ${guildData.category || 'Belirlenmemiş'}\n> <a:Kystat:1438738305712787467> **Açıklama:** ${guildData.description ? (guildData.description.length > 100 ? guildData.description.substring(0, 100) + '...' : guildData.description) : 'Yok'}\n> <a:tagged1:1438758589002154036> **Toplam Oy:** ${guildData.totalVotes || 0}\n> <:uye:1438758598464372919> **Üye Sayısı:** ${message.guild.memberCount}\n\n[<a:talking:1438758591065493584> Sunucu Sayfası](${settings.WEBSITE_URL}/sunucu/${message.guild.id})`);
                alreadySetupContainer.addTextDisplayComponents(alreadySetupDisplay);
                
                return message.reply({
                    components: [alreadySetupContainer],
                    flags: [MessageFlags.IsComponentsV2]
                });
            }

            // Components V2 Container oluştur
            const container = new ContainerBuilder();

            // Başlık ekle
            const titleDisplay = new TextDisplayBuilder()
                .setContent(`<a:tagged1:1438758589002154036> **Sunucu Kurulumu** - ${message.guild.name}`);
            container.addTextDisplayComponents(titleDisplay);

            // Açıklama ekle
            const descriptionDisplay = new TextDisplayBuilder()
                .setContent(`**${message.guild.name}** sunucusunu DcOyver.com'a eklemek için aşağıdaki butona tıklayın!\n\n**<a:icon:1438723312250388531> Kurulum Adımları:**\n> <:support:1438738595945910412> Sunucu hakkında bilgi girin (20-500 karakter)\n> <a:Kystat:1438738305712787467> Kategori seçin (Public/Private/Game)\n> <a:talking:1438758591065493584> Davet linki ekleyin\n> <a:sagok:1443084319567646793> Onaylayın\n\n**✨ Avantajlar:**\n> <:uye:1438758598464372919> Binlerce kullanıcıya ulaşın\n> <a:tagged1:1438758589002154036> Oy alın ve sıralamada yükseltin\n> <a:Kystat:1438738305712787467> Sunucu istatistiklerini görün\n> <a:talking:1438758591065493584> Profesyonel sunucu listesinde yer alın`);
            container.addTextDisplayComponents(descriptionDisplay);

            // Butonu ekle
            const buttonRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('setup_start')
                        .setLabel('Kuruluma Başla')
                        .setEmoji('⚙️')
                        .setStyle(ButtonStyle.Primary)
                );

            container.addActionRowComponents(buttonRow);

            await message.reply({
                components: [container],
                flags: [MessageFlags.IsComponentsV2]
            });

        } catch (error) {
            const logger = require('../../../lib/logger');
            logger.log(`Setup command error: ${error.message}`, 'error');
            
            const errorContainer = new ContainerBuilder();
            const errorDisplay = new TextDisplayBuilder()
                .setContent(`Sistem Hatası\nBir hata oluştu. Lütfen daha sonra tekrar deneyin.\n\nHata: ${error.message}`);
            errorContainer.addTextDisplayComponents(errorDisplay);
            
            return message.reply({ 
                components: [errorContainer],
                flags: [MessageFlags.IsComponentsV2]
            });
        }
    }
};
