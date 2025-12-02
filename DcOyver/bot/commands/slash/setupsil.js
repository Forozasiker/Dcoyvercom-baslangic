const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const GuildData = require('../../../data/schemas/guild');

const MAX_TEXTBLOCK_LENGTH = 1_900;

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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupsil')
        .setDescription('Sunucu kurulumunu siler')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            const guildData = await GuildData.findOne({ guildId: interaction.guild.id });

            if (!guildData || !guildData.isSetup) {
                const notFoundContainer = new ContainerBuilder();
                const notFoundDisplay = new TextDisplayBuilder()
                    .setContent(`❌ Hata\nBu sunucu zaten DcOyver.com'da kayıtlı değil!`);
                notFoundContainer.addTextDisplayComponents(notFoundDisplay);
                
                return await interaction.reply({
                    components: [notFoundContainer],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                });
            }

            // Oy sayısını kontrol et
            const Vote = require('../../../data/schemas/vote');
            const voteCount = await Vote.countDocuments({ guildId: interaction.guild.id });
            
            // Yorum sayısını kontrol et
            const Comment = require('../../../data/schemas/comment');
            const commentCount = await Comment.countDocuments({ guildId: interaction.guild.id });

            // Components V2 Container oluştur
            const container = new ContainerBuilder();
            
            const warningText = `⚠️ Kurulum Silme Onayı\n\n**${interaction.guild.name}** sunucusunun DcOyver.com kaydını silmek istediğinize emin misiniz?\n\n**🗑️ Silinecek Veriler:**\n> Sunucu açıklaması ve kategori\n> **${voteCount}** adet oy\n> **${commentCount}** adet yorum\n> Tüm istatistikler\n\n**⚠️ Bu işlem geri alınamaz!**\n\n60 saniye içinde yanıt vermelisiniz.`;
            
            addChunkedContent(container, warningText);

            // Butonları ekle
            const buttonRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('setup_delete_confirm')
                        .setLabel('Evet, Sil')
                        .setEmoji('🗑️')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('setup_delete_cancel')
                        .setLabel('İptal')
                        .setEmoji('❌')
                        .setStyle(ButtonStyle.Secondary)
                );

            container.addActionRowComponents(buttonRow);

            await interaction.reply({
                components: [container],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
            });
            
            const reply = await interaction.fetchReply();

            // 60 saniye timeout
            setTimeout(async () => {
                try {
                    const timeoutContainer = new ContainerBuilder();
                    const timeoutDisplay = new TextDisplayBuilder()
                        .setContent(`⏰ Süre Doldu\nKurulum silme işlemi zaman aşımına uğradı.`);
                    timeoutContainer.addTextDisplayComponents(timeoutDisplay);
                    
                    await interaction.editReply({ 
                        components: [timeoutContainer],
                        flags: [MessageFlags.IsComponentsV2]
                    });
                } catch (error) {}
            }, 60000);

        } catch (error) {
            const logger = require('../../../lib/logger');
            logger.log(`Setupsil command error: ${error.message}`, 'error');
            
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

