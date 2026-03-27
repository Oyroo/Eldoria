const { Events }       = require('discord.js');
const { loadConfig }   = require('../utils/config');
const { load: loadTickets } = require('../utils/tickets');
const { startScheduler }    = require('../utils/meteo');

module.exports = {
    name: Events.ClientReady,
    once: true,

    async execute(client) {
        await loadConfig();
        loadTickets();
        startScheduler(client);

        console.log(`✅ ${client.user.tag} prêt.`);

        // 🎯 Liste de statuts
        const statuses = [
            { type: 0, getName: (guild) => `Bot du serveur 🪽﹒Eldoria !` },
            { type: 3, getName: (guild) => `${guild.memberCount} aventuriers.. Deviens l'un d'entre eux !` },
            { type: 3, getName: (guild) => `Lien du serveur en Bio !` }
        ];

        let i = 0;

        const updateStatus = () => {
            const guild = client.guilds.cache.first();
            if (!guild) return;

            const status = statuses[i];

            client.user.setPresence({
                activities: [{
                    name: status.getName(guild),
                    type: status.type
                }],
                status: 'online'
            });

            i = (i + 1) % statuses.length;
        };

        updateStatus();
        setInterval(updateStatus, 5 * 60 * 1000);
    },
};