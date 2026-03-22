const { Events } = require('discord.js');
const { log }    = require('../../utils/logger');

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember) {
        if (!newMember.guild) return;

        // ── Pseudo modifié ────────────────────────────────────────────────────
        if (oldMember.nickname !== newMember.nickname) {
            await log(newMember.guild, 'roles', {
                title: '📝  Pseudo modifié',
                fields: [
                    { name: 'Membre', value: `<@${newMember.id}>`, inline: true },
                    { name: 'Avant',  value: oldMember.nickname ?? '*Aucun*', inline: true },
                    { name: 'Après',  value: newMember.nickname ?? '*Aucun*', inline: true },
                ],
                thumbnail: newMember.user.displayAvatarURL({ size: 64 }),
            });
        }

        // ── Rôles modifiés ────────────────────────────────────────────────────
        const added   = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
        const removed = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

        if (added.size > 0) {
            await log(newMember.guild, 'roles', {
                title: '➕  Rôle ajouté',
                fields: [
                    { name: 'Membre', value: `<@${newMember.id}>`, inline: true },
                    { name: 'Rôle',   value: added.map(r => `<@&${r.id}>`).join(', '), inline: true },
                ],
                thumbnail: newMember.user.displayAvatarURL({ size: 64 }),
            });
        }

        if (removed.size > 0) {
            await log(newMember.guild, 'roles', {
                title: '➖  Rôle retiré',
                fields: [
                    { name: 'Membre', value: `<@${newMember.id}>`, inline: true },
                    { name: 'Rôle',   value: removed.map(r => `<@&${r.id}>`).join(', '), inline: true },
                ],
                thumbnail: newMember.user.displayAvatarURL({ size: 64 }),
            });
        }
    },
};