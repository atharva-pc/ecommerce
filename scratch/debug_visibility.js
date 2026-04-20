
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './backend/models/User.js';
import { Product } from './backend/models/Product.js';
import { FeaturedArtist } from './backend/models/FeaturedArtist.js';

dotenv.config({ path: './backend/.env' });

async function debugAll() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const names = ["Dr. Minal Shinde", "Prof. Dr. Shraddha Kaje"];
        
        for (const name of names) {
            console.log(`\n--- Checking "${name}" ---`);
            const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // 1. Find User
            const user = await User.findOne({
                $or: [
                    { displayName: { $regex: new RegExp(`^${escapedName}$`, "i") } },
                    { username: { $regex: new RegExp(`^${escapedName}$`, "i") } }
                ]
            });
            
            if (!user) {
                console.log(`User NOT FOUND for "${name}"`);
                continue;
            }
            
            console.log(`User Found: ID ${user._id}, Username: ${user.username}, Role: ${user.role}`);
            
            // 2. Find Featured Artist Record
            const featured = await FeaturedArtist.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, "i") } });
            if (featured) {
                console.log(`Featured Record Found: ID ${featured._id}, Linked Artist ID: ${featured.artist}`);
            } else {
                console.log(`Featured Record NOT FOUND in DB.`);
            }
            
            // 3. Find ALL products for this user
            const products = await Product.find({ artist: user._id });
            console.log(`Total Products in DB for this User ID: ${products.length}`);
            
            if (products.length > 0) {
                products.forEach((p, i) => {
                    if (i < 3) console.log(` - [${p.verification.status}] ${p.status} : ${p.title}`);
                });
                const visible = products.filter(p => p.status === 'active' && p.verification?.status === 'approved');
                console.log(`Visible Products Count (active+approved): ${visible.length}`);
            }
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

debugAll();
