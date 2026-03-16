const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error executing this command.', ephemeral: true });
            }
        }
        // Handle components (buttons, modals)
        else if (interaction.isButton() || interaction.type === 5) {
            const command = interaction.client.commands.get(interaction.message?.interaction?.commandName);
            if (command && command.handleComponent) {
                try {
                    await command.handleComponent(interaction);
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: 'There was an error handling the component.', ephemeral: true });
                }
            }
        }
        // Handle modal submit
        else if (interaction.type === 5) {
            const command = interaction.client.commands.get(interaction.customId.split('_')[0]);
            if (command && command.handleComponent) {
                try {
                    await command.handleComponent(interaction);
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: 'There was an error handling the modal.', ephemeral: true });
                }
            }
        }
    },
};
