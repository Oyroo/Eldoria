const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot latency using Components V2'),
    async execute(interaction) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ping_refresh')
                    .setLabel('Refresh')
                    .setStyle(ButtonStyle.Primary)
            );
        await interaction.reply({
            content: `🏓 Pong! Latency: ${interaction.client.ws.ping}ms`,
            components: [row],
            ephemeral: true
        });
    },
};

module.exports.handleComponent = async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'ping_refresh') {
        await interaction.update({
            content: `🏓 Pong! Latency: ${interaction.client.ws.ping}ms`,
            components: [interaction.message.components[0]],
        });
    }
};
