const { Events, MessageFlags } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        try {

            // ── Autocomplete ──────────────────────────────────────────────────
            if (interaction.isAutocomplete()) {
                const command = interaction.client.commands.get(interaction.commandName);
                if (command?.autocomplete) await command.autocomplete(interaction);
                return;
            }

            // ── Slash commands ────────────────────────────────────────────────
            if (interaction.isChatInputCommand()) {
                const command = interaction.client.commands.get(interaction.commandName);
                if (!command) return;
                await command.execute(interaction);
                return;
            }

            // ── Boutons ───────────────────────────────────────────────────────
            if (interaction.isButton()) {
                const { handleButton } = require('../interactions/buttons');
                await handleButton(interaction);
                return;
            }

            // ── Modals ────────────────────────────────────────────────────────
            if (interaction.isModalSubmit()) {
                const { handleModal } = require('../interactions/modals');
                await handleModal(interaction);
                return;
            }

        } catch (err) {
            console.error(`Erreur interaction [${interaction.customId ?? interaction.commandName}] :`, err);

            const payload = {
                content: `❌ Une erreur est survenue : \`${err.message}\``,
                flags:   MessageFlags.Ephemeral,
            };
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(payload);
                } else {
                    await interaction.reply(payload);
                }
            } catch {}
        }
    },
};