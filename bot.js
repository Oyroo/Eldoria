const express = require('express');
const fs      = require('fs');
const path    = require('path');v
const client  = require('./client');

const app = express();

// ── Endpoint status ─────────────────────────────────────────────────────────
app.get('/status', (_, res) => {
    res.json({
        web: 'online',
        discord: client.isReady() ? 'online' : 'offline'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Web server listening on port ${PORT}`));

// ── Keep-alive pour Render Free ─────────────────────────────────────────────
setInterval(() => {
    fetch(`http://localhost:${PORT}/status`).catch(() => {});
}, 3 * 60 * 1000); // toutes les 3 minutes

// ── Commandes ───────────────────────────────────────────────────────────────
client.commands = new Map();
const cmdDir = path.join(__dirname, 'commands');
if (fs.existsSync(cmdDir)) {
    for (const file of fs.readdirSync(cmdDir).filter(f => f.endsWith('.js'))) {
        const cmd = require(`./commands/${file}`);
        client.commands.set(cmd.data.name, cmd);
        console.log(`📦 ${cmd.data.name}`);
    }
}

// ── Événements ───────────────────────────────────────────────────────────────
const evtDir = path.join(__dirname, 'events');
if (fs.existsSync(evtDir)) {
    for (const file of fs.readdirSync(evtDir).filter(f => f.endsWith('.js'))) {
        const evt = require(`./events/${file}`);
        client[evt.once ? 'once' : 'on'](evt.name, (...args) => evt.execute(...args));
        console.log(`⚡ ${evt.name}`);
    }
}

// ── Événements de logs ───────────────────────────────────────────────────────
const logsDir = path.join(__dirname, 'events', 'logs');
if (fs.existsSync(logsDir)) {
    for (const file of fs.readdirSync(logsDir).filter(f => f.endsWith('.js'))) {
        const evts = require(`./events/logs/${file}`);
        const list = Array.isArray(evts) ? evts : [evts];
        for (const evt of list) {
            client[evt.once ? 'once' : 'on'](evt.name, (...args) => evt.execute(...args));
        }
        console.log(`📋 logs/${file}`);
    }
}

// ── Gestion des erreurs ─────────────────────────────────────────────────────
process.on('unhandledRejection', err => console.error('Unhandled rejection:', err));
process.on('uncaughtException', err => console.error('Uncaught exception:', err));

// ── Logs de connexion Discord ───────────────────────────────────────────────
client.once('clientReady', () => {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
    const { startScheduler } = require('./utils/meteo');
    startScheduler(client);
});

// ── Logs de déconnexion/reconnexion ─────────────────────────────────────────
client.on('disconnect', () => console.log('❌ Discord disconnected'));
client.on('reconnecting', () => console.log('🔄 Discord reconnecting...'));
client.on('error', console.error);

// ── Login Discord ──────────────────────────────────────────────────────────
client.login(process.env.TOKEN);