const fs   = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');
const DATA_PATH   = path.join(__dirname, '..', 'data.json');

// config.json (dans le repo) : uniquement guildId
const config = require(CONFIG_PATH);

// data.json (gitignore) : tout ce qui change au runtime
function loadData() {
    try {
        if (fs.existsSync(DATA_PATH))
            return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    } catch {}
    return {};
}

const _data = loadData();

if (!_data.ticketCategories) _data.ticketCategories = {};
if (!_data.ticketCounter)    _data.ticketCounter    = 0;

// On fusionne dans config pour que le reste du code ne change pas
config.ticketCategories = _data.ticketCategories;
config.ticketCounter    = _data.ticketCounter;

function saveConfig() {
    // Sauvegarder uniquement dans data.json — config.json reste intact
    const toSave = {
        ticketCategories: config.ticketCategories,
        ticketCounter:    config.ticketCounter,
    };
    fs.writeFileSync(DATA_PATH, JSON.stringify(toSave, null, 4));
}

module.exports = { config, saveConfig };