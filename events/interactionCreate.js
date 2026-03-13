const { Events } = require('discord.js');
const { handleButton } = require('../interactions/buttons');
const { handleModal }  = require('../interactions/modals');

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
                await handleButton(interaction);
                return;
            }

            // ── Modals ────────────────────────────────────────────────────────
            if (interaction.isModalSubmit()) {
                await handleModal(interaction);
                return;
            }

        } catch (err) {
            console.error(`Erreur interaction [${interaction.customId ?? interaction.commandName}] :`, err);

            const payload = { content: `❌ Une erreur est survenue : \`${err.message}\``, flags: 64 };
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