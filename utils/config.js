const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'config.json');

// Crée config.json au premier démarrage (Render, après un deploy fresh)
if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify({
        guildId:          process.env.GUILD_ID ?? '',
        ticketCounter:    0,
        ticketCategories: {},
    }, null, 4));
}

const config = JSON.parse(fs.readFileSync(FILE, 'utf-8'));

// Valeurs par défaut
config.guildId          ??= process.env.GUILD_ID ?? '';
config.ticketCounter    ??= 0;
config.ticketCategories ??= {};

function saveConfig() {
    fs.writeFileSync(FILE, JSON.stringify(config, null, 4));
}

module.exports = { config, saveConfig };