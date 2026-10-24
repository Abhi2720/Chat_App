import { useAuth } from '../../context/AuthContext';
import MessageBubble from './MessageBubble';

const MessageList = ({ messages }) => {
    const { user } = useAuth();

    if (messages.length === 0) {
        return (
            <div className="text-center text-gray-400 py-8">
                No messages yet. Start the conversation!
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {messages.map((message, index) => {
                const isOwn = message.sender?._id === user?.id || message.sender === user?.id;
                const showAvatar = index === 0 || 
                    messages[index - 1].sender?._id !== message.sender?._id;

                return (
                    <MessageBubble
                        key={message._id || index}
                        message={message}
                        isOwn={isOwn}
                        showAvatar={showAvatar}
                    />
                );
            })}
        </div>
    );
};

export default MessageList;