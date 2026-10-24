const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    room: { 
        type: String, 
        required: true,
        index: true 
    },
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    senderName: {
        type: String,
        required: true
    },
    content: { 
        type: String, 
        required: true 
    },
    type: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    },
    fileUrl: String,
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    readBy: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now }
    }],
    edited: {
        type: Boolean,
        default: false
    },
    editedAt: Date
}, { timestamps: true });


messageSchema.index({ room: 1, createdAt: -1 });
module.exports = mongoose.model('Message', messageSchema);