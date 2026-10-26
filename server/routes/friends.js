const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const { default: mongoose } = require('mongoose');
const Room = require('../models/Room');
const addFriends = require('../utils/addFriend');
const createPrivateRoom = require('../utils/createRoom');

// Update:- Friends can now be search 
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
                { _id: { $ne: req.user._id } }
            ]
        })
        .select('username avatar status lastSeen')
        .limit(10);

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/request', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.body;

        if( !userId || !mongoose.Types.ObjectId.isValid(userId)){
            return res.status(400).json({error: 'Invalid user ID'});
        }
        
        // Prevent from sending to yourself
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ 
                error: 'Cannot send request to yourself'
            });
        }

        // fetch both users
        const currentUser = await User.findById(req.user._id);
        const targetUser = await User.findById(userId);

        if(!currentUser || !targetUser){
            return res.status(404).json({
                error: 'User not found'
            })
        }

        // Are already friends
        if (currentUser.friends.includes(userId)) {
            return res.status(400).json({ error: 'Already friends' });
        }

        let Request = await FriendRequest.findOne(
            // request from currentUser
            { sender: req.user._id, receiver: userId },
        );
        if (Request) {
            return res.status(400).json({
                message: 'Request Already exist'
            })
        }

        // checking for existing request - can accept request/ request already sended
        Request = await FriendRequest.findOne(
            // request from User
            { sender: userId, receiver: req.user._id }
        );
        // accept the incoming request
        if (Request) {
            await addFriends(currentUser._id, targetUser._id);
            const room = await createPrivateRoom(currentUser._id, targetUser._id);

            const io = req.app.get('io');
            const onlineUsers = req.app.get('onlineUsers');

            // Find the other user's socket
            const targetSocketId = onlineUsers?.get(userId);

            // Notify the other user that you are now friends and a room is created
            if (targetSocketId) {
                io.to(targetSocketId).emit('friend_request_accepted', {
                    user: {
                        _id: currentUser._id,
                        username: currentUser.username,
                        avatar: currentUser.avatar
                    },
                    roomId: room._id
                });
            }
            await FriendRequest.deleteOne({
                _id: Request._id 
            });
            return res.status(201).json({
                Message: "friend added successfully",
                friend: {
                    _id: targetUser._id,
                    username: targetUser.username,
                    avatar: targetUser.avatar
                },
                room: {
                    roomId: room._id,
                    pairKey: room.pairKey
                }
            });
        }

        // creating new request 
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
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({
                error: 'Invalid request ID'
            });
        }

        const currentUser = await User.findById(req.user._id);
        
        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        const request = await FriendRequest.findOne({
            _id: requestId,
            receiver: req.user._id,
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({ 
                error: 'Request not found' 
            });
        }
        await addFriends(req.user._id, request.sender);
        const room = await createPrivateRoom(req.user._id, request.sender);

        await FriendRequest.deleteOne({
            _id: requestId
        });

        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        const senderSocketId = onlineUsers?.get(request.sender.toString());
        
        if (io && senderSocketId) {
            io.to(senderSocketId).emit('friend_request_accepted', {
                requestId,
                by: currentUser.username,
                roomId: room._id
            });
        }

        return res.status(200).json({ 
            message: 'Friend request accepted', 
            roomId: room._id
        });

    } 
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.post('/reject', authMiddleware, async (req, res) => {
    try {
        const { requestId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({
                error: 'Invalid request ID'
            });
        }
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
        
        const currentUser = User.findById({
            _id: req.user._id
        })
        if(!currentUser){
            return res.status(404).json({
                error: 'User not found'
            })
        }
        if (io && senderSocketId) {
            io.to(senderSocketId).emit('friend_request_rejected', {
                requestId,
                by: currentUser.username
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