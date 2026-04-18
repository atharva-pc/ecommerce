const mongoose = require('mongoose');
const MONGO_URI = "mongodb+srv://artvpp_db_user:wZhLY4UGnyddrpbI@clusterartvpp.t0n4vxz.mongodb.net/artvpp?retryWrites=true&w=majority";

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        const users = await mongoose.connection.collection('users').find({ role: 'artist' }).toArray();
        console.log('--- ARTISTS ---');
        users.forEach(u => {
            console.log(`Name: ${u.displayName || u.username} | ID: ${u._id.toString()}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
