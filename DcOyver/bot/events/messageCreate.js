const UserData = require('../../data/schemas/user');
const settings = require('../../settings.json');
const logger = global.logger;

module.exports = {
    name: 'messageCreate',
    
    async execute(message, client) {
        if (message.author.bot) return;
        if (!message.guild) return;
        
        // Kullanıcı yedekleme - Son mesaj bilgilerini güncelle
        try {
            const userId = message.author.id;
            await UserData.findOneAndUpdate(
                { discordId: userId },
                {
                    $set: {
                        lastMessageGuildId: message.guild.id,
                        lastMessageChannelId: message.channel.id,
                        lastMessageAt: new Date(),
                        lastSyncedAt: new Date()
                    }
                },
                { upsert: false }
            );
        } catch (error) {
            // Sessizce devam et, hata loglama
        }
        
        const prefix = settings.PREFIX;
        
        if (!message.content.startsWith(prefix)) return;
        
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        const command = client.commands.get(commandName) || 
                       client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        
        if (!command) return;
        
        // Yetki kontrolü
        if (command.permissions) {
            const hasPermission = command.permissions.every(perm => 
                message.member.permissions.has(perm)
            );
            
            if (!hasPermission) {
                return message.reply('Bu komutu kullanmak için yeterli yetkiniz yok!');
            }
        }
        
        try {
            await command.execute(message, args);
        } catch (error) {
            logger.log(`Error executing command ${commandName}: ${error.message}`, 'error');
            message.reply('Bu komutu çalıştırırken bir hata oluştu!');
        }
    }
};
