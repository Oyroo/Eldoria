const fs   = require('fs');
const path = require('path');
const https = require('https');

const FILE = path.join(__dirname, '..', 'config.json');

// ─── Restauration depuis CONFIG_DATA ─────────────────────────────────────────

function restoreFromEnv() {
    if (!process.env.CONFIG_DATA) return null;
    try { return JSON.parse(process.env.CONFIG_DATA); }
    catch { console.error('❌ CONFIG_DATA invalide.'); return null; }
}

let config;
const fromEnv = restoreFromEnv();

if (!fs.existsSync(FILE)) {
    config = fromEnv ?? {
        guildId:          process.env.GUILD_ID ?? '',
        ticketCounter:    0,
        ticketCategories: {},
    };
    fs.writeFileSync(FILE, JSON.stringify(config, null, 4));
    console.log(fromEnv ? '📄 config.json restauré depuis CONFIG_DATA.' : '📄 config.json créé (vide).');
} else {
    config = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
    if (fromEnv) {
        let merged = false;
        for (const key of Object.keys(fromEnv)) {
            if (config[key] === undefined || config[key] === null) {
                config[key] = fromEnv[key];
                merged = true;
            }
        }
        if (merged) {
            fs.writeFileSync(FILE, JSON.stringify(config, null, 4));
            console.log('🔀 config.json complété depuis CONFIG_DATA.');
        }
    }
}

config.guildId          ??= process.env.GUILD_ID ?? '';
config.ticketCounter    ??= 0;
config.ticketCategories ??= {};

// ─── Sync automatique vers Render API ────────────────────────────────────────

let syncTimeout = null;

function syncToRender(json) {
    const apiKey    = process.env.RENDER_API_KEY;
    const serviceId = process.env.RENDER_SERVICE_ID;
    if (!apiKey || !serviceId) return;

    const body = JSON.stringify([{ key: 'CONFIG_DATA', value: json }]);

    const req = https.request({
        hostname: 'api.render.com',
        path:     `/v1/services/${serviceId}/env-vars`,
        method:   'PUT',
        headers:  {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Length': Buffer.byteLength(body),
        },
    }, res => {
        if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('☁️  CONFIG_DATA synchronisé sur Render.');
        } else {
            console.error('⚠️  Render API: HTTP', res.statusCode);
        }
    });

    req.on('error', err => console.error('⚠️  Render sync erreur:', err.message));
    req.write(body);
    req.end();
}

// ─── Sauvegarde ───────────────────────────────────────────────────────────────

function saveConfig() {
    fs.writeFileSync(FILE, JSON.stringify(config, null, 4));
    // Debounce 2s pour éviter les appels en rafale
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => syncToRender(JSON.stringify(config)), 2000);
}

module.exports = { config, saveConfig };