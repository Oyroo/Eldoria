const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { buildMainPanel } = require('../utils/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-config')
        .setDescription('Ouvre le panel de configuration des tickets')
        .setDefaultMemberPermissions('8'),

    async execute(interaction) {
        await interaction.reply({
            components: [buildMainPanel()],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
    },
};