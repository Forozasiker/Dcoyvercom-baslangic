const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const settings = require('./settings.json');

const commands = [];

// Slash komutları yükle
const slashPath = path.join(__dirname, 'bot', 'commands', 'slash');

if (fs.existsSync(slashPath)) {
    const commandFiles = fs.readdirSync(slashPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        try {
            const command = require(path.join(slashPath, file));
            if (command.data) {
                commands.push(command.data.toJSON());
                console.log(`✓ Yüklendi: ${command.data.name}`);
            }
        } catch (error) {
            console.error(`✗ ${file} yüklenirken hata: ${error.message}`);
        }
    }
}

if (commands.length === 0) {
    console.log('⚠️ Hiç slash komutu bulunamadı!');
    process.exit(1);
}

// Discord'a kaydet
const rest = new REST().setToken(settings.BOT_TOKEN);

(async () => {
    try {
        console.log(`\n${commands.length} slash komutu Discord'a kaydediliyor...`);

        // Bot ID'sini almak için önce bot'u login edelim
        const { Client, GatewayIntentBits } = require('discord.js');
        const client = new Client({ intents: [GatewayIntentBits.Guilds] });
        
        await client.login(settings.BOT_TOKEN);
        const clientId = client.user.id;
        await client.destroy();

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );

        console.log(`\n✓ Başarıyla ${data.length} slash komutu global olarak kaydedildi!`);
        console.log('\n📋 Kayıtlı komutlar:');
        data.forEach(cmd => {
            if (cmd.options && cmd.options.length > 0) {
                const subcommands = cmd.options.map(opt => opt.name).join(', ');
                console.log(`  - /${cmd.name} (${subcommands})`);
            } else {
                console.log(`  - /${cmd.name}`);
            }
        });
        console.log('\n✨ Komutlar artık tüm sunucularda kullanılabilir!');
    } catch (error) {
        console.error('\n✗ Hata:', error.message);
        if (error.code === 50001) {
            console.error('⚠️ Bot token geçersiz veya bot Discord Developer Portal\'da bulunamadı!');
        }
        process.exit(1);
    }
})();

