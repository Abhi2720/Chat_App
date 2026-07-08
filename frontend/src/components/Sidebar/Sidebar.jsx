import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, MessageCircle, Users, Search, ChevronLeft } from 'lucide-react';
import SearchUsers from '../Friends/SearchUsers';
import FriendRequests from '../Friends/FriendRequests';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { rooms, currentRoom, joinChatRoom, startChatWithFriend, loadFriends, friends, onlineUsers, unreadCounts, setUnreadCounts } = useChat();
    const [activeTab, setActiveTab] = useState('chats'); 
    const navigate = useNavigate();

    useEffect(() => {
        loadFriends();
    }, [loadFriends]);

    const handleFriendClick = async (friend) => {
        const roomId = await startChatWithFriend(friend._id);
        if (roomId) {
            joinChatRoom(roomId);
            setUnreadCounts(prev => ({ ...prev, [roomId]: 0 }));
            setActiveTab('chats');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="w-80 bg-gray-900 text-white flex flex-col h-full">
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-lg font-bold">
                        {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold">{user?.username}</h3>
                        <span className="text-xs text-green-400 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                            Online
                        </span>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            <div className="flex border-b border-gray-700">
                <button
                    onClick={() => setActiveTab('chats')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'chats' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                >
                    <MessageCircle size={16} /> Chats
                </button>
                <button
                    onClick={() => setActiveTab('friends')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'friends' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                >
                    <Users size={16} /> Friends
                </button>
                <button
                    onClick={() => setActiveTab('search')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'search' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                >
                    <Search size={16} /> Find
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeTab === 'chats' && (
                    <div className="p-4">
                        <FriendRequests />
                        
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <MessageCircle size={14} />
                            Recent Chats
                        </h4>
                        
                        {rooms.length === 0 ? (
                            <p className="text-gray-500 text-sm">No chats yet</p>
                        ) : (
                            <div className="space-y-1">
                                {rooms.map(room => {
                                    const otherParticipant = room.participants?.find(p => p._id !== user?.id);
                                    const unread = unreadCounts[room._id] || 0;
                                    
                                    return (
                                        <button
                                            key={room._id}
                                            onClick={() => {
                                                joinChatRoom(room._id);
                                                setUnreadCounts(prev => ({ ...prev, [room._id]: 0 }));
                                            }}
                                            className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${currentRoom === room._id ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm font-bold">
                                                            {otherParticipant?.username?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                        {otherParticipant && onlineUsers.has(otherParticipant._id) && (
                                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-gray-900 rounded-full"></span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium block">{otherParticipant?.username || room.name}</span>
                                                        {room.lastMessage && (
                                                            <span className="text-xs opacity-70 truncate max-w-[140px] block">
                                                                {room.lastMessage.content}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {room.lastMessage && (
                                                        <span className="text-xs opacity-50 block">
                                                            {new Date(room.lastMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </span>
                                                    )}
                                                    {unread > 0 && (
                                                        <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full mt-1">
                                                            {unread}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'friends' && (
                    <div className="p-4">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Users size={14} />
                            My Friends ({friends.length})
                        </h4>
                        
                        {friends.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">No friends yet. Search to add!</p>
                        ) : (
                            <div className="space-y-1">
                                {friends.map(friend => (
                                    <button
                                        key={friend._id}
                                        onClick={() => handleFriendClick(friend)}
                                        className="w-full text-left px-3 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-3"
                                    >
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm font-bold">
                                                {friend.username.charAt(0).toUpperCase()}
                                            </div>
                                            {onlineUsers.has(friend._id) ? (
                                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-gray-900 rounded-full"></span>
                                            ) : (
                                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-gray-500 border-2 border-gray-900 rounded-full"></span>
                                            )}
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-200 block">{friend.username}</span>
                                            <span className="text-xs text-gray-500">
                                                {onlineUsers.has(friend._id) ? 'Online' : `Last seen ${new Date(friend.lastSeen).toLocaleDateString()}`}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'search' && <SearchUsers />}
            </div>
        </div>
    );
};

export default Sidebar;