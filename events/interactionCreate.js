const { Events, MessageFlags } = require('discord.js');
const Flags = require('../utils/flags');

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        try {
            if (interaction.isAutocomplete()) {
                const cmd = interaction.client.commands.get(interaction.commandName);
                if (cmd?.autocomplete) await cmd.autocomplete(interaction);
                return;
            }

            if (interaction.isChatInputCommand()) {
                const cmd = interaction.client.commands.get(interaction.commandName);
                if (cmd) await cmd.execute(interaction);
                return;
            }

            if (interaction.isButton()) {
                const { handleButton } = require('../interactions/buttons');
                await handleButton(interaction);
                return;
            }

            if (interaction.isModalSubmit()) {
                const { handleModal } = require('../interactions/modals');
                await handleModal(interaction);
                return;
            }

        } catch (err) {
            console.error(`[${interaction.customId ?? interaction.commandName}]`, err.message);
            const msg = { content: `❌ ${err.message}`, flags: Flags.Ephemeral };
            try {
                if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
                else await interaction.reply(msg);
            } catch {}
        }
    },
};