const {
    ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');

const Flags                  = require('../utils/flags');
const { config, saveConfig } = require('../utils/config');
const { pending }            = require('../utils/pending');
const { buildConfigMessage } = require('../utils/configPanels');
const { generateWelcomeBanner } = require('../utils/welcomeImage');

async function handleButtonWelcome(interaction) {
    const id = interaction.customId;

    // ── Activer / Désactiver ──────────────────────────────────────────────────
    if (id === 'welcome_toggle') {
        await interaction.deferUpdate();
        if (!config.welcome) config.welcome = {};
        config.welcome.active = !config.welcome.active;
        saveConfig();
        const msg = buildConfigMessage('welcome', interaction.guild);
        return interaction.editReply({ components: msg.components });
    }

    // ── Salon → saisie par message ────────────────────────────────────────────
    if (id === 'welcome_setchannel') {
        pending[interaction.user.id] = {
            type: 'welcome_channel', token: interaction.token,
            appId: interaction.client.application.id, guildId: interaction.guildId,
        };
        const c = awaitContainer('📢', 'Salon de bienvenue',
            'Envoie le **#salon** ou son **ID** dans ce salon.',
            'Les messages de bienvenue y seront envoyés automatiquement.'
        );
        return interaction.update({ components: [c, cancelRow()], flags: Flags.CV2 });
    }

    // ── Rôle → saisie par message ─────────────────────────────────────────────
    if (id === 'welcome_setrole') {
        pending[interaction.user.id] = {
            type: 'welcome_role', token: interaction.token,
            appId: interaction.client.application.id, guildId: interaction.guildId,
        };
        const c = awaitContainer('🎭', 'Rôle automatique',
            'Envoie le **@rôle** ou son **ID**.',
            'Ce rôle sera attribué automatiquement à chaque nouveau membre.'
        );
        return interaction.update({ components: [c, cancelRow()], flags: Flags.CV2 });
    }

    // ── Message → modal ───────────────────────────────────────────────────────
    if (id === 'welcome_setmessage') {
        const modal = new ModalBuilder()
            .setCustomId('welcome_modal_message')
            .setTitle('Message de bienvenue');
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('message')
                    .setLabel('Message (tu peux utiliser {user} et {server})')
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(config.welcome?.message ?? '')
                    .setPlaceholder('Bienvenue sur {server}, {user} ! Prends le temps de lire les règles.')
                    .setRequired(false)
                    .setMaxLength(500)
            )
        );
        return interaction.showModal(modal);
    }

    // ── Annuler saisie ────────────────────────────────────────────────────────
    if (id === 'welcome_cancel') {
        await interaction.deferUpdate();
        delete pending[interaction.user.id];
        const msg = buildConfigMessage('welcome', interaction.guild);
        return interaction.editReply({ components: msg.components });
    }

    // ── Aperçu ────────────────────────────────────────────────────────────────
    if (id === 'welcome_preview') {
        await interaction.deferReply({ flags: Flags.Ephemeral });
        try {
            const bannerBuffer = await generateWelcomeBanner(interaction.member);
            const c = new ContainerBuilder()
                .setAccentColor(0xd4a853)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `# Bienvenue, <@${interaction.user.id}> ! 🎉\n` +
                    `-# Tu es le **${interaction.guild.memberCount}**ème membre à rejoindre ${interaction.guild.name}.`
                ));

            const msg = config.welcome?.message
                ?.replace('{user}', `<@${interaction.user.id}>`)
                ?.replace('{server}', interaction.guild.name);

            if (msg) {
                c.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1))
                 .addTextDisplayComponents(new TextDisplayBuilder().setContent(msg));
            }

            c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
             .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `-# Prends le temps de lire les règles et de te présenter avant de te lancer dans l'aventure.`
             ));

            await interaction.editReply({
                files:      [{ attachment: bannerBuffer, name: 'welcome.png' }],
                components: [c],
                flags:      Flags.CV2,
            });
        } catch (err) {
            await interaction.editReply({ content: `❌ Erreur : \`${err.message}\`` });
        }
    }
}

async function handleModalWelcome(interaction) {
    if (interaction.customId === 'welcome_modal_message') {
        await interaction.deferUpdate();
        const msg = interaction.fields.getTextInputValue('message').trim();
        if (!config.welcome) config.welcome = {};
        config.welcome.message = msg || null;
        saveConfig();
        const res = buildConfigMessage('welcome', interaction.guild);
        return interaction.editReply({ components: res.components });
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function awaitContainer(emoji, title, what, hint) {
    return new ContainerBuilder()
        .setAccentColor(0x5865f2)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# ${emoji}  ${title}\n-# En attente de ta réponse…`
        ))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${what}\n\n${hint}\n\n-# Tape \`annuler\` ou clique ci-dessous pour annuler.`
        ));
}

function cancelRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('welcome_cancel').setLabel('Annuler').setEmoji('✖️').setStyle(ButtonStyle.Secondary)
    );
}

module.exports = { handleButtonWelcome, handleModalWelcome };