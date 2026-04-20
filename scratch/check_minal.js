
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './backend/models/User.js';
import { FeaturedArtist } from './backend/models/FeaturedArtist.js';
import { Product } from './backend/models/Product.js';

dotenv.config({ path: './backend/.env' });

async function checkArtist() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const nameToSearch = "Dr. Minal Shinde";
        const trimmedName = nameToSearch.trim();
        const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        console.log(`Searching for Featured Artist: "${nameToSearch}"`);
        const featured = await FeaturedArtist.findOne({ name: nameToSearch });
        
        if (!featured) {
            console.log('No FeaturedArtist record found with that exact name.');
            process.exit(0);
        }

        console.log('Featured Artist record found:', {
            id: featured._id,
            linkedArtistId: featured.artist,
            name: featured.name
        });

        console.log(`\nSearching for User with name/username like: "${trimmedName}"`);
        const users = await User.find({
            $or: [
                { displayName: { $regex: new RegExp(`^${escapedName}$`, "i") } },
                { username: { $regex: new RegExp(`^${escapedName}$`, "i") } }
            ]
        });

        if (users.length === 0) {
            console.log('No User found matching that name.');
        } else {
            users.forEach(u => {
                console.log('User match found:', {
                    _id: u._id,
                    username: u.username,
                    displayName: u.displayName,
                    role: u.role
                });
            });
        }

        if (featured.artist) {
            console.log(`\nChecking artworks for linked ID: ${featured.artist}`);
            const products = await Product.find({ artist: featured.artist });
            console.log(`Found ${products.length} products total.`);
            
            const approved = products.filter(p => p.verification?.status === 'approved' && p.status === 'active');
            console.log(`${approved.length} of these are approved and active.`);
        } else {
            console.log('\nWarning: Featured Artist is NOT currently linked to any User account.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkArtist();
