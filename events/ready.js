const { Events, ActivityType } = require('discord.js');
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

        // ── STATUS DYNAMIQUE ───────────────────────────────────────────────

        const guild = client.guilds.cache.get(process.env.GUILD_ID);

        const statuses = [
            { type: ActivityType.Playing, getName: () => `Bot du serveur 🪽﹒Eldoria.` },
            { type: ActivityType.Watching, getName: () => `${guild?.memberCount ?? 0} aventuriers... Rejoins les !` },
            { type: ActivityType.Watching, getName: () => `Lien vers le serveur en Bio !` }
        ];

        let i = 0;

        setInterval(() => {
            const status = statuses[i];

            client.user.setActivity(status.getName(), {
                type: status.type,
            });

            i = (i + 1) % statuses.length;
        }, 30 * 1000); // toutes les 30 secondes
    },
};