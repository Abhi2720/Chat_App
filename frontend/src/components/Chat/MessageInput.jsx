import { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { Send, Paperclip } from 'lucide-react';

const MessageInput = () => {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const { currentRoom, sendNewMessage, handleTyping } = useChat();
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        sendNewMessage(message);
        setMessage('');
        setIsTyping(false);
        handleTyping(false);
        
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };

    const handleChange = (e) => {
        setMessage(e.target.value);
        
        if (!isTyping) {
            setIsTyping(true);
            handleTyping(true);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            handleTyping(false);
        }, 2000);
    };

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    if (!currentRoom) return null;

    return (
        <div className="border-t border-gray-200 p-4 bg-white">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <button
                    type="button"
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <Paperclip size={20} />
                </button>
                
                <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={handleChange}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <button
                    type="submit"
                    disabled={!message.trim()}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default MessageInput;