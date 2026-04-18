const mongoose = require('mongoose');
const MONGO_URI = "mongodb+srv://artvpp_db_user:wZhLY4UGnyddrpbI@clusterartvpp.t0n4vxz.mongodb.net/artvpp?retryWrites=true&w=majority";

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        const products = await mongoose.connection.collection('products').find({}).toArray();
        const userIds = [...new Set(products.map(p => p.artist))];
        const users = await mongoose.connection.collection('users').find({ _id: { $in: userIds } }).toArray();
        const userMap = {};
        users.forEach(u => userMap[u._id.toString()] = u.displayName || u.username);

        console.log('--- PRODUCTS BY ARTIST ---');
        products.forEach(p => {
            console.log(`Title: ${p.title} | Artist: ${userMap[p.artist.toString()]} | DisplayName: ${p.displayName}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
