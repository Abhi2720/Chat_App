import { useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { friendsAPI } from '../../services/api';
import { Check, X, UserCheck } from 'lucide-react';

const FriendRequests = () => {
    const { friendRequests, loadFriendRequests } = useChat();

    useEffect(() => {
        loadFriendRequests();
    }, [loadFriendRequests]);

    const acceptRequest = async (requestId) => {
        try {
            await friendsAPI.acceptRequest(requestId);
            loadFriendRequests();
        } catch (error) {
            console.error('Accept failed:', error);
        }
    };

    const rejectRequest = async (requestId) => {
        try {
            await friendsAPI.rejectRequest(requestId);
            loadFriendRequests();
        } catch (error) {
            console.error('Reject failed:', error);
        }
    };

    if (friendRequests.length === 0) return null;

    return (
        <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <UserCheck size={16} />
                Friend Requests ({friendRequests.length})
            </h3>
            
            <div className="space-y-2">
                {friendRequests.map(request => (
                    <div key={request._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                {request.sender.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-800">{request.sender.username}</span>
                        </div>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={() => acceptRequest(request._id)}
                                className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                title="Accept"
                            >
                                <Check size={16} />
                            </button>
                            <button
                                onClick={() => rejectRequest(request._id)}
                                className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                title="Reject"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FriendRequests;