const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { buildConfigHomePanel } = require('../utils/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Ouvre le panneau de configuration du bot.')
        .setDefaultMemberPermissions('8')
        .setDMPermission(false),

    async execute(interaction) {
        const iconURL = interaction.guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
        await interaction.reply({
            components: [buildConfigHomePanel(iconURL)],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
    },
};
