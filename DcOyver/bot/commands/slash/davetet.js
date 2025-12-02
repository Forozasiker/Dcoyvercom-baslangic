const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('davetet')
        .setDescription('Botu sunucunuza davet etmek için link alın'),
    
    async execute(interaction) {
        try {
            const settings = require('../../../settings.json');
            const inviteUrl = settings.BOT_INVITE_URL || 'https://discord.com/oauth2/authorize?client_id=1444650958830178304&permissions=8&integration_type=0&scope=bot';

            // Components V2 Container oluştur
            const container = new ContainerBuilder();

            // Başlık ekle
            const titleDisplay = new TextDisplayBuilder()
                .setContent(`<:uye:1438758598464372919> Bot Davet Linki`);
            container.addTextDisplayComponents(titleDisplay);

            // Açıklama ekle
            const descriptionDisplay = new TextDisplayBuilder()
                .setContent(`**${interaction.client.user.username}** botunu sunucunuza eklemek için aşağıdaki butona tıklayın!\n\n**<a:icon:1438723312250388531> Özellikler:**\n> <:support:1438738595945910412> Sunucu kurulum sistemi\n> <a:tagged1:1438758589002154036> Oy verme paneli\n> <a:Kystat:1438738305712787467> İstatistik takibi\n> <a:talking:1438758591065493584> Top 100 sıralaması\n\n**<a:sagok:1443084319567646793> Davet Linki:**\n[Botu Davet Et](${inviteUrl})`);
            container.addTextDisplayComponents(descriptionDisplay);

            // Buton ekle
            const buttonRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Botu Davet Et')
                        .setEmoji('➕')
                        .setStyle(ButtonStyle.Link)
                        .setURL(inviteUrl)
                );

            container.addActionRowComponents(buttonRow);

            await interaction.reply({
                components: [container],
                flags: [MessageFlags.IsComponentsV2]
            });

        } catch (error) {
            const logger = require('../../../lib/logger');
            logger.log(`Davetet command error: ${error.message}`, 'error');
            
            const errorContainer = new ContainerBuilder();
            const errorDisplay = new TextDisplayBuilder()
                .setContent(`Sistem Hatası\nBir hata oluştu. Lütfen daha sonra tekrar deneyin.\n\nHata: ${error.message}`);
            errorContainer.addTextDisplayComponents(errorDisplay);
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ 
                    components: [errorContainer],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
            } else {
                await interaction.reply({ 
                    components: [errorContainer],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
            }
        }
    }
};

