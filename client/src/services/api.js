import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData)
};

export const chatAPI = {
    getMessages: (roomId, page = 1) => api.get(`/chat/messages/${roomId}?page=${page}`),
    getRooms: () => api.get('/chat/rooms'),
    getPrivateRoom: (friendId) => api.get(`/chat/private-room/${friendId}`),
    createRoom: (roomData) => api.post('/chat/rooms', roomData)
};

export const friendsAPI = {
    searchUsers: (query) => api.get(`/friends/search?query=${query}`),
    sendRequest: (userId) => api.post('/friends/request', { userId }),
    getRequests: () => api.get('/friends/requests'),
    acceptRequest: (requestId) => api.post('/friends/accept', { requestId }),
    rejectRequest: (requestId) => api.post('/friends/reject', { requestId }),
    getFriends: () => api.get('/friends/my-friends'),
    unfriend: (friendId) => api.delete(`/friends/unfriend/${friendId}`)
};

export default api;