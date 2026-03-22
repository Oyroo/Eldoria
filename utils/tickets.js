const { MongoClient } = require('mongodb');

const URI = process.env.MONGODB_URI;
const DB  = 'eldoria';
const COL = 'tickets';

let col     = null;
let tickets = {};

async function connect() {
    if (col) return col;
    const client = new MongoClient(URI, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    col = client.db(DB).collection(COL);
    return col;
}

async function load() {
    try {
        const c    = await connect();
        const docs = await c.find({}).toArray();
        tickets = {};
        for (const doc of docs) {
            const id = doc._id;
            delete doc._id;
            tickets[id] = { channelId: id, ...doc };
        }
        console.log(`🎫 ${Object.keys(tickets).length} ticket(s) chargé(s) depuis MongoDB.`);
    } catch (err) {
        console.error('❌ MongoDB loadTickets:', err.message);
    }
}

function get() { return tickets; }

function save() {
    connect().then(async c => {
        // Sync complète : supprime tout, réinsère
        await c.deleteMany({});
        const docs = Object.entries(tickets).map(([id, t]) => ({ _id: id, ...t }));
        if (docs.length > 0) await c.insertMany(docs);
    }).catch(err => console.error('❌ MongoDB saveTickets:', err.message));
}

module.exports = { load, get, save };