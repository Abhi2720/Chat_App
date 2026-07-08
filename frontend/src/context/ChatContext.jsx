import { createContext, useState, useContext, useCallback } from 'react';
import { chatAPI, friendsAPI } from '../services/api';
import { 
    joinRoom, 
    leaveRoom, 
    sendMessage as emitMessage,
    sendTyping,
    onMessageReceive,
    onUserTyping,
    onUserOnline,
    onUserOffline,
    onFriendRequestReceived,
    onFriendRequestAccepted,
    onFriendRequestRejected,
    offAllListeners
} from '../services/socket';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
    const [currentRoom, setCurrentRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [unreadCounts, setUnreadCounts] = useState({});

    const loadRooms = useCallback(async () => {
        try {
            const response = await chatAPI.getRooms();
            setRooms(response.data);
        } catch (error) {
            console.error('Failed to load rooms:', error);
        }
    }, []);

    const loadMessages = useCallback(async (roomId, page = 1) => {
        try {
            const response = await chatAPI.getMessages(roomId, page);
            if (page === 1) setMessages(response.data.messages);
            else setMessages(prev => [...response.data.messages, ...prev]);
            return response.data;
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }, []);

    const loadFriends = useCallback(async () => {
        try {
            const response = await friendsAPI.getFriends();
            setFriends(response.data);
        } catch (error) {
            console.error('Failed to load friends:', error);
        }
    }, []);

    const loadFriendRequests = useCallback(async () => {
        try {
            const response = await friendsAPI.getRequests();
            setFriendRequests(response.data);
        } catch (error) {
            console.error('Failed to load requests:', error);
        }
    }, []);

    const joinChatRoom = useCallback((roomId) => {
        if (currentRoom) leaveRoom(currentRoom);
        setCurrentRoom(roomId);
        setMessages([]);
        joinRoom(roomId);
    }, [currentRoom]);

    const startChatWithFriend = useCallback(async (friendId) => {
        try {
            const response = await chatAPI.getPrivateRoom(friendId);
            const room = response.data;

            setRooms(prev => {
                if (prev.find(r => r._id === room._id)) return prev;
                return [room, ...prev];
            });
            
            return room._id;
        } catch (error) {
            console.error('Failed to start chat:', error);
        }
    }, []);

    const sendNewMessage = useCallback((content, type = 'text') => {
        if (!currentRoom || !content.trim()) return;
        emitMessage({ room: currentRoom, content, type });
    }, [currentRoom]);

    const handleTyping = useCallback((isTyping) => {
        if (!currentRoom) return;
        sendTyping(currentRoom, isTyping);
    }, [currentRoom]);

    const setupSocketListeners = useCallback(() => {
        onMessageReceive((message) => {
            setMessages(prev => [...prev, message]);
            if (message.room !== currentRoom) {
                setUnreadCounts(prev => ({
                    ...prev,
                    [message.room]: (prev[message.room] || 0) + 1
                }));
            }
        });

        onUserTyping(({ userId, username, isTyping }) => {
            if (isTyping) {
                setTypingUsers(prev => {
                    if (!prev.find(u => u.userId === userId)) {
                        return [...prev, { userId, username }];
                    }
                    return prev;
                });
            } else {
                setTypingUsers(prev => prev.filter(u => u.userId !== userId));
            }
        });

        onUserOnline(({ userId }) => {
            setOnlineUsers(prev => new Set(prev).add(userId));
            setFriends(prev => prev.map(f => 
                f._id === userId ? { ...f, status: 'online' } : f
            ));
        });

        onUserOffline(({ userId, lastSeen }) => {
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
            setFriends(prev => prev.map(f => 
                f._id === userId ? { ...f, status: 'offline', lastSeen } : f
            ));
        });

        // Friend request listeners
        onFriendRequestReceived((data) => {
            setFriendRequests(prev => [data, ...prev]);
        });

        onFriendRequestAccepted((data) => {
            loadFriends();
            loadRooms();
        });

        onFriendRequestRejected((data) => {
            console.log('Request rejected:', data);
        });
    }, [currentRoom, loadFriends, loadRooms]);

    const cleanupSocketListeners = useCallback(() => {
        offAllListeners();
    }, []);

    return (
        <ChatContext.Provider value={{
            currentRoom,
            messages,
            rooms,
            friends,
            friendRequests,
            typingUsers,
            onlineUsers,
            unreadCounts,
            setCurrentRoom,
            setUnreadCounts,
            loadRooms,
            loadMessages,
            loadFriends,
            loadFriendRequests,
            joinChatRoom,
            startChatWithFriend,
            sendNewMessage,
            handleTyping,
            setupSocketListeners,
            cleanupSocketListeners
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);