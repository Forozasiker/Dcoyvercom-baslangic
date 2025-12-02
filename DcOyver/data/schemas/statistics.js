const mongoose = require('mongoose');

const statisticsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// TTL index - 30 gün sonra otomatik sil (opsiyonel, şimdilik kapalı)
// statisticsSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Statistics', statisticsSchema);
