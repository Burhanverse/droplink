import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
let db;

export async function connectToDatabase() {
    try {
        if (!uri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        console.log('Attempting to connect to MongoDB Atlas...');
        await client.connect();
        db = client.db('droplinks');
        console.log('Connected to MongoDB Atlas successfully');
        return db;
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}

export async function saveApiKey(userId, apiKey) {
    if (!db) await connectToDatabase();
    const users = db.collection('users');

    await users.updateOne(
        { userId },
        { $set: { userId, apiKey } },
        { upsert: true }
    );

    return true;
}

export async function getApiKey(userId) {
    if (!db) await connectToDatabase();
    const users = db.collection('users');

    const user = await users.findOne({ userId });
    return user?.apiKey || null;
}

export async function deleteApiKey(userId) {
    if (!db) await connectToDatabase();
    const users = db.collection('users');

    const result = await users.updateOne(
        { userId },
        { $unset: { apiKey: "" } }
    );

    return result.modifiedCount > 0;
}

export async function isApiKeyUsed(apiKey, currentUserId) {
    if (!db) await connectToDatabase();
    const users = db.collection('users');

    const existingUser = await users.findOne({
        apiKey: apiKey,
        userId: { $ne: currentUserId }
    });

    return !!existingUser;
}