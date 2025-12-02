const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const VoteData = require('../../../data/schemas/vote');
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
        .setName('oylar')
        .setDescription('Oy bilgilerini göster')
        .addSubcommand(subcommand =>
            subcommand
                .setName('kontrol')
                .setDescription('Oy durumunu kontrol et'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sıralama')
                .setDescription('En çok oy verenleri göster'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sunucu')
                .setDescription('Sunucu istatistikleri')),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const logger = require('../../../lib/logger');
        
        try {
            if (subcommand === 'kontrol') {
                await handleCheck(interaction);
            } else if (subcommand === 'sıralama') {
                await handleLeaderboard(interaction);
            } else if (subcommand === 'sunucu') {
                await handleServer(interaction);
            }
        } catch (error) {
            logger.log(`Votes command error: ${error.message}`, 'error');
            
            const errorContainer = new ContainerBuilder();
            const errorDisplay = new TextDisplayBuilder()
                .setContent(`❌ Hata\nBir hata oluştu. Lütfen daha sonra tekrar dene.\n\nHata: ${error.message}`);
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

async function handleCheck(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    
    const lastVote = await VoteData.findOne({ 
        userId, 
        guildId 
    }).sort({ votedAt: -1 });
    
    const container = new ContainerBuilder();
    
    if(!lastVote) {
        const readyText = `✅ Oy Durumu\n\nŞimdi oy verebilirsin!\n\n**📌 Durum:** Oy vermeye hazır`;
        addChunkedContent(container, readyText);
        
        return await interaction.reply({ 
            components: [container],
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
        });
    }
    
    const timeSinceLastVote = Date.now() - lastVote.votedAt.getTime();
    const canVote = timeSinceLastVote >= 24 * 60 * 60 * 1000;
    const hoursLeft = 24 - Math.floor(timeSinceLastVote / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeSinceLastVote % (1000 * 60 * 60)) / (1000 * 60));
    
    const nextVoteTime = Math.floor((lastVote.votedAt.getTime() + 24 * 60 * 60 * 1000) / 1000);
    
    const statusText = canVote ? 'Şimdi oy verebilirsin!' : 'Tekrar oy vermek için beklemelisin';
    const statusEmoji = canVote ? '✅' : '⏰';
    
    const statusInfo = `${statusEmoji} Oy Durumu\n\n${statusText}\n\n**🕐 Son Oy:** <t:${Math.floor(lastVote.votedAt.getTime() / 1000)}:R>\n**🔄 Tekrar Oy:** ${canVote ? 'Şimdi!' : `<t:${nextVoteTime}:R>`}\n**⏱️ Kalan Süre:** ${canVote ? 'Hazır!' : `${hoursLeft} saat ${minutesLeft} dakika`}`;
    
    addChunkedContent(container, statusInfo);
    
    await interaction.reply({ 
        components: [container],
        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
    });
}

async function handleLeaderboard(interaction) {
    const guildId = interaction.guild.id;
    
    const votes = await VoteData.aggregate([
        { $match: { guildId: guildId } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);
    
    const container = new ContainerBuilder();
    
    if(votes.length === 0) {
        const noVotesText = `📊 Oy Sıralaması\n\nHenüz oy yok! İlk oy veren sen ol!`;
        addChunkedContent(container, noVotesText);
        
        return await interaction.reply({ 
            components: [container],
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
        });
    }
    
    let description = '🏆 Oy Sıralaması\n\n';
    
    for(let i = 0; i < votes.length; i++) {
        const vote = votes[i];
        const user = await interaction.client.users.fetch(vote._id).catch(() => null);
        const username = user ? user.username : 'Bilinmeyen Kullanıcı';
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        
        description += `${medal} **${username}** - ${vote.count} oy\n`;
    }
    
    description += `\n**En çok oy veren ${votes.length} kişi**`;
    
    addChunkedContent(container, description);
    
    await interaction.reply({ 
        components: [container],
        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
    });
}

async function handleServer(interaction) {
    const guildId = interaction.guild.id;
    
    const guildData = await GuildData.findOne({ guildId });
    
    const container = new ContainerBuilder();
    
    if(!guildData) {
        const noDataText = `📊 Sunucu İstatistikleri\n\nHenüz oy verisi yok!`;
        addChunkedContent(container, noDataText);
        
        return await interaction.reply({ 
            components: [container],
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
        });
    }
    
    const recentVotes = await VoteData.find({ guildId })
        .sort({ votedAt: -1 })
        .limit(5);
    
    const uniqueVoters = await VoteData.distinct('userId', { guildId });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayVotes = await VoteData.countDocuments({ 
        guildId, 
        votedAt: { $gte: today } 
    });
    
    let recentVotersText = 'Son oy yok';
    if(recentVotes.length > 0) {
        recentVotersText = '';
        for(const vote of recentVotes) {
            const user = await interaction.client.users.fetch(vote.userId).catch(() => null);
            const username = user ? user.username : 'Bilinmeyen';
            const time = Math.floor(vote.votedAt.getTime() / 1000);
            recentVotersText += `**${username}** - <t:${time}:R>\n`;
        }
    }
    
    const statsText = `${interaction.guild.name} - Oy İstatistikleri\n\n**📊 Toplam Oy:** ${guildData.totalVotes || 0}\n**👥 Benzersiz Oy Veren:** ${uniqueVoters.length}\n**📅 Bugün:** ${todayVotes}\n\n**🕐 Son Oy Verenler:**\n${recentVotersText}`;
    
    addChunkedContent(container, statsText);
    
    await interaction.reply({ 
        components: [container],
        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
    });
}

