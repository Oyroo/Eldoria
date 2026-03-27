const { config, saveConfig } = require('./config');

// Cache local des invitations { code: { uses, partnerId } }
let inviteCache = new Map();

// ─── Initialisation du cache ──────────────────────────────────────────────────

async function initInviteCache(guild) {
    try {
        const invites = await guild.invites.fetch();
        inviteCache = new Map(invites.map(inv => [inv.code, inv.uses]));
        console.log(`🔗 ${inviteCache.size} invitation(s) mises en cache.`);
    } catch (err) {
        console.error('❌ initInviteCache:', err.message);
    }
}

// ─── Détecter quelle invitation a été utilisée ────────────────────────────────

async function detectUsedInvite(guild) {
    try {
        const newInvites = await guild.invites.fetch();

        for (const [code, newUses] of newInvites.map(i => [i.code, i.uses])) {
            const oldUses = inviteCache.get(code) ?? 0;
            if (newUses > oldUses) {
                // Mettre à jour le cache
                inviteCache.set(code, newUses);
                return code;
            }
        }

        // Mettre à jour le cache complet
        inviteCache = new Map(newInvites.map(inv => [inv.code, inv.uses]));
        return null;
    } catch (err) {
        console.error('❌ detectUsedInvite:', err.message);
        return null;
    }
}

// ─── Partenaires ──────────────────────────────────────────────────────────────

function getPartners() {
    return config.invitePartners ?? {};
}

function getPartnerByCode(code) {
    const partners = getPartners();
    return Object.values(partners).find(p => p.code === code) ?? null;
}

function addPartner(id, data) {
    if (!config.invitePartners) config.invitePartners = {};
    config.invitePartners[id] = data;
    // Ajouter au cache
    inviteCache.set(data.code, data.uses ?? 0);
    saveConfig();
}

// ─── IDs spéciaux ─────────────────────────────────────────────────────────────

const DISBOARD_BOT_ID = '302050872383242240';

function isDisboard(member) {
    // Disboard invite = le bot Disboard est dans le serveur et invite via son système
    // On détecte via l'invitation vanity ou le code stocké
    const disboardCode = config.inviteTracker?.disboardCode;
    return disboardCode ? false : false; // sera comparé dans guildMemberAdd
}

module.exports = {
    initInviteCache,
    detectUsedInvite,
    getPartners,
    getPartnerByCode,
    addPartner,
    DISBOARD_BOT_ID,
    get cache() { return inviteCache; },
};