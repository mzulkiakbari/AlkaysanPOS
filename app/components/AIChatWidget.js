'use client';

import { useState } from 'react';
import {
    ChatBubbleLeftRightIcon,
    XMarkIcon,
    PaperAirplaneIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';

export default function AIChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        { id: 1, type: 'ai', text: 'Hi! I\'m your AI assistant. How can I help you today?' },
    ]);

    const handleSend = () => {
        if (!message.trim()) return;

        setMessages([...messages, { id: Date.now(), type: 'user', text: message }]);
        setMessage('');

        // Simulate AI response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now(),
                type: 'ai',
                text: 'I understand your request. Let me help you with that.'
            }]);
        }, 1000);
    };

    return (
        <>
            {/* Chat Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 w-14 h-14 rounded-2xl shadow-lg transition-all duration-300 z-50 flex items-center justify-center
          ${isOpen
                        ? 'bg-[var(--text-primary)] rotate-0'
                        : 'bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] hover:scale-110 hover:shadow-xl hover:shadow-[var(--primary)]/30'
                    }`}
            >
                {isOpen ? (
                    <XMarkIcon className="w-6 h-6 text-white" />
                ) : (
                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden z-50 flex flex-col animate-fade-in">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <SparklesIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold">AI Assistant</h3>
                                <p className="text-xs text-white/80">Always here to help</p>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm
                    ${msg.type === 'user'
                                            ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white rounded-br-md'
                                            : 'bg-[var(--bg-main)] text-[var(--text-primary)] rounded-bl-md'
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-[var(--border)]">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type your message..."
                                className="input flex-1"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!message.trim()}
                                className="w-10 h-10 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white flex items-center justify-center transition-all hover:shadow-lg hover:shadow-[var(--primary)]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PaperAirplaneIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
