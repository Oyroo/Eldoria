const { SlashCommandBuilder }         = require('discord.js');
const { buildConfigRpMessage }        = require('../utils/configRpPanels');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config-rp')
        .setDescription('Ouvre le panel de configuration du roleplay')
        .setDefaultMemberPermissions('8'),

    async execute(interaction) {
        await interaction.reply(buildConfigRpMessage('home', interaction.guild));
    },
};