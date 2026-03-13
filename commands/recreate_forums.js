const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { recreateForums } = require('../utils/forums');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recreate_forums')
        .setDescription('Recrée les salons texte en salons forums avec les tags configurés')
        .setDefaultMemberPermissions('8'),

    async execute(interaction) {
        const { config } = require('../utils/config');

        if (!config.textChannelsToConvert?.length)
            return interaction.reply({ content: '⚠️ Aucun salon configuré.', flags: MessageFlags.Ephemeral });

        await interaction.deferReply();
        const results = await recreateForums(interaction.guild);
        await interaction.editReply(`**Recréation terminée :**\n${results.join('\n')}`);
    },
};