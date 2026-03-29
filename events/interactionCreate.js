const { Events } = require('discord.js');

const EPHEMERAL    = 64;
const { logCommand, logError } = require('../utils/botLogger');
const CV2          = 1 << 15;
const CV2_EPHEMERAL = CV2 | EPHEMERAL;

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        try {

            // ── Autocomplete ──────────────────────────────────────────────────
            if (interaction.isAutocomplete()) {
                const cmd = interaction.client.commands.get(interaction.commandName);
                if (cmd?.autocomplete) await cmd.autocomplete(interaction);
                return;
            }

            // ── Slash commands ────────────────────────────────────────────────
            if (interaction.isChatInputCommand()) {
                const cmd = interaction.client.commands.get(interaction.commandName);
                if (cmd) {
                    await cmd.execute(interaction);
                    logCommand(interaction.guild, interaction.user, interaction.commandName).catch(() => {});
                }
                return;
            }

            // ── Select menus ──────────────────────────────────────────────────
            if (interaction.isStringSelectMenu()) {
                if (interaction.customId === 'config_rp_select') {
                    await interaction.deferUpdate();
                    const { buildConfigRpMessage } = require('../utils/configRpPanels');
                    const msg = buildConfigRpMessage(interaction.values[0], interaction.guild);
                    return interaction.editReply({ components: msg.components });
                }
                if (interaction.customId === 'config_select') {
                    await interaction.deferUpdate();
                    const { buildConfigMessage } = require('../utils/configPanels');
                    const msg = buildConfigMessage(interaction.values[0], interaction.guild);
                    return interaction.editReply({ components: msg.components });
                }
                return;
            }

            // ── Boutons ───────────────────────────────────────────────────────
            if (interaction.isButton()) {

                // Navigation /config
                if (interaction.customId === 'config_home') {
                    await interaction.deferUpdate();
                    const { buildConfigMessage } = require('../utils/configPanels');
                    const msg = buildConfigMessage('home', interaction.guild);
                    return interaction.editReply({ components: msg.components });
                }

                // Navigation /config-rp
                if (interaction.customId === 'config_rp_home') {
                    await interaction.deferUpdate();
                    const { buildConfigRpMessage } = require('../utils/configRpPanels');
                    const msg = buildConfigRpMessage('home', interaction.guild);
                    return interaction.editReply({ components: msg.components });
                }

                // Ouvrir ticket-config depuis /config
                if (interaction.customId === 'config_tickets_open') {
                    await interaction.deferUpdate();
                    const { mainPanel } = require('../utils/builders');
                    const icon = interaction.guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
                    return interaction.editReply({ components: mainPanel(icon) });
                }

                // Retour vers /config tickets depuis ticket-config
                if (interaction.customId === 'cfg_back_to_config') {
                    await interaction.deferUpdate();
                    const { buildConfigMessage } = require('../utils/configPanels');
                    const msg = buildConfigMessage('tickets', interaction.guild);
                    return interaction.editReply({ components: msg.components });
                }

                // Météo
                if (interaction.customId.startsWith('meteo_')) {
                    const { handleButtonRp } = require('../interactions/buttons_rp');
                    await handleButtonRp(interaction);
                    return;
                }

                // Welcome
                if (interaction.customId.startsWith('welcome_')) {
                    const { handleButtonWelcome } = require('../interactions/buttons_welcome');
                    await handleButtonWelcome(interaction);
                    return;
                }

                // Bump reminders
                if (interaction.customId.startsWith('bump_')) {
                    const { handleButtonBump } = require('../interactions/buttons_bump');
                    await handleButtonBump(interaction);
                    return;
                }

                // Welcome editor (message général)
                if (interaction.customId.startsWith('wgen_')) {
                    const { handleButtonWelcomeEditor } = require('../interactions/buttons_welcome_editor');
                    await handleButtonWelcomeEditor(interaction);
                    return;
                }

                // Invite tracker
                if (interaction.customId.startsWith('inv_')) {
                    const { handleButtonInvites } = require('../interactions/buttons_invites');
                    await handleButtonInvites(interaction);
                    return;
                }

                // Logs
                if (interaction.customId.startsWith('logs_')) {
                    const { handleButtonLogs } = require('../interactions/buttons_logs');
                    await handleButtonLogs(interaction);
                    return;
                }

                // Tickets & config
                const { handleButton } = require('../interactions/buttons');
                await handleButton(interaction);
                return;
            }

            // ── Modals ────────────────────────────────────────────────────────
            if (interaction.isModalSubmit()) {
                if (interaction.customId.startsWith('meteo_')) {
                    const { handleModalRp } = require('../interactions/buttons_rp');
                    await handleModalRp(interaction);
                    return;
                }
                if (interaction.customId.startsWith('welcome_')) {
                    const { handleModalWelcome } = require('../interactions/buttons_welcome');
                    await handleModalWelcome(interaction);
                    return;
                }

                if (interaction.customId.startsWith('wgen_modal')) {
                    const { handleModalWelcomeEditor } = require('../interactions/buttons_welcome_editor');
                    await handleModalWelcomeEditor(interaction);
                    return;
                }

                if (interaction.customId.startsWith('inv_modal')) {
                    const { handleModalInvites } = require('../interactions/buttons_invites');
                    await handleModalInvites(interaction);
                    return;
                }
                const { handleModal } = require('../interactions/modals');
                await handleModal(interaction);
                return;
            }

        } catch (err) {
            console.error(`[${interaction.customId ?? interaction.commandName}]`, err.message);
            const IGNORE_CODES = [10062, 40060];
            if (interaction.guild && !IGNORE_CODES.includes(err.code)) logError(interaction.guild, interaction.customId ?? interaction.commandName, err).catch(() => {});
            const payload = { content: `❌ ${err.message}`, flags: EPHEMERAL };
            try {
                if (interaction.replied || interaction.deferred) await interaction.followUp(payload);
                else await interaction.reply(payload);
            } catch {}
        }
    },
};