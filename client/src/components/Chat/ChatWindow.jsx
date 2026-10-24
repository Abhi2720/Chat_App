import { useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

const ChatWindow = () => {
    const { currentRoom, messages, loadMessages, setupSocketListeners, cleanupSocketListeners } = useChat();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        setupSocketListeners();
        return () => cleanupSocketListeners();
    }, [setupSocketListeners, cleanupSocketListeners]);

    useEffect(() => {
        if (currentRoom) {
            loadMessages(currentRoom);
        }
    }, [currentRoom, loadMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!currentRoom) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-400">
                    <h3 className="text-xl font-semibold mb-2">Welcome to Chat</h3>
                    <p>Select a room to start messaging</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-white">

            <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Room {currentRoom}</h2>
                <p className="text-sm text-gray-500">{messages.length} messages</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <MessageList messages={messages} />
                <TypingIndicator />
                <div ref={messagesEndRef} />
            </div>

            <MessageInput />
        </div>
    );
};

export default ChatWindow;