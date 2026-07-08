import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Sidebar from './components/Sidebar/Sidebar';
import ChatWindow from './components/Chat/ChatWindow';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    return user ? children : <Navigate to="/login" />;
};

const ChatLayout = () => (
    <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <ChatWindow />
    </div>
);

function App() {
    return (
        <AuthProvider>
            <ChatProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route 
                            path="/chat" 
                            element={
                                <ProtectedRoute>
                                    <ChatLayout />
                                </ProtectedRoute>
                            } 
                        />
                        <Route path="/" element={<Navigate to="/chat" />} />
                    </Routes>
                </Router>
            </ChatProvider>
        </AuthProvider>
    );
}

export default App;