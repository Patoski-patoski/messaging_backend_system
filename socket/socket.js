// socket/socket.js

import { Server } from 'socket.io';
import { getClient, connectToDataBase } from '../routes/database.js';
import config from '../config.js';

let db;
export const ADMIN = 'Admin';
const DB_NAME = config.mongodb.dbName;

await connectToDataBase();

const setupSocketIO = async (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.NODE_ENV === 'production'
                ? ['https://messaging-backend-system.onrender.com/']
                : ['http://localhost:3000'],
            credentials: true
        }
    });

    //Get the MongoDB client and database
    const client = getClient();
    db = client.db(DB_NAME);

    io.on('connection', async (socket) => {
        console.log(`User ${socket.id} connected`);

        //Listen for event on enterRoom
        socket.on('enterRoom', async ({ name, room }) => {
            const isNameAndRoom = await getUsersAndRoom(name, room);
            if (isNameAndRoom) {
                await deleteUserAndRooms(name, room);
            }
            // leave previous room 
            const prevUser = await getUser(socket.id);
            if (prevUser) {
                socket.leave(prevUser.room)
                io.to(prevUser.room).emit('message', buildMsg(ADMIN, `${name} has left the chat`))
                await deleteUser(socket.id);
            }
           
            const user = await activateUser(socket.id, name, room);
            if (prevUser) {
                io.to(prevUser.room).emit('userList', {
                    users: await getUsersInRoom(prevUser.room)
                })
            }

            // join room 
            socket.join(user.room);

            // load previous message for this chat
            const chatHistory = await getChatHistory(room);
            socket.emit('chatHistory', chatHistory);

            // To user who joined 
            socket.emit('message', buildMsg(ADMIN, `You have started a conversation at ${user.room}`))

            // To everyone else 
            socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} is online`))

            // Update user list for room 
            io.to(user.room).emit('userList', {
                users: await getUsersInRoom(user.room)
            })

        });

        // When user disconnects - to all others 
        socket.on('disconnect', async () => {
            const user = await getUser(socket.id);
            await deleteUser(socket.id);

            if (user) {
                io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} is offline`))

                io.to(user.room).emit('userList', {
                    users: await getUsersInRoom(user.room)
                })
            }
            console.log(`User ${socket.id} disconnected`);
        })

        // Listening for a message event 
        socket.on('message', async ({ name, text }) => {
            const user = await getUser(socket.id);
            if (user) {
                const messageData = buildMsg(name, text);
                // Save message to database
                await saveMessage(user.room, messageData);
                io.to(user.room).emit('message', messageData);
            }
        })

        // Listen for activity 
        socket.on('activity', async (name) => {
            const user = await getUser(socket.id);
            if (user) {
                socket.broadcast.to(user.room).emit('activity', name)
            }
        })
    })
    return io;
};

function buildMsg(name, text) {
    return {
        name,
        text,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        }).format(new Date()),
        timestamp: new Date()
    }
}

async function saveMessage(room, messageData) {
    await db.collection('messages').insertOne({ room, ...messageData });
}

async function getChatHistory(room) {
    return await db.collection('messages').find({ room }).sort({ timestamp: 1 }).toArray();
}

// User functions 
async function activateUser(id, name, room) {
    const user = { id, name, room };
    await db.collection('users').updateOne(
        { id: id },
        { $set: user },
        { upsert: true }
    );
    return user;
}

async function getUser(id) {
    return await db.collection('users').findOne({ id: id });
}

async function getUsersInRoom(room) {
    return await db.collection('users').find({ room: room }).toArray();
}
async function getUsersAndRoom(room, name) {
    return await db.collection('users').find({ room: room , name, name}).toArray();
}

async function getAllActiveRooms() {
    return await db.collection('users').distinct('room');
}

async function deleteUser(id) {
    return await db.collection('users').deleteOne({ id: id });
}
async function deleteUserAndRooms(name, room) {
    return await db.collection('users').deleteMany({ room: room, name: name });
}

export default setupSocketIO;
