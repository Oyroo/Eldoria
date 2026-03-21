const { Events } = require('discord.js');
const Flags      = require('../utils/flags');

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

            if (interaction.isStringSelectMenu()) {
                if (interaction.customId === 'config_rp_select') {
                    const { handleSelectRp } = require('../interactions/selects_rp');
                    await handleSelectRp(interaction);
                    return;
                }
                const { handleSelect } = require('../interactions/selects');
                await handleSelect(interaction);
                return;
            }

            if (interaction.isButton()) {
                // Retour accueil config
                if (interaction.customId === 'config_home') {
                    const { buildConfigMessage } = require('../utils/configPanels');
                    return interaction.update(buildConfigMessage('home', interaction.guild));
                }

                if (interaction.customId === 'config_rp_home') {
                    const { buildConfigRpMessage } = require('../utils/configRpPanels');
                    return interaction.update(buildConfigRpMessage('home', interaction.guild));
                }

                // Ouvre le panel ticket-config depuis /config
                if (interaction.customId === 'config_tickets_open') {
                    const { mainPanel } = require('../utils/builders');
                    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                    const icon = interaction.guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
                    const homeBtn = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('config_home').setLabel('Accueil').setEmoji('🏡').setStyle(ButtonStyle.Secondary)
                    );
                    return interaction.update({ components: mainPanel(icon), flags: Flags.CV2 });
                }

                if (interaction.customId === 'cfg_back_to_config') {
                    const { buildConfigMessage } = require('../utils/configPanels');
                    return interaction.update(buildConfigMessage('tickets', interaction.guild));
                }

                if (interaction.customId.startsWith('meteo_')) {
                    const { handleButtonRp } = require('../interactions/buttons_rp');
                    await handleButtonRp(interaction);
                    return;
                }
                const { handleButton } = require('../interactions/buttons');
                await handleButton(interaction);
                return;
            }

            if (interaction.isModalSubmit()) {
                if (interaction.customId.startsWith('meteo_')) {
                    const { handleModalRp } = require('../interactions/buttons_rp');
                    await handleModalRp(interaction);
                    return;
                }
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