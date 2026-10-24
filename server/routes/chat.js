const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');

router.get('/messages/:roomId', authMiddleware, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const messages = await Message.find({ room: roomId })
            .populate('sender', 'username avatar')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        res.json({
            messages: messages.reverse(),
            page: parseInt(page),
            totalPages: Math.ceil(await Message.countDocuments({ room: roomId }) / limit)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/rooms', authMiddleware, async (req, res) => {
    try {
        const rooms = await Room.find({ participants: req.user._id })
            .populate('participants', 'username avatar status')
            .populate('lastMessage.sender', 'username')
            .sort({ updatedAt: -1 });

        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/private-room/:friendId', authMiddleware, async (req, res) => {
    try {
        const { friendId } = req.params;
        
        let room = await Room.findOne({
            type: 'private',
            participants: { 
                $all: [req.user._id, friendId],
                $size: 2
            }
        }).populate('participants', 'username avatar status');

        if (!room) {
            room = new Room({
                name: 'Private Chat',
                type: 'private',
                participants: [req.user._id, friendId]
            });
            await room.save();
            await room.populate('participants', 'username avatar status');
        }

        res.json(room);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/rooms', authMiddleware, async (req, res) => {
    try {
        const { name, participants } = req.body;
        
        const room = new Room({
            name,
            type: 'group',
            participants: [...participants, req.user._id],
            createdBy: req.user._id
        });

        await room.save();
        await room.populate('participants', 'username avatar');

        res.status(201).json(room);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;