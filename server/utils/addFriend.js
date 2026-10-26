const User = require('../models/User');

async function addFriends(userId, friendId) {
    await User.findByIdAndUpdate(userId, {
        $addToSet: { friends: friendId }
    });
    await User.findByIdAndUpdate(friendId, {
        $addToSet: { friends: userId }
    });
}

module.exports = addFriends;
