const { Events } = require('discord.js');
const { log }    = require('../../utils/logger');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMsg, newMsg) {
        if (!newMsg.guild || newMsg.author?.bot) return;
        if (oldMsg.content === newMsg.content) return;

        await log(newMsg.guild, 'messages', {
            title: 'Message modifié',
            fields: [
                { name: 'Auteur', value: `<@${newMsg.author.id}>`, inline: true },
                { name: 'Salon',  value: `<#${newMsg.channelId}>`, inline: true },
                { name: 'Lien',   value: `[Voir le message](${newMsg.url})`, inline: true },
                { name: 'Avant',  value: oldMsg.content ? `> ${oldMsg.content.slice(0, 500)}` : '*Inconnu*' },
                { name: 'Après',  value: `> ${newMsg.content.slice(0, 500)}` },
            ],
            thumbnail: newMsg.author.displayAvatarURL({ size: 64 }),
        });
    },
};