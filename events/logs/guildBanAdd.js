const { Events, AuditLogEvent } = require('discord.js');
const { log } = require('../../utils/logger');

module.exports = {
    name: Events.GuildBanAdd,
    async execute(ban) {
        let reason = ban.reason ?? '*Aucune raison*';
        let executor = null;

        try {
            const audit = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd });
            const entry = audit.entries.first();
            if (entry?.target?.id === ban.user.id) {
                executor = entry.executor;
                reason   = entry.reason ?? reason;
            }
        } catch {}

        await log(ban.guild, 'membres', {
            title:       `🔨  Ban — ${ban.user.tag}`,
            description: `<@${ban.user.id}> a été banni.`,
            fields: [
                { name: 'Raison',   value: reason, inline: true },
                ...(executor ? [{ name: 'Banni par', value: `<@${executor.id}>`, inline: true }] : []),
            ],
            thumbnail: ban.user.displayAvatarURL({ size: 64 }),
            footer: `ID : ${ban.user.id}`,
        });
    },
};