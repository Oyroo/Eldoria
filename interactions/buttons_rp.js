const {
    ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle,
    MessageFlags,
} = require('discord.js');

const Flags                      = require('../utils/flags');
const { config, saveConfig }     = require('../utils/config');
const { pending }                = require('../utils/pending');
const { METEOS, buildMeteoEmbed, choisirProchaineMeteo } = require('../utils/meteo');
const { buildConfigRpMessage }   = require('../utils/configRpPanels');

async function handleButtonRp(interaction) {
    const id = interaction.customId;

    // ── Activer / Désactiver ──────────────────────────────────────────────────
    if (id === 'meteo_toggle') {
        if (!config.meteo) config.meteo = {};
        config.meteo.active = !config.meteo.active;
        saveConfig();
        return interaction.update(buildConfigRpMessage('meteo', interaction.guild));
    }

    // ── Définir le salon → saisie par message ─────────────────────────────────
    if (id === 'meteo_setchannel') {
        pending[interaction.user.id] = {
            type:    'meteo_channel',
            token:   interaction.token,
            appId:   interaction.client.application.id,
            guildId: interaction.guildId,
        };

        const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const c = new ContainerBuilder().setAccentColor(0x5865f2)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `# 📢  Salon de publication\n-# Météo · En attente de ta réponse…`
            ))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `Envoie le **#salon** ou son **ID** dans ce salon.\n\n` +
                `-# Exemple : \`#météo\` ou l'ID numérique.\n` +
                `-# Tape \`annuler\` pour annuler.`
            ));
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('meteo_cancel').setLabel('Annuler').setEmoji('✖️').setStyle(ButtonStyle.Secondary)
        );
        return interaction.update({ components: [c, row], flags: Flags.CV2 });
    }

    // ── Définir l'heure → modal ───────────────────────────────────────────────
    if (id === 'meteo_setheure') {
        const current = config.meteo?.heure ?? '08:00';
        const modal   = new ModalBuilder().setCustomId('meteo_modal_heure').setTitle('Heure d\'envoi de la météo');
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('heure')
                    .setLabel('Heure (format HH:MM, ex: 08:00)')
                    .setStyle(TextInputStyle.Short)
                    .setValue(current)
                    .setPlaceholder('08:00')
                    .setRequired(true)
            )
        );
        return interaction.showModal(modal);
    }

    // ── Annuler saisie ────────────────────────────────────────────────────────
    if (id === 'meteo_cancel') {
        delete pending[interaction.user.id];
        return interaction.update(buildConfigRpMessage('meteo', interaction.guild));
    }

    // ── Aperçu du rendu ───────────────────────────────────────────────────────
    if (id === 'meteo_preview') {
        const meteoKey = config.meteo?.meteoActuelle ?? choisirProchaineMeteo(null);
        const icon     = interaction.guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
        const embed    = buildMeteoEmbed(meteoKey, icon);

        return interaction.reply({
            content:    `-# Aperçu du bulletin météo — **${METEOS[meteoKey].label}**`,
            components: [embed],
            flags:      Flags.CV2 | MessageFlags.Ephemeral,
        });
    }

    // ── Envoyer maintenant ────────────────────────────────────────────────────
    if (id === 'meteo_force') {
        const channelId = config.meteo?.channelId;
        if (!channelId)
            return interaction.reply({ content: '❌ Aucun salon de publication configuré.', flags: Flags.Ephemeral });

        await interaction.deferReply({ flags: Flags.Ephemeral });

        try {
            const channel  = await interaction.guild.channels.fetch(channelId);
            const icon     = interaction.guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
            const prochaine = choisirProchaineMeteo(config.meteo?.meteoActuelle ?? null);

            if (!config.meteo) config.meteo = {};
            config.meteo.meteoActuelle = prochaine;
            config.meteo.dernierEnvoi  = new Date().toISOString().split('T')[0];
            saveConfig();

            const embed = buildMeteoEmbed(prochaine, icon);
            await channel.send({ components: [embed], flags: Flags.CV2 });

            await interaction.editReply({
                content: `✅ Météo envoyée dans <#${channelId}> : **${METEOS[prochaine].emoji} ${METEOS[prochaine].label}**`,
            });
        } catch (err) {
            await interaction.editReply({ content: `❌ Erreur : \`${err.message}\`` });
        }
    }
}

// ─── Modal heure ──────────────────────────────────────────────────────────────

async function handleModalRp(interaction) {
    if (interaction.customId === 'meteo_modal_heure') {
        const heure = interaction.fields.getTextInputValue('heure').trim();

        // Validation format HH:MM
        if (!/^\d{2}:\d{2}$/.test(heure)) {
            return interaction.reply({
                content: '❌ Format invalide. Utilise le format `HH:MM` (ex: `08:00`).',
                flags: Flags.Ephemeral,
            });
        }
        const [h, m] = heure.split(':').map(Number);
        if (h > 23 || m > 59) {
            return interaction.reply({
                content: '❌ Heure invalide. Les heures vont de `00:00` à `23:59`.',
                flags: Flags.Ephemeral,
            });
        }

        if (!config.meteo) config.meteo = {};
        config.meteo.heure = heure;
        saveConfig();

        return interaction.update(buildConfigRpMessage('meteo', interaction.guild));
    }
}

module.exports = { handleButtonRp, handleModalRp };