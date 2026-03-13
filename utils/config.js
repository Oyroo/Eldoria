const fs   = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

const config = require(CONFIG_PATH);

if (!config.ticketCategories) config.ticketCategories = {};
if (!config.ticketCounter)    config.ticketCounter    = 0;
if (!config.textChannelsToConvert) config.textChannelsToConvert = [];

function saveConfig() {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4));
}

module.exports = { config, saveConfig };