const { SlashCommandBuilder }         = require('discord.js');
const { buildConfigRpMessage }        = require('../utils/configRpPanels');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config-rp')
        .setDescription('Ouvre le panel de configuration de roleplay [ADMIN ONLY]')
        .setDefaultMemberPermissions('8'),

    async execute(interaction) {
        await interaction.reply(buildConfigRpMessage('home', interaction.guild));
    },
};