const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserNotificationSchema = new Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    guildId: {
        type: String,
        required: true,
        index: true
    },
    notificationEnabled: {
        type: Boolean,
        default: false
    },
    lastNotificationSent: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Her kullanıcı-guild çifti için unique
UserNotificationSchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.model('UserNotification', UserNotificationSchema);

