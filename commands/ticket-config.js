const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-config')
        .setDescription('Configure ticket system using Components V2'),
    async execute(interaction) {
        // Show config options with buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_setup')
                    .setLabel('Setup Ticket')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('ticket_settings')
                    .setLabel('Settings')
                    .setStyle(ButtonStyle.Secondary)
            );
        await interaction.reply({
            content: 'Ticket system configuration:',
            components: [row],
            ephemeral: true
        });
    },
};

// Interaction handler for buttons and modals
module.exports.handleComponent = async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'ticket_setup') {
            // Show modal for setup
            const modal = new ModalBuilder()
                .setCustomId('ticket_setup_modal')
                .setTitle('Ticket Setup')
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('ticket_channel')
                            .setLabel('Ticket Channel ID')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('ticket_category')
                            .setLabel('Ticket Category ID')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                    )
                );
            await interaction.showModal(modal);
        } else if (interaction.customId === 'ticket_settings') {
            await interaction.reply({ content: 'Settings coming soon!', ephemeral: true });
        }
    } else if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'ticket_setup_modal') {
        const channelId = interaction.fields.getTextInputValue('ticket_channel');
        const categoryId = interaction.fields.getTextInputValue('ticket_category');
        // Save config logic here
        await interaction.reply({ content: `Ticket setup saved!\nChannel: ${channelId}\nCategory: ${categoryId || 'None'}`, ephemeral: true });
    }
};
