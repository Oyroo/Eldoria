const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { config, saveConfig }               = require('./config');
const { LOG_CATEGORIES }                   = require('./logger');

const CHANNEL_NAMES = {
    messages: '📨・messages',
    membres:  '👥・membres',
    roles:    '🎭・rôles',
    salons:   '📁・salons',
    vocal:    '🔊・vocal',
    serveur:  '🏰・serveur',
    bot:      '🤖・bot',
};

async function autoSetupLogs(guild) {
    // Créer la catégorie admin-only
    const everyone = guild.roles.everyone;

    const category = await guild.channels.create({
        name: '📋 LOGS',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
            { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        ],
    });

    const channels = {};

    for (const [key, name] of Object.entries(CHANNEL_NAMES)) {
        const ch = await guild.channels.create({
            name,
            type:   ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
                { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            ],
        });
        channels[key] = ch.id;
    }

    if (!config.logs) config.logs = {};
    config.logs.active   = true;
    config.logs.mode     = 'multi';
    config.logs.channels = channels;
    saveConfig();

    return { categoryId: category.id, channels };
}

module.exports = { autoSetupLogs, CHANNEL_NAMES };