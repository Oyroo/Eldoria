const { SlashCommandBuilder, ChannelType, MessageFlags } = require('discord.js');
const { config } = require('../utils/config');
const { buildTicketEmbed, buildTicketPanelRow } = require('../utils/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-panel')
        .setDescription('Envoie un panel de tickets dans un salon')
        .setDefaultMemberPermissions('8')
        .addStringOption(o =>
            o.setName('categorie')
                .setDescription('Catégorie de tickets à envoyer')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addChannelOption(o =>
            o.setName('salon')
                .setDescription('Salon où envoyer le panel')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ),

    async autocomplete(interaction) {
        const focused  = interaction.options.getFocused().toLowerCase();
        const choices  = Object.entries(config.ticketCategories)
            .filter(([key, cat]) => key.includes(focused) || cat.label.toLowerCase().includes(focused))
            .slice(0, 25)
            .map(([key, cat]) => ({ name: cat.label, value: key }));
        await interaction.respond(choices);
    },

    async execute(interaction) {
        const catKey  = interaction.options.getString('categorie');
        const channel = interaction.options.getChannel('salon');

        if (!config.ticketCategories[catKey])
            return interaction.reply({
                content: `❌ Catégorie \`${catKey}\` introuvable.`,
                flags: MessageFlags.Ephemeral,
            });

        await channel.send({
            embeds:     [buildTicketEmbed(catKey)],
            components: [buildTicketPanelRow(catKey)],
        });

        await interaction.reply({
            content: `✅ Panel **${config.ticketCategories[catKey].label}** envoyé dans <#${channel.id}>.`,
            flags: MessageFlags.Ephemeral,
        });
    },
};