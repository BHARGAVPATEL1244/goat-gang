'use client';

import React, { useEffect, useState } from 'react';
import { EventDB } from '@/lib/types';
import { getEvents } from '@/app/actions/events';
import EventCard from '@/components/EventCard';
import { Loader2 } from 'lucide-react';

export default function EventsPage() {
    const [events, setEvents] = useState<EventDB[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            const data = await getEvents();
            setEvents(data);
            setLoading(false);
        }
        loadData();
    }, []);

    const mainEvents = events.filter(e => e.category === 'Main');
    const miniEvents = events.filter(e => e.category === 'Mini');
    const derbyEvents = events.filter(e => e.category === 'Weekly Derby');

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;

    return (
        <div className="space-y-16">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">Events & Competitions</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Compete, win, and earn glory. Check out our latest events and winners.
                </p>
            </div>

            {/* Main Events */}
            <section className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white border-l-4 border-yellow-500 pl-4">Main Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mainEvents.map(event => (
                        <EventCard key={event.id} event={event} />
                    ))}
                    {mainEvents.length === 0 && <p className="text-gray-500">No main events currently active.</p>}
                </div>
            </section>

            {/* Mini Events */}
            <section className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white border-l-4 border-blue-500 pl-4">Mini Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {miniEvents.map(event => (
                        <EventCard key={event.id} event={event} />
                    ))}
                    {miniEvents.length === 0 && <p className="text-gray-500">No mini events currently active.</p>}
                </div>
            </section>

            {/* Weekly Derby */}
            <section className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white border-l-4 border-purple-500 pl-4">Weekly Derby</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {derbyEvents.map(event => (
                        <EventCard key={event.id} event={event} />
                    ))}
                    {derbyEvents.length === 0 && <p className="text-gray-500">No derby events currently active.</p>}
                </div>
            </section>
        </div>
    );
}
