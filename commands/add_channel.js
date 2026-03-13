const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { config, saveConfig } = require('../utils/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add_channel')
        .setDescription('Ajoute un salon à convertir en forum')
        .addStringOption(o =>
            o.setName('channel_id').setDescription("L'ID du salon texte à convertir").setRequired(true)
        )
        .setDefaultMemberPermissions('8'),

    async execute(interaction) {
        const channelId = interaction.options.getString('channel_id');

        if (config.textChannelsToConvert.includes(channelId))
            return interaction.reply({ content: '⚠️ Ce salon est déjà dans la liste.', flags: MessageFlags.Ephemeral });

        try {
            await interaction.guild.channels.fetch(channelId);
        } catch {
            return interaction.reply({ content: '❌ Salon introuvable.', flags: MessageFlags.Ephemeral });
        }

        config.textChannelsToConvert.push(channelId);
        saveConfig();

        await interaction.reply({
            content: `✅ Salon <#${channelId}> ajouté à la liste de conversion.`,
            flags: MessageFlags.Ephemeral,
        });
    },
};