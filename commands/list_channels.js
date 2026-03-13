const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list_channels')
        .setDescription('Liste les salons configurés pour la conversion'),

    async execute(interaction) {
        const { config } = require('../utils/config');

        if (!config.textChannelsToConvert?.length)
            return interaction.reply({ content: 'Aucun salon configuré.', flags: MessageFlags.Ephemeral });

        const list = config.textChannelsToConvert
            .map(id => `• <#${id}> (\`${id}\`)`)
            .join('\n');

        await interaction.reply({
            content: `**Salons configurés :**\n${list}`,
            flags: MessageFlags.Ephemeral,
        });
    },
};