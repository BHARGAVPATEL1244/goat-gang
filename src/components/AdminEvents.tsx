'use client';

import React, { useState, useEffect } from 'react';
import { EventDB } from '@/lib/types';
import { getEvents, createEvent, updateEvent, deleteEvent } from '@/app/actions/events';
import { Plus, Trash2, Save, Edit2, X, Loader2 } from 'lucide-react';

export default function AdminEvents() {
    const [events, setEvents] = useState<EventDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [newEvent, setNewEvent] = useState<Partial<EventDB>>({
        name: '',
        image: '',
        category: 'Main',
        winners: [],
        host: '',
        sponsors: [],
    });

    const [winnerInput, setWinnerInput] = useState('');
    const [firstPlace, setFirstPlace] = useState('');
    const [secondPlace, setSecondPlace] = useState('');
    const [thirdPlace, setThirdPlace] = useState('');

    const [sponsorName, setSponsorName] = useState('');
    const [sponsorAmount, setSponsorAmount] = useState('');

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        setLoading(true);
        const data = await getEvents();
        setEvents(data);
        setLoading(false);
    };

    const handleAddWinner = () => {
        if (winnerInput.trim()) {
            setNewEvent({
                ...newEvent,
                winners: [...(newEvent.winners || []), winnerInput.trim()]
            });
            setWinnerInput('');
        }
    };

    const handleAddSponsor = () => {
        if (sponsorName.trim() && sponsorAmount.trim()) {
            setNewEvent({
                ...newEvent,
                sponsors: [...(newEvent.sponsors || []), { name: sponsorName.trim(), amount: sponsorAmount.trim() }]
            });
            setSponsorName('');
            setSponsorAmount('');
        }
    };

    const handleEdit = (event: EventDB) => {
        setNewEvent({
            name: event.name,
            image: event.image,
            category: event.category,
            date: event.date,
            winners: event.winners,
            host: event.host,
            sponsors: event.sponsors,
        });

        // Populate specific places if it's a ranked event
        if (event.category !== 'Weekly Derby' && event.winners && event.winners.length >= 3) {
            setFirstPlace(event.winners[0] || '');
            setSecondPlace(event.winners[1] || '');
            setThirdPlace(event.winners[2] || '');
        } else {
            setFirstPlace('');
            setSecondPlace('');
            setThirdPlace('');
        }

        setEditingId(event.id);
        setIsAdding(true);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setNewEvent({
            name: '',
            image: '',
            category: 'Main',
            date: '',
            winners: [],
            host: '',
            sponsors: [],
        });
        setFirstPlace('');
        setSecondPlace('');
        setThirdPlace('');
    };

    const handleSave = async () => {
        if (!newEvent.name || !newEvent.image) return;

        let finalWinners = newEvent.winners || [];

        // If it's a ranked event, reconstruct the winners array with top 3 at the beginning
        if (newEvent.category !== 'Weekly Derby') {
            const otherWinners = editingId
                ? (newEvent.winners?.slice(3) || []) // If editing, keep existing "others" (assuming they were after index 2)
                : (newEvent.winners || []); // If new, winners might just be "others" added via the list input

            // Actually, let's simplify: 
            // The "winners" state will hold the "others" for ranked events.
            // We will prepend 1st, 2nd, 3rd to it on save.
            // But wait, handleEdit sets newEvent.winners to the FULL list.
            // So we need to be careful not to duplicate.

            // Better approach for Save:
            // 1. Get the "others" list. 
            //    If we are editing, and we just loaded the full list into newEvent.winners, 
            //    we need to strip the first 3 IF we are in a ranked mode.
            //    BUT, the user might have modified the "others" list using the UI.

            // Let's rely on the UI state.
            // For ranked events, the UI shows 1st/2nd/3rd inputs AND a list for "Additional Winners".
            // The "Additional Winners" list in the UI should theoretically NOT include the top 3.
            // So when we enter Edit mode, we should split the array.

            // RE-VISITING handleEdit logic above:
            // I need to split newEvent.winners so the state only contains "others".
        }

        // Let's fix handleEdit to split properly first.
        // See updated handleEdit below in the full replacement.

        if (newEvent.category !== 'Weekly Derby') {
            // Combine specific places with the rest
            finalWinners = [
                firstPlace,
                secondPlace,
                thirdPlace,
                ...(newEvent.winners || [])
            ].filter(w => w.trim() !== '');
        }

        const eventToSave = {
            ...newEvent,
            winners: finalWinners
        };

        if (editingId) {
            await updateEvent(editingId, eventToSave);
        } else {
            await createEvent(eventToSave);
        }

        await loadEvents();
        handleCancel();
    };

    // ... handleDelete ...

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this event?')) {
            await deleteEvent(id);
            await loadEvents();
        }
    };

    // Custom handleEdit to split winners
    const handleEditWithSplit = (event: EventDB) => {
        let others: string[] = [];
        if (event.category !== 'Weekly Derby' && event.winners) {
            setFirstPlace(event.winners[0] || '');
            setSecondPlace(event.winners[1] || '');
            setThirdPlace(event.winners[2] || '');
            others = event.winners.slice(3);
        } else {
            setFirstPlace('');
            setSecondPlace('');
            setThirdPlace('');
            others = event.winners || [];
        }

        setNewEvent({
            name: event.name,
            image: event.image,
            category: event.category,
            date: event.date,
            winners: others, // Only "others" in the array state for ranked events
            host: event.host,
            sponsors: event.sponsors,
        });
        setEditingId(event.id);
        setIsAdding(true);
    };

    // ... 

    return (
        <div className="space-y-6">
            {/* ... Header ... */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Events</h2>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Event
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                    {/* ... Title & Close ... */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">{editingId ? 'Edit Event' : 'New Event Details'}</h3>
                        <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* ... Basic Fields ... */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Event Name</label>
                            <input
                                type="text"
                                value={newEvent.name}
                                onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Image URL</label>
                            <input
                                type="text"
                                value={newEvent.image}
                                onChange={e => setNewEvent({ ...newEvent, image: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <select
                                value={newEvent.category}
                                onChange={e => setNewEvent({ ...newEvent, category: e.target.value as any })}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                            >
                                <option value="Main">Main Event</option>
                                <option value="Mini">Mini Event</option>
                                <option value="Weekly Derby">Weekly Derby</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Event Date</label>
                            <input
                                type="date"
                                value={newEvent.date || ''}
                                onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Host</label>
                            <input
                                type="text"
                                value={newEvent.host}
                                onChange={e => setNewEvent({ ...newEvent, host: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                            />
                        </div>
                    </div>

                    {/* Winners Section */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Winners</label>

                        {newEvent.category !== 'Weekly Derby' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs text-yellow-600 dark:text-yellow-400 font-bold mb-1">1st Place 🥇</label>
                                    <input
                                        type="text"
                                        value={firstPlace}
                                        onChange={e => setFirstPlace(e.target.value)}
                                        className="w-full p-2 rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20"
                                        placeholder="Winner Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 dark:text-gray-400 font-bold mb-1">2nd Place 🥈</label>
                                    <input
                                        type="text"
                                        value={secondPlace}
                                        onChange={e => setSecondPlace(e.target.value)}
                                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
                                        placeholder="Winner Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-orange-700 dark:text-orange-400 font-bold mb-1">3rd Place 🥉</label>
                                    <input
                                        type="text"
                                        value={thirdPlace}
                                        onChange={e => setThirdPlace(e.target.value)}
                                        className="w-full p-2 rounded-lg border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20"
                                        placeholder="Winner Name"
                                    />
                                </div>
                            </div>
                        )}

                        <label className="block text-xs font-medium mb-1 text-gray-500">
                            {newEvent.category !== 'Weekly Derby' ? 'Additional Winners / Honorable Mentions' : 'Winners List'}
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={winnerInput}
                                onChange={e => setWinnerInput(e.target.value)}
                                className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                                placeholder="Add winner..."
                                onKeyDown={e => e.key === 'Enter' && handleAddWinner()}
                            />
                            <button onClick={handleAddWinner} type="button" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {newEvent.winners?.map((winner, idx) => (
                                <span key={idx} className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                                    {winner}
                                    <button onClick={() => setNewEvent({ ...newEvent, winners: newEvent.winners?.filter((_, i) => i !== idx) })} className="hover:text-red-500">×</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Sponsors Section */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Sponsors</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={sponsorName}
                                onChange={e => setSponsorName(e.target.value)}
                                className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                                placeholder="Sponsor Name"
                            />
                            <input
                                type="text"
                                value={sponsorAmount}
                                onChange={e => setSponsorAmount(e.target.value)}
                                className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                                placeholder="Amount"
                            />
                            <button onClick={handleAddSponsor} type="button" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg">Add</button>
                        </div>
                        <div className="space-y-1">
                            {newEvent.sponsors?.map((sponsor, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
                                    <span className="text-sm">{sponsor.name} - <span className="text-green-600">{sponsor.amount}</span></span>
                                    <button onClick={() => setNewEvent({ ...newEvent, sponsors: newEvent.sponsors?.filter((_, i) => i !== idx) })} className="text-red-500 hover:text-red-700">×</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button onClick={handleCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                            <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Save'} Event
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {events.map((event) => (
                    <div key={event.id} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <img src={event.image} alt={event.name} className="w-16 h-16 rounded-lg object-cover" />
                        <div className="flex-1">
                            <h4 className="font-bold text-lg">{event.name}</h4>
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">{event.category}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleEditWithSplit(event)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                                <Edit2 className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleDelete(event.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
                {events.length === 0 && !loading && (
                    <div className="text-center text-gray-500 py-8">No events found. Add one!</div>
                )}
            </div>
        </div>
    );
}
