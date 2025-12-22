'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import Image from 'next/image';

interface ChatMessage {
    id: string;
    content: string;
    author_name: string;
    author_avatar: string;
    created_at: string;
    source: 'web' | 'discord';
}

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [user, setUser] = useState<any>(null);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // 1. Auth & Initial Load
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        checkUser();

        // 2. Load History (Last 50 messages)
        const loadHistory = async () => {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (data) {
                setMessages(data.reverse()); // Show oldest first
            }
        };
        loadHistory();

        // 3. Realtime Subscription
        const channel = supabase
            .channel('public:chat_messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                (payload) => {
                    const newMsg = payload.new as ChatMessage;
                    setMessages(prev => [...prev, newMsg]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Scroll to bottom functionality
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || isSending) return;

        setIsSending(true);
        const tempContent = newMessage;
        setNewMessage(''); // Optimistic clear

        try {
            const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: tempContent })
            });

            if (!res.ok) {
                console.error('Failed to send message');
                setNewMessage(tempContent); // Revert on failure
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setNewMessage(tempContent);
        } finally {
            setIsSending(false);
        }
    };

    if (!user && isOpen) {
        // Simple View for logged out users (or prompt to login)
        // For MVP, assume they see it but can't type?
        // Or specific UX? Implemented below.
    }

    // If not logged in, do not render anything
    if (!user) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-80 sm:w-96 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[500px]"
                    >
                        {/* Header */}
                        <div className="bg-gray-800 p-3 flex justify-between items-center border-b border-gray-700">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Live Bridge
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/95 backdrop-blur-sm scrollbar-thin scrollbar-thumb-gray-700">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-3 ${msg.source === 'web' && msg.author_name === user?.user_metadata?.full_name ? 'flex-row-reverse' : ''}`}>
                                    {/* Avatar */}
                                    <div className="flex-shrink-0 w-8 h-8 relative rounded-full overflow-hidden border border-gray-700">
                                        <Image
                                            src={msg.author_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                                            alt={msg.author_name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>

                                    {/* Bubble */}
                                    <div className={`max-w-[85%] flex flex-col ${msg.source === 'web' && msg.author_name === user?.user_metadata?.full_name ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[12px] font-medium text-gray-400">
                                                {msg.author_name}
                                            </span>
                                            {msg.source === 'discord' && (
                                                <span className="text-[9px] bg-[#5865F2] text-white px-1 py-0.5 rounded font-bold tracking-wide">
                                                    DISCORD
                                                </span>
                                            )}
                                        </div>
                                        <div className={`px-3 py-2 rounded-2xl text-[14px] leading-snug break-words shadow-sm ${msg.source === 'web'
                                            ? 'bg-green-600 text-white rounded-tr-sm'
                                            : 'bg-[#36393f] text-gray-100 rounded-tl-sm border border-gray-700'
                                            }`}>
                                            {msg.content}
                                        </div>
                                        <span className="text-[10px] text-gray-500 mt-1 px-1">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-gray-800 border-t border-gray-700">
                            {user ? (
                                <form onSubmit={handleSend} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 transition-colors"
                                        disabled={isSending}
                                    />
                                    <button
                                        type="submit"
                                        className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                                        disabled={isSending || !newMessage.trim()}
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center text-xs text-gray-400">
                                    Please login to chat.
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all transform hover:scale-110 active:scale-95 z-[60]
                    ${isOpen ? 'bg-gray-700 text-gray-300 rotate-90' : 'bg-[#5865F2] text-white'}
                `}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
            </button>
        </div>
    );
}
