const { EmbedBuilder, ChannelType } = require('discord.js');
const { config, saveConfig }        = require('./config');

// ─── Résoudre ou créer un fil forum pour un partenaire ────────────────────────

async function resolveThread(guild, partnerId, partnerName, partnerEmoji = '🔗') {
    const forumId = config.inviteTracker?.forumChannelId;
    if (!forumId) return null;

    let forum;
    try { forum = await guild.channels.fetch(forumId); }
    catch { return null; }

    if (forum.type !== ChannelType.GuildForum) return null;

    // Chercher le fil existant
    const stored = config.inviteTracker?.threads?.[partnerId];
    if (stored) {
        try {
            const thread = await forum.threads.fetch(stored);
            if (thread) return thread;
        } catch {}
    }

    // Créer le fil
    const thread = await forum.threads.create({
        name:    `${partnerEmoji} ${partnerName}`,
        message: { content: `📌 Fil de logs pour **${partnerName}**` },
    });

    if (!config.inviteTracker) config.inviteTracker = {};
    if (!config.inviteTracker.threads) config.inviteTracker.threads = {};
    config.inviteTracker.threads[partnerId] = thread.id;
    saveConfig();

    return thread;
}

// ─── Log d'un join dans le bon fil ───────────────────────────────────────────

async function logJoin(guild, member, source) {
    // source = { type: 'partner'|'disboard'|'aowyn'|'unknown', partnerId?, partnerName?, code? }
    let thread = null;
    let color  = 0x2ecc71;
    let title  = '';

    if (source.type === 'partner') {
        thread = await resolveThread(guild, source.partnerId, source.partnerName, '🤝');
        title  = `👋 Nouveau membre via ${source.partnerName}`;
        color  = 0x3498db;
    } else if (source.type === 'disboard') {
        thread = await resolveThread(guild, '__disboard__', 'Disboard', '📋');
        title  = '👋 Nouveau membre via Disboard';
        color  = 0x5865f2;
    } else if (source.type === 'aowyn') {
        thread = await resolveThread(guild, '__aowyn__', 'Aowyn', '🌐');
        title  = '👋 Nouveau membre via Aowyn';
        color  = 0xd4a853;
    } else {
        thread = await resolveThread(guild, '__unknown__', 'Source inconnue', '❓');
        title  = '👋 Nouveau membre (source inconnue)';
        color  = 0x95a5a6;
    }

    if (!thread) return;

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setThumbnail(member.user.displayAvatarURL({ size: 64 }))
        .addFields(
            { name: 'Membre',       value: `<@${member.id}> (${member.user.tag})`, inline: true },
            { name: 'Compte créé',  value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
            ...(source.code ? [{ name: 'Invitation', value: `\`${source.code}\``, inline: true }] : []),
        )
        .setTimestamp();

    await thread.send({ embeds: [embed] });
}

module.exports = { logJoin, resolveThread };