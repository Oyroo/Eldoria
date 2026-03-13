const { ChannelType } = require('discord.js');
const { config } = require('./config');

const forumTags = [
    { name: 'Social',          emoji: '💬', moderated: false },
    { name: 'Exploration',     emoji: '🧭', moderated: false },
    { name: 'Combat',          emoji: '⚔️', moderated: false },
    { name: 'Event',           emoji: '🎉', moderated: true  },
    { name: 'Ouvert',          emoji: '🌍', moderated: false },
    { name: 'Sur Invitation',  emoji: '📜', moderated: false },
    { name: 'Privé',           emoji: '🔒', moderated: false },
    { name: 'En Cours',        emoji: '🟢', moderated: false },
    { name: 'Pause',           emoji: '⏸️', moderated: false },
    { name: 'Terminé',         emoji: '✅', moderated: false },
];

async function recreateForums(guild) {
    const results = [];

    for (const channelId of config.textChannelsToConvert) {
        try {
            const channel = await guild.channels.fetch(channelId);
            if (!channel) {
                results.push(`⚠️ Salon \`${channelId}\` introuvable.`);
                continue;
            }

            const { name, topic, parentId } = channel;
            const perms = channel.permissionOverwrites.cache.map(p => ({
                id: p.id, allow: p.allow.bitfield, deny: p.deny.bitfield,
            }));

            await channel.delete();

            const forum = await guild.channels.create({
                name,
                type: ChannelType.GuildForum,
                topic: topic || null,
                permissionOverwrites: perms,
                parent: parentId || null,
                defaultThreadAppliedTagsRequired: true,
            });

            await forum.setAvailableTags(
                forumTags.map(t => ({ name: t.name, emoji: { id: null, name: t.emoji }, moderated: t.moderated }))
            );

            results.push(`✅ \`${name}\` → forum recréé`);
        } catch (err) {
            results.push(`❌ Erreur sur \`${channelId}\` : ${err.message}`);
        }
    }

    return results;
}

module.exports = { forumTags, recreateForums };