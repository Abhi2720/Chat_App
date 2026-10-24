const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

router.get('/search', authMiddleware, async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query || query.length < 2) {
            return res.status(400).json({ error: 'Search query must be at least 2 characters' });
        }

        const currentUser = await User.findById(req.user._id);
        
        const users = await User.find({
            $and: [
                { username: { $regex: query, $options: 'i' } },
                { _id: { $ne: req.user._id } },
                { _id: { $nin: currentUser.friends } }
            ]
        })
        .select('username avatar status lastSeen')
        .limit(10);

        const requests = await FriendRequest.find({
            $or: [
                { sender: req.user._id },
                { receiver: req.user._id }
            ]
        });

        const usersWithRequestStatus = users.map(user => {
            const existingRequest = requests.find(r => 
                r.sender.toString() === user._id.toString() || 
                r.receiver.toString() === user._id.toString()
            );
            return {
                ...user.toObject(),
                requestStatus: existingRequest ? existingRequest.status : null,
                requestId: existingRequest ? existingRequest._id : null
            };
        });

        res.json(usersWithRequestStatus);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/request', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.body;

        if (userId === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot send request to yourself' });
        }

        const currentUser = await User.findById(req.user._id);
        if (currentUser.friends.includes(userId)) {
            return res.status(400).json({ error: 'Already friends' });
        }

        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: req.user._id, receiver: userId },
                { sender: userId, receiver: req.user._id }
            ]
        });

        if (existingRequest) {
            return res.status(400).json({ error: 'Friend request already exists' });
        }

        const request = new FriendRequest({
            sender: req.user._id,
            receiver: userId
        });

        await request.save();
        await request.populate('sender receiver', 'username avatar');

        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        const receiverSocketId = onlineUsers?.get(userId);
        
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('friend_request_received', {
                requestId: request._id,
                sender: request.sender
            });
        }

        res.status(201).json(request);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/requests', authMiddleware, async (req, res) => {
    try {
        const requests = await FriendRequest.find({
            receiver: req.user._id,
            status: 'pending'
        })
        .populate('sender', 'username avatar status')
        .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/accept', authMiddleware, async (req, res) => {
    try {
        const { requestId } = req.body;

        const request = await FriendRequest.findOne({
            _id: requestId,
            receiver: req.user._id,
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        request.status = 'accepted';
        await request.save();

        await User.findByIdAndUpdate(req.user._id, {
            $push: { friends: request.sender }
        });
        await User.findByIdAndUpdate(request.sender, {
            $push: { friends: req.user._id }
        });

        const Room = require('../models/Room');
        const room = new Room({
            name: 'Private Chat',
            type: 'private',
            participants: [req.user._id, request.sender]
        });
        await room.save();

        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        const senderSocketId = onlineUsers?.get(request.sender.toString());
        
        if (senderSocketId) {
            io.to(senderSocketId).emit('friend_request_accepted', {
                requestId,
                by: req.user.username,
                roomId: room._id
            });
        }

        res.json({ message: 'Friend request accepted', room });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/reject', authMiddleware, async (req, res) => {
    try {
        const { requestId } = req.body;

        const request = await FriendRequest.findOneAndDelete({
            _id: requestId,
            receiver: req.user._id,
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        const senderSocketId = onlineUsers?.get(request.sender.toString());
        
        if (senderSocketId) {
            io.to(senderSocketId).emit('friend_request_rejected', {
                requestId,
                by: req.user.username
            });
        }

        res.json({ message: 'Friend request rejected' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/my-friends', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('friends', 'username avatar status lastSeen');

        res.json(user.friends);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/unfriend/:friendId', authMiddleware, async (req, res) => {
    try {
        const { friendId } = req.params;

        await User.findByIdAndUpdate(req.user._id, {
            $pull: { friends: friendId }
        });
        await User.findByIdAndUpdate(friendId, {
            $pull: { friends: req.user._id }
        });

        res.json({ message: 'Unfriended successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;