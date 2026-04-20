
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { FeaturedArtist } from './backend/models/FeaturedArtist.js';

dotenv.config({ path: './backend/.env' });

async function listFeatured() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const artists = await FeaturedArtist.find().populate('artist');
        console.log(JSON.stringify(artists, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

listFeatured();
