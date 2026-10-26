const User = require('../models/User');
const Room = require('../models/Room');

async function createPrivateRoom(userId, friendId) {
    const pairKey = [userId, friendId].sort().join('_');

    let room = await Room.findOne({
        type: 'private',
        pairKey
    });

    if (!room) {
        try {
            room = await Room.create({
                name: 'Private Chat',
                type: 'private',
                participants: [userId, friendId],
                pairKey
            });
        } catch (error) {
            // Another request may have created this room
            // after our findOne() returned null.
            if (error.code !== 11000) {
                throw error;
            }

            room = await Room.findOne({
                type: 'private',
                pairKey
            });

            if (!room) {
                throw error;
            }
        }
    } 

    await room.populate('participants', 'username avatar status');
    return room;   
}

module.exports = createPrivateRoom;