const { Events }       = require('discord.js');
const { loadConfig }   = require('../utils/config');
const { load: loadTickets } = require('../utils/tickets');
const { startScheduler }    = require('../utils/meteo');
const { initInviteCache }   = require('../utils/inviteTracker');

module.exports = {
    name: Events.ClientReady,
    once: true,

    async execute(client) {
        await loadConfig();
        loadTickets();
        startScheduler(client);
        // Init cache invitations pour toutes les guilds
        for (const guild of client.guilds.cache.values()) {
            await initInviteCache(guild);
        }
        // Cache invitations
        try {
            const { refreshCache } = require('./inviteTracker');
            const guild = client.guilds.cache.get(process.env.GUILD_ID);
            if (guild) await refreshCache(guild);
            console.log('🔗 Cache invitations initialisé.');
        } catch (err) {
            console.error('Cache invitations:', err.message);
        }

        console.log(`✅ ${client.user.tag} prêt.`);
    },
};