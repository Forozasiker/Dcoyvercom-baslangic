const { 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    MessageFlags 
} = require('discord.js');
const GuildData = require('../../../data/schemas/guild');
const settings = require('../../../settings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('oyverpanel')
        .setDescription('Tüm sunuculardaki oy verme panellerini günceller (Sadece bot sahipleri)'),
    
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

            // İlk mesajı göster
            const initialContainer = new ContainerBuilder()
                .setAccentColor(0x5865F2)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '### 🔄 Oy Verme Paneli Güncelleme\n\n' +
                        'Tüm sunuculardaki oy verme panellerini güncellemek için aşağıdaki butona tıklayın.\n\n' +
                        '**Not:** Bu işlem biraz zaman alabilir.'
                    )
                )
                .addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('update_all_panels')
                            .setLabel('TÜMÜNÜ GÜNCELLE')
                            .setEmoji('🔄')
                            .setStyle(ButtonStyle.Primary)
                    )
                );

            await interaction.reply({
                components: [initialContainer],
                flags: [MessageFlags.IsComponentsV2]
            });

        } catch (error) {
            const logger = require('../../../lib/logger');
            logger.log(`Oyverpanel command error: ${error.message}`, 'error');
            
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

