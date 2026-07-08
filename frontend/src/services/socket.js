import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';
let socket = null;

export const connectSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });

    socket.on('connect', () => console.log('✅ Socket connected:', socket.id));
    socket.on('connect_error', (error) => console.error('❌ Socket error:', error.message));
    socket.on('disconnect', (reason) => console.log('❌ Socket disconnected:', reason));

    return socket;
};

export const getSocket = () => socket || connectSocket();
export const disconnectSocket = () => { if (socket) { socket.disconnect(); socket = null; } };

export const joinRoom = (roomId) => { if (socket) socket.emit('join_room', roomId); };
export const leaveRoom = (roomId) => { if (socket) socket.emit('leave_room', roomId); };
export const sendMessage = (data) => { if (socket) socket.emit('send_message', data); };
export const sendTyping = (room, isTyping) => { if (socket) socket.emit('typing', { room, isTyping }); };


// Friend list and request 
export const onFriendRequestReceived = (callback) => { if (socket) socket.on('friend_request_received', callback); };
export const onFriendRequestAccepted = (callback) => { if (socket) socket.on('friend_request_accepted', callback); };
export const onFriendRequestRejected = (callback) => { if (socket) socket.on('friend_request_rejected', callback); };

export const onMessageReceive = (callback) => { if (socket) socket.on('receive_message', callback); };
export const onUserTyping = (callback) => { if (socket) socket.on('user_typing', callback); };
export const onUserOnline = (callback) => { if (socket) socket.on('user_online', callback); };
export const onUserOffline = (callback) => { if (socket) socket.on('user_offline', callback); };

export const offAllListeners = () => {
    if (socket) {
        socket.off('receive_message');
        socket.off('user_typing');
        socket.off('user_online');
        socket.off('user_offline');
        socket.off('friend_request_received');
        socket.off('friend_request_accepted');
        socket.off('friend_request_rejected');
    }
};