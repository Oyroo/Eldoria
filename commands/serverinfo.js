const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Show server info using Components V2'),
    async execute(interaction) {
        const guild = interaction.guild;
        const embed = new EmbedBuilder()
            .setTitle('Server Info')
            .setColor(0x5865F2)
            .addFields(
                { name: 'Name', value: guild.name, inline: true },
                { name: 'ID', value: guild.id, inline: true },
                { name: 'Members', value: `${guild.memberCount}`, inline: true },
                { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false }
            );
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('serverinfo_refresh')
                    .setLabel('Refresh')
                    .setStyle(ButtonStyle.Primary)
            );
        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    },
};

module.exports.handleComponent = async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'serverinfo_refresh') {
        const guild = interaction.guild;
        const embed = new EmbedBuilder()
            .setTitle('Server Info')
            .setColor(0x5865F2)
            .addFields(
                { name: 'Name', value: guild.name, inline: true },
                { name: 'ID', value: guild.id, inline: true },
                { name: 'Members', value: `${guild.memberCount}`, inline: true },
                { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false }
            );
        await interaction.update({
            embeds: [embed],
            components: [interaction.message.components[0]],
        });
    }
};
