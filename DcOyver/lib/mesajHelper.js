const fs = require('fs');
const path = require('path');

const MESAJ_JSON_PATH = path.join(__dirname, '../mesaj.json');

// mesaj.json dosyasını oku
function readMesajJson() {
    try {
        if (fs.existsSync(MESAJ_JSON_PATH)) {
            const content = fs.readFileSync(MESAJ_JSON_PATH, 'utf8');
            if (content.trim()) {
                return JSON.parse(content);
            }
        }
    } catch (error) {
        // Dosya yoksa veya hatalıysa boş obje döndür
    }
    return {};
}

// mesaj.json dosyasına yaz
function writeMesajJson(data) {
    try {
        fs.writeFileSync(MESAJ_JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        const logger = require('./logger');
        logger.log(`mesaj.json write error: ${error.message}`, 'error');
        return false;
    }
}

// Discord mesaj linki oluştur
function createMessageLink(guildId, channelId, messageId) {
    return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
}

// mesaj.json'a mesaj linki ekle (duplicate kontrolü ile)
function addMessageToJson(guildId, channelId, messageId) {
    try {
        const data = readMesajJson();
        const messageLink = createMessageLink(guildId, channelId, messageId);
        
        // Eğer bu sunucu için zaten bir link varsa kontrol et
        if (!data[guildId]) {
            data[guildId] = [];
        }
        
        // Duplicate kontrolü - aynı link varsa ekleme
        if (data[guildId].includes(messageLink)) {
            const logger = require('./logger');
            logger.log(`Message link already exists for guild ${guildId}: ${messageLink}`, 'info');
            return false;
        }
        
        // Yeni linki ekle
        data[guildId].push(messageLink);
        writeMesajJson(data);
        
        const logger = require('./logger');
        logger.log(`✅ Message link added to mesaj.json for guild ${guildId}: ${messageLink}`, 'success');
        return true;
    } catch (error) {
        const logger = require('./logger');
        logger.log(`addMessageToJson error: ${error.message}`, 'error');
        return false;
    }
}

// mesaj.json'dan tüm mesaj linklerini al
function getAllMessageLinks() {
    try {
        const data = readMesajJson();
        const links = [];
        
        for (const guildId in data) {
            if (Array.isArray(data[guildId])) {
                for (const link of data[guildId]) {
                    links.push({
                        guildId: guildId,
                        link: link
                    });
                }
            }
        }
        
        return links;
    } catch (error) {
        const logger = require('./logger');
        logger.log(`getAllMessageLinks error: ${error.message}`, 'error');
        return [];
    }
}

// mesaj.json'dan link parse et (guildId, channelId, messageId)
function parseMessageLink(link) {
    try {
        // Format: https://discord.com/channels/GUILD_ID/CHANNEL_ID/MESSAGE_ID
        const match = link.match(/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/);
        if (match) {
            return {
                guildId: match[1],
                channelId: match[2],
                messageId: match[3]
            };
        }
        return null;
    } catch (error) {
        return null;
    }
}

module.exports = {
    addMessageToJson,
    getAllMessageLinks,
    parseMessageLink,
    createMessageLink,
    readMesajJson,
    writeMesajJson
};

