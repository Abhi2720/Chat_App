const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const friendRoutes = require('./routes/friends');
const socketHandlers = require('./socket/handlers');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

db.connect();

app.get("/", (req, res) => {
    res.send("Chat Server is running 🚀");
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/friends', friendRoutes);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    },
});

app.set('io', io);

socketHandlers(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on Port ${PORT}`);
});