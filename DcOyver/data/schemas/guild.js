const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GuildSchema = new Schema({
    
    guildId: {
        type: String,
        required: true,
        unique: true
    },

    name: {
        type: String,
        required: true
    },

    description: {
        type: String,
        default: ''
    },

    iconURL: {
        type: String
    },

    bannerURL: {
        type: String
    },

    inviteURL: {
        type: String
    },

    memberCount: {
        type: Number,
        default: 0
    },

    onlineCount: {
        type: Number,
        default: 0
    },

    voiceCount: {
        type: Number,
        default: 0
    },

    voiceMutedCount: {
        type: Number,
        default: 0
    },

    voiceUnmutedCount: {
        type: Number,
        default: 0
    },

    voiceDeafenedCount: {
        type: Number,
        default: 0
    },

    voiceUndeafenedCount: {
        type: Number,
        default: 0
    },

    cameraCount: {
        type: Number,
        default: 0
    },

    streamCount: {
        type: Number,
        default: 0
    },

    boostCount: {
        type: Number,
        default: 0
    },

    ownerId: {
        type: String
    },

    ownerUsername: {
        type: String
    },

    ownerGlobalName: {
        type: String
    },

    ownerAvatarURL: {
        type: String
    },

    guildCreatedAt: {
        type: Date
    },

    category: {
        type: String,
        enum: ['public', 'private', 'game'],
        default: 'public'
    },

    totalVotes: {
        type: Number,
        default: 0
    },

    isActive: {
        type: Boolean,
        default: true
    },

    isSetup: {
        type: Boolean,
        default: false
    },

    setupBy: {
        type: String
    },

    setupAt: {
        type: Date
    },

    votePanelMessageId: {
        type: String,
        default: null
    },

    votePanelChannelId: {
        type: String,
        default: null
    },

    // Onay sistemi alanları
    isApproved: {
        type: Boolean,
        default: false
    },

    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },

    requestedAt: {
        type: Date,
        default: Date.now
    },

    approvedAt: {
        type: Date
    },

    approvedBy: {
        type: String // Admin user ID
    },

    rejectedAt: {
        type: Date
    },

    rejectedBy: {
        type: String // Admin user ID
    },

    rejectionReason: {
        type: String
    },

    approvalMessageId: {
        type: String // Discord'daki onay mesajı ID'si
    }

}, {
  timestamps: true
});

module.exports = mongoose.model('Guild', GuildSchema);
