const fs   = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

// Crée config.json s'il n'existe pas encore (premier démarrage sur Render)
if (!fs.existsSync(CONFIG_PATH)) {
    const initial = {
        guildId:            process.env.GUILD_ID ?? '',
        welcomeChannelId:   '',
        leaveChannelId:     '',
        welcomeText:        'Sur {guild}, tu peux explorer et t\'amuser !',
        leaveText:          'Tu vas nous manquer. Reviens quand tu veux !',
        ticketCounter:      0,
        ticketCategories:   {},
    };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(initial, null, 4));
    console.log('📄 config.json créé depuis les variables d\'environnement.');
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

// Garantir les champs minimum
if (!config.guildId)          config.guildId          = process.env.GUILD_ID ?? '';
if (!config.welcomeChannelId) config.welcomeChannelId = '';
if (!config.leaveChannelId)   config.leaveChannelId   = '';
if (!config.welcomeText)      config.welcomeText      = 'Sur {guild}, tu peux explorer et t\'amuser !';
if (!config.leaveText)        config.leaveText        = 'Tu vas nous manquer. Reviens quand tu veux !';
if (!config.ticketCategories) config.ticketCategories = {};
if (!config.ticketCounter)    config.ticketCounter    = 0;

function saveConfig() {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4));
}

module.exports = { config, saveConfig };