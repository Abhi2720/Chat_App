import { useState } from 'react';
import { friendsAPI } from '../../services/api';
import { Search, UserPlus, Clock, Check } from 'lucide-react';

const SearchUsers = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sentRequests, setSentRequests] = useState(new Set());

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const response = await friendsAPI.searchUsers(query);
            setResults(response.data);
        } catch (error) {
            console.error('Search failed:', error);
        }
        setLoading(false);
    };

    const sendRequest = async (userId) => {
        try {
            await friendsAPI.sendRequest(userId);
            setSentRequests(prev => new Set(prev).add(userId));
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to send request');
        }
    };

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Find Friends</h3>
            
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by username..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    <Search size={20} />
                </button>
            </form>

            <div className="space-y-2">
                {results.map(user => (
                    <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold text-gray-600">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">{user.username}</p>
                                <p className="text-xs text-gray-500">
                                    {user.status === 'online' ? '🟢 Online' : '⚪ Offline'}
                                </p>
                            </div>
                        </div>
                        
                        {user.requestStatus === 'pending' ? (
                            <span className="flex items-center gap-1 text-yellow-600 text-sm">
                                <Clock size={16} /> Pending
                            </span>
                        ) : sentRequests.has(user._id) ? (
                            <span className="flex items-center gap-1 text-green-600 text-sm">
                                <Check size={16} /> Sent
                            </span>
                        ) : (
                            <button
                                onClick={() => sendRequest(user._id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <UserPlus size={20} />
                            </button>
                        )}
                    </div>
                ))}
                
                {results.length === 0 && query.length >= 2 && !loading && (
                    <p className="text-center text-gray-400 py-4">No users found</p>
                )}
            </div>
        </div>
    );
};

export default SearchUsers;