import { useChat } from '../../context/ChatContext';

const TypingIndicator = () => {
    const { typingUsers } = useChat();

    if (typingUsers.length === 0) return null;

    return (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
            <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span>
                {typingUsers.length === 1 
                    ? `${typingUsers[0].username} is typing...`
                    : `${typingUsers.length} people are typing...`
                }
            </span>
        </div>
    );
};

export default TypingIndicator;