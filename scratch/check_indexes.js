
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

async function checkIndexes() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        const indexes = await db.collection('featuredartists').indexes();
        console.log("Indexes for featuredartists:");
        console.log(JSON.stringify(indexes, null, 2));
        
        // Also check if we can save two artists with same name (if that's the issue)
        // Or if there is a unique index we missed.
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkIndexes();
