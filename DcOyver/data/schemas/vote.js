const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VoteSchema = new Schema({
    
    userId: {
        type: String,
        required: true
    },

    guildId: {
        type: String,
        required: true
    },

    votedAt: {
        type: Date,
        default: Date.now
    }

}, {
  timestamps: true
});

// Index'ler: userId ve guildId kombinasyonu için (aynı kullanıcı aynı sunucuya birden fazla oy verebilir)
VoteSchema.index({ userId: 1, guildId: 1 });
// Son oy verme zamanını hızlı bulmak için
VoteSchema.index({ userId: 1, guildId: 1, votedAt: -1 });

module.exports = mongoose.model('Vote', VoteSchema);
