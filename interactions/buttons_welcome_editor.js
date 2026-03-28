const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');

const Flags                  = require('../utils/flags');
const { config, saveConfig } = require('../utils/config');

const CV2 = 1 << 15;

// ─── Construire le message général depuis la config ───────────────────────────

function buildGeneralMessage(member) {
    const msg = config.welcome?.generalMsg ?? {};
    const accent = 0xd4a853;

    const c = new ContainerBuilder().setAccentColor(msg.accentColor ?? accent);

    if (msg.title) {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `## ${msg.title}`.replace('{user}', `<@${member?.id ?? '0'}>`)
        ));
    }

    if (msg.body) {
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1))
         .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            msg.body
                .replace(/\{user\}/g, `<@${member?.id ?? '0'}>`)
                .replace(/\{server\}/g, member?.guild?.name ?? 'Eldoria')
         ));
    }

    if (msg.footer) {
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
         .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${msg.footer}`));
    }

    return c;
}

// ─── Panel éditeur ────────────────────────────────────────────────────────────

function buildGeneralMsgEditor(guild) {
    const msg = config.welcome?.generalMsg ?? {};

    const preview = new ContainerBuilder().setAccentColor(0x5865f2)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# ✏️  Éditeur du message général\n-# Personnalise le message envoyé dans le salon général à chaque arrivée.`
        ))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `**Variables disponibles :** \`{user}\` → mention du membre · \`{server}\` → nom du serveur\n\n` +
            `**Titre** · ${msg.title ? `\`${msg.title}\`` : '*Non défini*'}\n` +
            `**Corps** · ${msg.body ? `\`${msg.body.slice(0, 80)}${msg.body.length > 80 ? '…' : ''}\`` : '*Non défini*'}\n` +
            `**Pied de page** · ${msg.footer ? `\`${msg.footer}\`` : '*Non défini*'}`
        ))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
        .addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('wgen_edit_modal').setLabel('Modifier le texte').setEmoji('✏️').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('wgen_preview').setLabel('Aperçu').setEmoji('👁️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('wgen_back').setLabel('Retour').setEmoji('↩️').setStyle(ButtonStyle.Secondary),
        ));

    return preview;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

async function handleButtonWelcomeEditor(interaction) {
    const id = interaction.customId;

    if (id === 'wgen_edit_modal') {
        const msg = config.welcome?.generalMsg ?? {};
        const modal = new ModalBuilder().setCustomId('wgen_modal_text').setTitle('Message de bienvenue général');
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('title').setLabel('Titre (optionnel, supports {user})').setStyle(TextInputStyle.Short).setRequired(false).setValue(msg.title ?? '').setMaxLength(80)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('body').setLabel('Corps du message (supports {user}, {server})').setStyle(TextInputStyle.Paragraph).setRequired(false).setValue(msg.body ?? '').setMaxLength(800)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('footer').setLabel('Pied de page (optionnel)').setStyle(TextInputStyle.Short).setRequired(false).setValue(msg.footer ?? '').setMaxLength(120)
            ),
        );
        return interaction.showModal(modal);
    }

    if (id === 'wgen_preview') {
        await interaction.deferReply({ flags: Flags.Ephemeral });
        const c = buildGeneralMessage(null);
        return interaction.editReply({ components: [c], flags: CV2 });
    }

    if (id === 'wgen_back') {
        await interaction.deferUpdate();
        const { buildWelcomePanel } = require('./buttons_welcome');
        return interaction.editReply({ components: [buildWelcomePanel(interaction.guild)] });
    }
}

async function handleModalWelcomeEditor(interaction) {
    if (interaction.customId === 'wgen_modal_text') {
        await interaction.deferUpdate();
        const title  = interaction.fields.getTextInputValue('title')?.trim() || null;
        const body   = interaction.fields.getTextInputValue('body')?.trim()  || null;
        const footer = interaction.fields.getTextInputValue('footer')?.trim() || null;

        if (!config.welcome) config.welcome = {};
        config.welcome.generalMsg = { title, body, footer, accentColor: 0xd4a853 };
        saveConfig();

        return interaction.editReply({ components: [buildGeneralMsgEditor(interaction.guild)] });
    }
}

module.exports = { buildGeneralMessage, buildGeneralMsgEditor, handleButtonWelcomeEditor, handleModalWelcomeEditor };