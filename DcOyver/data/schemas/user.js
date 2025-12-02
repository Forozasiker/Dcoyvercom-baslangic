const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const UserSchema = new Schema({
    
    // Discord OAuth bilgileri
    discordId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },

    username: {
        type: String,
        required: true
    },

    discriminator: {
        type: String
    },

    globalName: {
        type: String
    },

    avatar: {
        type: String
    },

    avatarUrl: {
        type: String
    },

    banner: {
        type: String
    },

    bannerUrl: {
        type: String
    },

    email: {
        type: String
    },

    // OAuth token bilgileri
    accessToken: {
        type: String
    },

    refreshToken: {
        type: String
    },

    tokenExpiresAt: {
        type: Date
    },

    // Eski sistem için (opsiyonel)
    token: {
        type: String,
        unique: true,
        sparse: true
    },

    password: {
        type: String
    },

    balance: {
        type: Number,
        min: 0,
        default: 0,
    },

    isAdmin: {
        type: Boolean,
        default: false
    },

    isActive: {
        type: Boolean,
        default: true
    },

    lastLogin: {
        type: Date,
        default: Date.now
    },

    ipAddress: {
        type: String
    },

    // OAuth yetkilendirme bilgileri
    authorizedAt: {
        type: Date,
        default: Date.now
    },

    permissions: {
        username: { type: Boolean, default: true },
        avatar: { type: Boolean, default: true },
        banner: { type: Boolean, default: true },
        email: { type: Boolean, default: false }
    },

    // Yönetici olduğu sunucular (OAuth yetkilendirme sonrası)
    managedGuilds: [{
        guildId: {
            type: String,
            required: true
        },
        guildName: {
            type: String,
            required: true
        },
        memberCount: {
            type: Number,
            default: 0
        },
        iconURL: {
            type: String
        },
        ownerId: {
            type: String
        },
        permissions: {
            type: String
        },
        syncedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Yorum yetkilendirmesi
    commentAuthorized: {
        type: Boolean,
        default: false
    },
    commentAuthorizedAt: {
        type: Date
    },

    // Discord Bot tarafından yedeklenen bilgiler
    // Kullanıcı durumu ve aktiviteleri
    status: {
        type: String,
        enum: ['online', 'idle', 'dnd', 'offline', 'invisible'],
        default: 'offline'
    },
    
    customStatus: {
        type: String,
        maxlength: 128
    },

    // Nitro bilgileri
    hasNitro: {
        type: Boolean,
        default: false
    },
    
    nitroType: {
        type: String,
        enum: ['classic', 'boost', null],
        default: null
    },
    
    nitroBadges: [{
        type: String
    }],

    // Aktivite bilgileri
    activities: [{
        name: String,
        type: Number, // ActivityType
        state: String,
        details: String,
        timestamps: {
            start: Date,
            end: Date
        },
        applicationId: String,
        assets: {
            largeImage: String,
            largeText: String,
            smallImage: String,
            smallText: String
        },
        party: {
            id: String,
            size: [Number]
        }
    }],

    // Bulunduğu sunucular
    guilds: [{
        guildId: {
            type: String,
            required: true,
            index: true
        },
        guildName: String,
        joinedAt: Date,
        lastSeenAt: Date,
        roles: [String],
        isOwner: {
            type: Boolean,
            default: false
        },
        permissions: String
    }],

    // Oy verdiği sunucular
    votedGuilds: [{
        guildId: {
            type: String,
            required: true,
            index: true
        },
        votedAt: {
            type: Date,
            default: Date.now
        },
        voteCount: {
            type: Number,
            default: 1
        }
    }],

    // Son aktiviteler
    lastMessageGuildId: String,
    lastMessageChannelId: String,
    lastMessageChannelName: String, // En son mesaj yazdığı kanalın ismi
    lastMessage: String, // En son yazdığı mesaj içeriği
    lastMessageAt: Date,
    
    lastVoiceGuildId: String,
    lastVoiceChannelId: String,
    lastVoiceChannelName: String, // En son bulunduğu ses kanalının ismi
    lastVoiceJoinedAt: Date,
    lastVoiceLeftAt: Date,
    
    lastGuildJoinedId: String,
    lastGuildJoinedAt: Date,

    // Bot tarafından son güncelleme
    lastSyncedAt: {
        type: Date,
        default: Date.now
    },

    // Bot tarafından yedeklenme durumu
    isBackedUp: {
        type: Boolean,
        default: false
    }

}, {
  timestamps: true
});

UserSchema.pre('save', async function (next) {
    if(!this.isModified("password")) {
        next();
    }
    const salt = await bcrypt.genSaltSync(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

UserSchema.methods.checkPassword = async function (pass) {
    return await bcrypt.compare(pass, this.password)
}

module.exports = mongoose.model('User', UserSchema);
