const { Events, ChannelType } = require('discord.js');
const { log } = require('../../utils/logger');

function typeName(type) {
    return {
        [ChannelType.GuildText]:     'Texte',
        [ChannelType.GuildVoice]:    'Vocal',
        [ChannelType.GuildCategory]: 'Catégorie',
        [ChannelType.GuildForum]:    'Forum',
        [ChannelType.GuildAnnouncement]: 'Annonces',
    }[type] ?? 'Inconnu';
}

module.exports = [
    {
        name: Events.ChannelCreate,
        async execute(channel) {
            if (!channel.guild) return;
            await log(channel.guild, 'salons', {
                title: '📁  Salon créé',
                fields: [
                    { name: 'Nom',        value: channel.name, inline: true },
                    { name: 'Type',       value: typeName(channel.type), inline: true },
                    { name: 'Catégorie',  value: channel.parent?.name ?? '—', inline: true },
                ],
                footer: `ID : ${channel.id}`,
            });
        },
    },
    {
        name: Events.ChannelDelete,
        async execute(channel) {
            if (!channel.guild) return;
            await log(channel.guild, 'salons', {
                title: '🗑️  Salon supprimé',
                fields: [
                    { name: 'Nom',       value: channel.name, inline: true },
                    { name: 'Type',      value: typeName(channel.type), inline: true },
                    { name: 'Catégorie', value: channel.parent?.name ?? '—', inline: true },
                ],
                footer: `ID : ${channel.id}`,
            });
        },
    },
];