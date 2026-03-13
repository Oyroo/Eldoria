const express = require('express');
const fs      = require('fs');
const path    = require('path');
const client  = require('./client');

// ─── Web server (keep-alive Render) ──────────────────────────────────────────

const app = express();
app.get('/', (req, res) => res.send('Bot Eldoria running'));
app.listen(3000, () => console.log('Web server ready'));

// ─── Charger les commandes ────────────────────────────────────────────────────

client.commands = new Map();

const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    console.log(`📦 Commande chargée : ${command.data.name}`);
}

// ─── Charger les événements ───────────────────────────────────────────────────

const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(f => f.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
    console.log(`⚡ Événement chargé : ${event.name}`);
}

// ─── Login ────────────────────────────────────────────────────────────────────

client.login(process.env.TOKEN);