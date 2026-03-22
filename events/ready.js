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
    },
};