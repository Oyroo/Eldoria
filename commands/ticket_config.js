const { SlashCommandBuilder } = require('discord.js');
const { buildMainPanel, panelToMessageOptions } = require('../utils/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-config')
        .setDescription('Ouvre le panel de configuration des tickets (utilise /config pour tout le bot)')
        .setDefaultMemberPermissions('8'),

    async execute(interaction) {
        const iconURL = interaction.guild?.iconURL({ size: 256, extension: 'png' }) ?? null;

        await interaction.reply({
            ephemeral: true,
            ...panelToMessageOptions(buildMainPanel(iconURL)),
        });
    },
};