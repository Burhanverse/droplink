import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);
let db;

export async function connectToDatabase() {
    try {
        await client.connect();
        db = client.db('telegram_bot');
        console.log('Connected to MongoDB');
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