const { socketAuth } = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');
const Room = require('../models/Room');

const onlineUsers = new Map(); 
module.exports = (io) => {

    io.onlineUsers = onlineUsers;

    io.use(socketAuth);

    io.on('connection', async (socket) => {
        console.log(`User connected: ${socket.user.username} (${socket.id})`);
        
        onlineUsers.set(socket.user._id.toString(), socket.id);

        const expressApp = io.httpServer._expressApp;
        if (expressApp) {
            expressApp.set('onlineUsers', onlineUsers);
            expressApp.set('io', io);
        }

        await User.findByIdAndUpdate(socket.user._id, { 
            status: 'online',
            lastSeen: new Date()
        });

        socket.broadcast.emit('user_online', {
            userId: socket.user._id,
            username: socket.user.username
        });

        socket.join(socket.user._id.toString());

        socket.on('join_room', async (roomId) => {
            try {
                // if room is valid
                if (!roomId || !roomId.match(/^[a-f\d]{24}$/i)) {
                    return socket.emit('room_error', {
                        message: 'Invalid room ID'
                    });
                }

                // finding room with Id and verifying whether user is a member or not
                const room = await Room.findOne({
                    _id: roomId,
                    participants: socket.user._id
                }).select('_id');

                if (!room) {
                    return socket.emit('room_error', {
                        message: 'Room not found or access denied'
                    });
                }

                socket.join(room._id.toString());
                console.log(`${socket.user.username} joined room: ${roomId}`);

            } catch (error) {
                console.error('Join room error:', error);

                socket.emit('room_error', {
                    message: 'Unable to join room'
                });
            }
        });

        socket.on('leave_room', async (roomId) => {
            try {
                // if room is valid
                if (!roomId || !roomId.match(/^[a-f\d]{24}$/i)) {
                    return socket.emit('room_error', {
                        message: 'Invalid room ID'
                    });
                }

                // finding room with Id and verifying whether user is a member or not
                const room = await Room.findOne({
                    _id: roomId,
                    participants: socket.user._id
                }).select('_id');

                if (!room) {
                    return socket.emit('room_error', {
                        message: 'Room not found or access denied'
                    });
                }

                socket.leave(roomId);
                socket.to(roomId).emit('user_left', {
                    userId: socket.user._id,
                    username: socket.user.username
                });
            } catch (error) {
                console.error('Leave room error:', error);

                socket.emit('room_error', {
                    message: 'Unable to Leave room'
                });
            }
            
        });

        socket.on('send_message', async (data) => {
            try {
                const { room, content, type = 'text', replyTo } = data;

                if (!room || !room.match(/^[a-f\d]{24}$/i)) {
                    return socket.emit('error', {
                        message: 'Invalid room ID'
                    });
                }

                const roomExists = await Room.findOne({
                    _id: room,
                    participants: socket.user._id
                }).select('_id');

                if (!roomExists) {
                    return socket.emit('error', {
                        message: 'Room not found or access denied'
                    });
                }
                const message = new Message({
                    room,
                    sender: socket.user._id,
                    senderName: socket.user.username,
                    content,
                    type,
                    replyTo: replyTo || null
                });

                await message.save();
                await message.populate('sender', 'username avatar');

                await Room.findByIdAndUpdate(room, {
                    lastMessage: {
                        content: content.substring(0, 50),
                        sender: socket.user._id,
                        timestamp: new Date()
                    }
                });

                io.to(room).emit('receive_message', {
                    _id: message._id,
                    room: message.room,
                    sender: message.sender,
                    senderName: message.senderName,
                    content: message.content,
                    type: message.type,
                    createdAt: message.createdAt,
                    replyTo: message.replyTo
                });

            } catch (error) {
                console.error('Message save error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('typing', async (data) => {
            try {
                const { room, isTyping } = data;

                // Validate room ID
                if (!room || !room.match(/^[a-f\d]{24}$/i)) {
                    return;
                }

                // Verify room membership
                const roomExists = await Room.findOne({
                    _id: room,
                    participants: socket.user._id
                }).select('_id');

                if (!roomExists) {
                    return;
                }

                // Only allow boolean typing status
                if (typeof isTyping !== 'boolean') {
                    return;
                }

                // Send typing status to other participants
                socket.to(room).emit('user_typing', {
                    userId: socket.user._id,
                    username: socket.user.username,
                    isTyping
                });

            } catch (error) {
                console.error('Typing event error:', error);
            }
        });

        socket.on('disconnect', async () => {
            try {
                console.log(
                    `User disconnected: ${socket.user.username} (${socket.id})`
                );

                const userId = socket.user._id.toString();

                // Only remove this entry if it belongs to this socket
                if (onlineUsers.get(userId) === socket.id) {
                    onlineUsers.delete(userId);

                    await User.findByIdAndUpdate(userId, {
                        status: 'offline',
                        lastSeen: new Date()
                    });

                    socket.broadcast.emit('user_offline', {
                        userId: socket.user._id,
                        username: socket.user.username,
                        lastSeen: new Date()
                    });
                }
            } catch (error) {
                console.error('Disconnect cleanup error:', error);
            }
        });

    });
};