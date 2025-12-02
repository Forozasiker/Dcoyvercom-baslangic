const {Client, GatewayIntentBits, Partials, Collection, REST, Routes} = require('discord.js');
const fs = require('fs');

class BotClient extends Client {
    constructor(opt) {
        super({
            intents: Object.keys(GatewayIntentBits).map((a)=>{
                return GatewayIntentBits[a]
            }),
            partials: [
                Partials.Channel,
                Partials.GuildMember,
                Partials.Message,
                Partials.User
            ]
        })
        
        this.botname = opt.botname || "Bot";
        this.dirname = opt.dirname || this.botname;
        this.commands = new Collection();
        this.slashCommands = new Collection();

        this.on("disconnect", () => logger.log("Bot disconnecting...", "warn"))
        this.on("reconnecting", () => logger.log("Bot reconnecting...", "warn"))
        this.on("warn", (info) => logger.log(info, "warn"));

    }

    async loadCommands() {

        // Prefix commands
        const path = require('path');
        const prefixPath = path.join(process.cwd(), 'bot', 'commands', 'prefix');
        
        if(fs.existsSync(prefixPath)) {
            let prefixFiles = fs.readdirSync(prefixPath, { encoding: "utf8" }).filter(file => file.endsWith(".js"));
            logger.log(`Loading ${prefixFiles.length} prefix commands`, "info");
            
            prefixFiles.forEach(file => {
                try {
                    const cmdPath = path.join(prefixPath, file);
                    delete require.cache[require.resolve(cmdPath)];
                    const cmd = require(cmdPath);
                    
                    if(cmd && cmd.name) {
                        this.commands.set(cmd.name, cmd);
                        logger.log(`Loaded prefix command: ${cmd.name}`, "info");
                        if(cmd.aliases) {
                            cmd.aliases.forEach(alias => {
                                this.commands.set(alias, cmd);
                            });
                        }
                    }
                } catch (error) {
                    logger.log(`Failed to load prefix command ${file}: ${error.message}`, "error");
                }
            });
        }
    }

    async loadSlashCommands() {
        const path = require('path');
        const slashPath = path.join(process.cwd(), 'bot', 'commands', 'slash');
        
        if(!fs.existsSync(slashPath)) {
            logger.log('Slash commands directory not found', 'warn');
            return [];
        }
        
        let slashFiles = fs.readdirSync(slashPath, { encoding: "utf8" }).filter(file => file.endsWith(".js"));
        logger.log(`Loading ${slashFiles.length} slash commands`, "info");
        
        const commands = [];
        
        slashFiles.forEach(file => {
            try {
                const cmdPath = path.join(slashPath, file);
                delete require.cache[require.resolve(cmdPath)];
                const cmd = require(cmdPath);
                
                if(cmd && cmd.data) {
                    this.slashCommands.set(cmd.data.name, cmd);
                    commands.push(cmd.data.toJSON());
                    logger.log(`Loaded slash command: ${cmd.data.name}`, "info");
                }
            } catch (error) {
                logger.log(`Failed to load slash command ${file}: ${error.message}`, "error");
            }
        });
        
        return commands;
    }

    async registerSlashCommands(commands) {
        try {
            if (!this.user) {
                logger.log('Bot user not available yet, waiting...', 'warn');
                return;
            }
            
            const settings = require('../settings.json');
            const rest = new REST().setToken(settings.BOT_TOKEN);
            
            logger.log(`Registering ${commands.length} slash commands globally...`, "info");
            
            const data = await rest.put(
                Routes.applicationCommands(this.user.id),
                { body: commands }
            );
            
            logger.log(`Successfully registered ${data.length} slash commands globally`, "success");
        } catch (error) {
            logger.log(`Failed to register slash commands: ${error.message}`, "error");
            logger.log(`Error details: ${error.stack}`, "error");
        }
    }

    async loadEvents() {
        if(!fs.existsSync("./bot/events")) return;
        
        let files = fs.readdirSync('./bot/events', { encoding: "utf8" }).filter(file => file.endsWith(".js"));
        logger.log(`Loading ${files.length} events`, "info");
        
        files.forEach(file => {
            const event = require(`./events/${file}`);
            if(event && event.name) {
                this.on(event.name, (...args) => event.execute(...args, this));
            }
        });
    }

    start(token) {
        if(!token) {
            logger.log(`Bot token not provided`, "error");
            process.exit()
            return;
        }

        return this.login(token)
        .then(async () => {
            logger.log(`${this.botname} is ready (${this.user.tag})`, "success")
            await this.loadCommands();
            const slashCommands = await this.loadSlashCommands();
            await this.registerSlashCommands(slashCommands);
            await this.loadEvents();
            return true;
        })
        .catch((err) => {
            logger.log(`Bot login failed: ${err.message}`, "error")
            return false
        })
    }
}

module.exports = {
    BotClient,
    Collection
}
