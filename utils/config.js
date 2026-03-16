const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'config.json');

// Si config.json n'existe pas encore (premier démarrage / deploy fresh),
// on le crée depuis la variable d'environnement CONFIG_DATA si elle est définie,
// sinon on repart d'une config vide.
if (!fs.existsSync(FILE)) {
    let initial;
    if (process.env.CONFIG_DATA) {
        try {
            initial = JSON.parse(process.env.CONFIG_DATA);
            console.log('📄 config.json créé depuis CONFIG_DATA.');
        } catch (e) {
            console.error('❌ CONFIG_DATA invalide, démarrage avec config vide.');
        }
    }
    if (!initial) {
        initial = {
            guildId:          process.env.GUILD_ID ?? '',
            ticketCounter:    0,
            ticketCategories: {},
        };
    }
    fs.writeFileSync(FILE, JSON.stringify(initial, null, 4));
}

const config = JSON.parse(fs.readFileSync(FILE, 'utf-8'));

config.guildId          ??= process.env.GUILD_ID ?? '';
config.ticketCounter    ??= 0;
config.ticketCategories ??= {};

function saveConfig() {
    fs.writeFileSync(FILE, JSON.stringify(config, null, 4));
}

module.exports = { config, saveConfig };