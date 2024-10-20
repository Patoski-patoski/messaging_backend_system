import dotenv from 'dotenv';

dotenv.config();

export default {
    mongodb: {
        url: process.env.MONGODB_URI || "mongodb://localhost/chatapp",
        dbName: 'chatapp'
    },
    redis: {
        url: process.env.REDIS_URI || 'redis://localhost:6379'
    },
    server: {
        port: process.env.PORT || 3000,
        hostname: process.env.HOSTNAME || 'localhost',
    },
    session: {
        secret: process.env.SESSION_SECRET,
        cookie: {
            maxAge: 12 * 60 * 60 * 1000, /* estimated 12 hours */
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
        }
    },
    environment: process.env.NODE_ENV === 'development',
}