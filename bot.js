const express = require('express');
const fs      = require('fs');
const path    = require('path');
const client  = require('./client');

// ── Keep-alive Render ─────────────────────────────────────────────────────────
const app = express();
app.get('/', (_, res) => res.send('Eldoria online'));
app.listen(3000);

// ── Commandes ─────────────────────────────────────────────────────────────────
client.commands = new Map();
const cmdDir = path.join(__dirname, 'commands');
if (fs.existsSync(cmdDir)) {
    for (const file of fs.readdirSync(cmdDir).filter(f => f.endsWith('.js'))) {
        const cmd = require(`./commands/${file}`);
        client.commands.set(cmd.data.name, cmd);
        console.log(`📦 ${cmd.data.name}`);
    }
}

// ── Événements ────────────────────────────────────────────────────────────────
const evtDir = path.join(__dirname, 'events');
if (fs.existsSync(evtDir)) {
    for (const file of fs.readdirSync(evtDir).filter(f => f.endsWith('.js'))) {
        const evt = require(`./events/${file}`);
        client[evt.once ? 'once' : 'on'](evt.name, (...args) => evt.execute(...args));
        console.log(`⚡ ${evt.name}`);
    }
}

client.once('clientReady', () => {
    const { startScheduler } = require('./utils/meteo');
    startScheduler(client);
});

// Empêche le bot de crasher sur les erreurs non gérées
process.on('unhandledRejection', err => {
    console.error('Unhandled rejection:', err?.message ?? err);
});

client.login(process.env.TOKEN);