const { Events }         = require('discord.js');
const { recordAction }   = require('../utils/bumpReminder');

const DISBOARD_BOT_ID = '302050872383242240';

module.exports = {
    name: Events.MessageCreate,

    async execute(msg) {
        if (!msg.guild) return;
        if (msg.author.id !== DISBOARD_BOT_ID) return;

        // Disboard envoie un embed de confirmation après /bump
        const embed = msg.embeds?.[0];
        if (!embed) return;

        const desc = embed.description ?? '';
        if (desc.includes('Bump done') || desc.includes('bumped') || desc.toLowerCase().includes('bump')) {
            recordAction(msg.client, 'bump');
            console.log('📣 Bump Disboard détecté — reminder planifié dans 2h.');
        }
    },
};