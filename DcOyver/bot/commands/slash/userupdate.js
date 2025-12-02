const { 
    SlashCommandBuilder, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    MessageFlags,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder
} = require('discord.js');
const settings = require('../../../settings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userupdate')
        .setDescription('Sistem güncelleme menüsü (Sadece bot sahipleri)'),
    
    async execute(interaction) {
        try {
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

            // Select menü oluştur
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('userupdate_select')
                .setPlaceholder('Güncelleme türünü seçin...')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Discord Sunucu Verilerini Güncelle')
                        .setDescription('Tüm Discord sunucu verilerini günceller')
                        .setValue('update_guilds')
                        .setEmoji('🏰'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Kullanıcıları Güncelle')
                        .setDescription('Tüm kullanıcı verilerini günceller ve yedekler')
                        .setValue('update_users')
                        .setEmoji('👥'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Kullanıcı User Verilerini Güncelle')
                        .setDescription('Kullanıcıların banner, avatar ve profil bilgilerini günceller')
                        .setValue('update_user_data')
                        .setEmoji('👤'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Kullanıcı Banner\'larını Güncelle')
                        .setDescription('Tüm kullanıcıların banner\'larını çekip MongoDB\'ye kaydeder')
                        .setValue('update_user_banners')
                        .setEmoji('🖼️'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Tümünü Güncelle')
                        .setDescription('Tüm sistem verilerini günceller (Sunucular + Kullanıcılar)')
                        .setValue('update_all')
                        .setEmoji('🔄')
                );

            const row = new ActionRowBuilder().addComponents(selectMenu);

            // İlk mesajı göster
            const initialContainer = new ContainerBuilder()
                .setAccentColor(0x5865F2)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '### 🔄 Sistem Güncelleme Menüsü\n\n' +
                        'Aşağıdaki menüden güncellemek istediğiniz sistemi seçin.\n\n' +
                        '**Not:** Bu işlemler biraz zaman alabilir.'
                    )
                );

            await interaction.reply({
                components: [initialContainer, row],
                flags: [MessageFlags.IsComponentsV2]
            });

        } catch (error) {
            const logger = require('../../../lib/logger');
            logger.log(`Userupdate command error: ${error.message}`, 'error');
            
            const errorContainer = new ContainerBuilder()
                .setAccentColor(0xFF0000)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('### ❌ Sistem Hatası\n\nBir hata oluştu. Lütfen daha sonra tekrar deneyin.')
                );
            
            try {
                if (interaction.replied || interaction.deferred) {
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
                logger.log(`Failed to reply to interaction: ${replyError.message}`, 'error');
            }
        }
    }
};

