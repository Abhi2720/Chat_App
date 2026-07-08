const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No token, access denied' });
        }

        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ error: 'Token is not valid' });
        }

        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};


const socketAuth = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return next(new Error('Authentication error: User not found'));
        }

        socket.user = user;
        next();
    } catch (error) {
        next(new Error('Authentication error: Invalid token'));
    }
};

module.exports = { authMiddleware, socketAuth };