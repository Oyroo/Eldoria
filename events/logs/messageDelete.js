const { Events, AuditLogEvent } = require('discord.js');
const { log } = require('../../utils/logger');

module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        if (!message.guild || message.author?.bot) return;
        await log(message.guild, 'messages', {
            title:       'Message supprimé',
            description: message.content ? `> ${message.content.slice(0, 1000)}` : '*Contenu inconnu*',
            fields: [
                { name: 'Auteur',  value: `<@${message.author?.id}> (${message.author?.tag ?? '—'})`, inline: true },
                { name: 'Salon',   value: `<#${message.channelId}>`, inline: true },
            ],
            thumbnail: message.author?.displayAvatarURL({ size: 64 }) ?? null,
            footer: `ID message : ${message.id}`,
        });
    },
};