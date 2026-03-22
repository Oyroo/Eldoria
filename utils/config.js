const { MongoClient } = require('mongodb');

const URI = process.env.MONGODB_URI;
const DB  = 'eldoria';
const COL = 'config';

let col = null;

async function connect() {
    if (col) return col;
    const client = new MongoClient(URI, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    col = client.db(DB).collection(COL);
    console.log('🍃 MongoDB connecté.');
    return col;
}

// Config en mémoire — partagée par tout le bot
const config = {
    guildId:          process.env.GUILD_ID ?? '',
    ticketCounter:    0,
    ticketCategories: {},
    meteo:            {},
    welcome:          {},
};

// Appelé au démarrage dans events/ready.js
async function loadConfig() {
    try {
        const c   = await connect();
        const doc = await c.findOne({ _id: 'main' });
        if (doc) {
            delete doc._id;
            Object.assign(config, doc);
            console.log('📄 Config chargée depuis MongoDB.');
        } else {
            await c.insertOne({ _id: 'main', ...config });
            console.log('📄 Config initialisée dans MongoDB.');
        }
    } catch (err) {
        console.error('❌ MongoDB loadConfig:', err.message);
    }
}

// Fire and forget — ne bloque jamais le bot
function saveConfig() {
    connect()
        .then(c => c.replaceOne(
            { _id: 'main' },
            { _id: 'main', ...config },
            { upsert: true }
        ))
        .then(() => console.log('💾 Config sauvegardée.'))
        .catch(err => console.error('❌ MongoDB saveConfig:', err.message));
}

module.exports = { config, loadConfig, saveConfig };