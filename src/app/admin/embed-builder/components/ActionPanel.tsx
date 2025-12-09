import React from 'react';
import { Send, Edit3, Repeat, Trash2, Loader2, Save } from 'lucide-react';

interface ActionPanelProps {
    messageId: string;
    setMessageId: (id: string) => void;
    onSend: () => void;
    onEdit: () => void;
    onResend: () => void;
    onDelete: () => void;
    status: string;
    loading: boolean;
}

export default function ActionPanel({
    messageId, setMessageId, onSend, onEdit, onResend, onDelete, status, loading
}: ActionPanelProps) {
    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mt-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-200">Actions</h3>
            <div className="space-y-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Message ID (for Edit/Resend/Delete)"
                        className="bg-gray-900 border border-gray-700 text-white rounded-lg p-2.5 flex-1 text-sm focus:border-blue-500 focus:outline-none"
                        value={messageId}
                        onChange={e => setMessageId(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onSend}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        SEND NEW
                    </button>

                    <button
                        onClick={onEdit}
                        disabled={loading || !messageId}
                        className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-yellow-900/20"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
                        EDIT
                    </button>

                    <button
                        onClick={onResend}
                        disabled={loading || !messageId}
                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-900/20"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Repeat className="w-4 h-4" />}
                        RESEND
                    </button>

                    <button
                        onClick={onDelete}
                        disabled={loading || !messageId}
                        className="bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-900/20"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        DELETE
                    </button>
                </div>

                {status && (
                    <div className={`
                        p-3 rounded-lg text-center text-sm font-semibold animate-in fade-in slide-in-from-top-1
                        ${status.startsWith('Error') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}
                    `}>
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
}
