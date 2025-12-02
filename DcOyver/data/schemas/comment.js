const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    guildId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    avatar: {
        type: String
    },
    avatarUrl: {
        type: String
    },
    content: {
        type: String,
        required: true,
        maxlength: 450
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 5
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    commentId: {
        type: Number,
        unique: true,
        sparse: true
    }
}, {
    timestamps: true
});

CommentSchema.index({ guildId: 1, createdAt: -1 });

// Auto-increment commentId
CommentSchema.pre('save', async function(next) {
    if (!this.commentId) {
        const Comment = mongoose.model('Comment', CommentSchema);
        const lastComment = await Comment.findOne().sort({ commentId: -1 });
        this.commentId = lastComment ? lastComment.commentId + 1 : 1;
    }
    next();
});

module.exports = mongoose.model('Comment', CommentSchema);
