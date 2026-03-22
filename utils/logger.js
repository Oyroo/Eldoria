const { EmbedBuilder } = require('discord.js');
const { config }       = require('./config');

// ─── Catégories de logs ───────────────────────────────────────────────────────

const LOG_CATEGORIES = {
    messages: { label: 'Messages',  emoji: '✉️',  color: 0x3498db },
    membres:  { label: 'Membres',   emoji: '👥',  color: 0x2ecc71 },
    roles:    { label: 'Rôles',     emoji: '🎭',  color: 0x9b59b6 },
    salons:   { label: 'Salons',    emoji: '📁',  color: 0xe67e22 },
    vocal:    { label: 'Vocal',     emoji: '🔊',  color: 0x1abc9c },
    serveur:  { label: 'Serveur',   emoji: '🏰',  color: 0xf39c12 },
    bot:      { label: 'Bot',       emoji: '🤖',  color: 0x95a5a6 },
};

// ─── Résoudre le salon de destination ────────────────────────────────────────

async function resolveChannel(guild, category) {
    const logs = config.logs;
    if (!logs?.active) return null;

    let channelId = null;

    if (logs.mode === 'single') {
        channelId = logs.channelId;
    } else if (logs.mode === 'multi') {
        channelId = logs.channels?.[category];
    }

    if (!channelId) return null;

    try { return await guild.channels.fetch(channelId); }
    catch { return null; }
}

// ─── Envoi d'un log ───────────────────────────────────────────────────────────

async function log(guild, category, { title, description, fields = [], footer = null, thumbnail = null }) {
    const channel = await resolveChannel(guild, category);
    if (!channel) return;

    const cat = LOG_CATEGORIES[category] ?? { color: 0x95a5a6, emoji: '📋' };

    const embed = new EmbedBuilder()
        .setColor(cat.color)
        .setTitle(`${cat.emoji}  ${title}`)
        .setTimestamp();

    if (description) embed.setDescription(description);
    if (fields.length) embed.addFields(fields);
    if (footer)        embed.setFooter({ text: footer });
    if (thumbnail)     embed.setThumbnail(thumbnail);

    try { await channel.send({ embeds: [embed] }); }
    catch (err) { console.error(`[logger] erreur envoi log ${category}:`, err.message); }
}

module.exports = { log, LOG_CATEGORIES };