const { Events }  = require('discord.js');
const { load }    = require('../utils/tickets');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        load();
        console.log(`✅ ${client.user.tag}`);
    },
};