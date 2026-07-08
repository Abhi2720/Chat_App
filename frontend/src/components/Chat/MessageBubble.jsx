import { useAuth } from '../../context/AuthContext';

const MessageBubble = ({ message, isOwn, showAvatar }) => {
    const { user } = useAuth();
    
    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-2`}>
            
            {!isOwn && showAvatar && (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                    {message.senderName?.charAt(0).toUpperCase() || 'U'}
                </div>
            )}
            {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

            <div className={`max-w-[70%] ${isOwn ? 'order-1' : 'order-2'}`}>
                {showAvatar && !isOwn && (
                    <span className="text-xs text-gray-500 ml-1 mb-1 block">
                        {message.senderName}
                    </span>
                )}
                <div className={`px-4 py-2 rounded-2xl ${
                    isOwn 
                        ? 'bg-blue-600 text-white rounded-br-md' 
                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}>
                    <p className="text-sm">{message.content}</p>
                </div>
                <span className={`text-xs text-gray-400 mt-1 block ${
                    isOwn ? 'text-right' : 'text-left'
                }`}>
                    {formatTime(message.createdAt)}
                </span>
            </div>

            {isOwn && showAvatar && (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 order-2">
                    {user?.username?.charAt(0).toUpperCase()}
                </div>
            )}
            {isOwn && !showAvatar && <div className="w-8 flex-shrink-0 order-2" />}
        </div>
    );
};

export default MessageBubble;