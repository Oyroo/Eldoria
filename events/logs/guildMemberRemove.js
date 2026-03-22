const { Events, AuditLogEvent } = require('discord.js');
const { log } = require('../../utils/logger');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        // Vérifier si c'est un kick ou un ban via l'audit log
        await new Promise(r => setTimeout(r, 1000));

        let type = 'Départ', executor = null;

        try {
            const audit = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick });
            const entry = audit.entries.first();
            if (entry && entry.target?.id === member.id && Date.now() - entry.createdTimestamp < 5000) {
                type     = 'Kick';
                executor = entry.executor;
            }
        } catch {}

        await log(member.guild, 'membres', {
            title:       `${type === 'Kick' ? '👢' : '👋'}  ${type} — ${member.user.tag}`,
            description: `<@${member.id}> a quitté le serveur.`,
            fields: [
                { name: 'Compte créé le', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`, inline: true },
                { name: 'A rejoint le',   value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : '—', inline: true },
                ...(executor ? [{ name: 'Expulsé par', value: `<@${executor.id}>`, inline: true }] : []),
            ],
            thumbnail: member.user.displayAvatarURL({ size: 64 }),
            footer: `ID : ${member.id}`,
        });
    },
};