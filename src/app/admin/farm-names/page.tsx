import FarmNamesManager from '@/components/FarmNamesManager';

export default function FarmNamesPage() {
    return (
        <div className="p-6 md:p-12 min-h-screen bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
                        Neighborhood Management
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Manage farm names for "Goat" neighborhood members directly on Discord.
                    </p>
                </div>

                <FarmNamesManager />
            </div>
        </div>
    );
}
