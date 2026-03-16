const { SlashCommandBuilder } = require('discord.js');
const Flags           = require('../utils/flags');
const { mainPanel }   = require('../utils/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-config')
        .setDescription('Ouvre le panel de configuration des tickets')
        .setDefaultMemberPermissions('8'),

    async execute(interaction) {
        const icon = interaction.guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
        await interaction.reply({
            components: mainPanel(icon),
            flags: Flags.CV2_Ephemeral,
        });
    },
};