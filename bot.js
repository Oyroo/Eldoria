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

const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.data.name, command);
        console.log(`📦 Commande chargée : ${command.data.name}`);
    }
}

// ─── Charger les événements ───────────────────────────────────────────────────

const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
    for (const file of eventFiles) {
        const event = require(`./events/${file}`);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
        console.log(`⚡ Événement chargé : ${event.name}`);
    }
}

// ─── Login ────────────────────────────────────────────────────────────────────

client.login(process.env.TOKEN);