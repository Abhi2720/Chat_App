const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    type: { 
        type: String, 
        enum: ['private', 'group'], 
        default: 'private' 
    },
    participants: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    pairKey: {
        type: String,
        default: null
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    lastMessage: {
        content: String,
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: Date
    }
}, { timestamps: true });

roomSchema.index(
    { pairKey: 1 },
    {
        unique: true,
        partialFilterExpression: {
            type: 'private',
            pairKey: { $type: 'string' }
        }
    }
);

module.exports = mongoose.model('Room', roomSchema);