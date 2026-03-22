const { SlashCommandBuilder }      = require('discord.js');
const { buildConfigMessage }       = require('../utils/configPanels');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Ouvre le panel de configuration du serveur [ADMIN ONLY]')
        .setDefaultMemberPermissions('8'),

    async execute(interaction) {
        await interaction.reply(buildConfigMessage('home', interaction.guild));
    },
};