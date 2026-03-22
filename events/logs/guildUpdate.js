const { Events } = require('discord.js');
const { log }    = require('../../utils/logger');

module.exports = {
    name: Events.GuildUpdate,
    async execute(oldGuild, newGuild) {
        const fields = [];

        if (oldGuild.name !== newGuild.name)
            fields.push({ name: 'Nom', value: `${oldGuild.name} → ${newGuild.name}` });

        if (oldGuild.icon !== newGuild.icon)
            fields.push({ name: 'Icône', value: 'L\'icône du serveur a été modifiée.' });

        if (oldGuild.premiumSubscriptionCount !== newGuild.premiumSubscriptionCount)
            fields.push({
                name:  'Boosts',
                value: `${oldGuild.premiumSubscriptionCount} → ${newGuild.premiumSubscriptionCount}`,
                inline: true,
            });

        if (!fields.length) return;

        await log(newGuild, 'serveur', {
            title:     '🏰  Serveur modifié',
            fields,
            thumbnail: newGuild.iconURL({ size: 64 }) ?? null,
        });
    },
};