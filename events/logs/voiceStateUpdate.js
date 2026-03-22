const { Events } = require('discord.js');
const { log }    = require('../../utils/logger');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const member = newState.member ?? oldState.member;
        if (!member || member.user.bot) return;
        const guild = newState.guild;

        // Connexion
        if (!oldState.channelId && newState.channelId) {
            return log(guild, 'vocal', {
                title: '🔊  Connexion vocale',
                fields: [
                    { name: 'Membre', value: `<@${member.id}>`, inline: true },
                    { name: 'Salon',  value: `<#${newState.channelId}>`, inline: true },
                ],
                thumbnail: member.user.displayAvatarURL({ size: 64 }),
            });
        }

        // Déconnexion
        if (oldState.channelId && !newState.channelId) {
            return log(guild, 'vocal', {
                title: '🔇  Déconnexion vocale',
                fields: [
                    { name: 'Membre', value: `<@${member.id}>`, inline: true },
                    { name: 'Salon',  value: `<#${oldState.channelId}>`, inline: true },
                ],
                thumbnail: member.user.displayAvatarURL({ size: 64 }),
            });
        }

        // Changement de salon
        if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            return log(guild, 'vocal', {
                title: '🔀  Changement de salon vocal',
                fields: [
                    { name: 'Membre', value: `<@${member.id}>`, inline: true },
                    { name: 'Avant',  value: `<#${oldState.channelId}>`, inline: true },
                    { name: 'Après',  value: `<#${newState.channelId}>`, inline: true },
                ],
                thumbnail: member.user.displayAvatarURL({ size: 64 }),
            });
        }
    },
};