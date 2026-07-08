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
            socket.join(roomId);
            console.log(`${socket.user.username} joined room: ${roomId}`);
            socket.to(roomId).emit('user_joined', {
                userId: socket.user._id,
                username: socket.user.username
            });
        });

        socket.on('leave_room', (roomId) => {
            socket.leave(roomId);
            socket.to(roomId).emit('user_left', {
                userId: socket.user._id,
                username: socket.user.username
            });
        });

        socket.on('send_message', async (data) => {
            try {
                const { room, content, type = 'text', replyTo } = data;

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

        socket.on('typing', (data) => {
            const { room, isTyping } = data;
            socket.to(room).emit('user_typing', {
                userId: socket.user._id,
                username: socket.user.username,
                isTyping
            });
        });

        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${socket.user.username} (${socket.id})`);
            
            onlineUsers.delete(socket.user._id.toString());
            
            await User.findByIdAndUpdate(socket.user._id, { 
                status: 'offline',
                lastSeen: new Date()
            });

            socket.broadcast.emit('user_offline', {
                userId: socket.user._id,
                username: socket.user.username,
                lastSeen: new Date()
            });
        });
    });
};