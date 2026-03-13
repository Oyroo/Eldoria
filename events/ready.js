const { Events }      = require('discord.js');
const { loadTickets } = require('../utils/tickets');

module.exports = {
    name: Events.ClientReady,
    once: true,

    execute(client) {
        loadTickets();
        console.log(`✅ Connecté en tant que ${client.user.tag}`);
    },
};