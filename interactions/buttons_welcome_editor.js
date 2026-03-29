const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');

const { config, saveConfig } = require('../utils/config');

const CV2 = 1 << 15;

// ─── Construire le message CV2 depuis la config ───────────────────────────────

function buildCustomMessage(type, member) {
    const key = type === 'general' ? 'generalMsg' : 'departMsg';
    const msg = config.welcome?.[key] ?? {};

    const userId = member?.id ?? '000000000000000000';
    const guildName = member?.guild?.name ?? 'Eldoria';
    const username = member?.user?.tag ?? 'Utilisateur#0000';

    const c = new ContainerBuilder().setAccentColor(msg.accentColor ?? (type === 'general' ? 0xd4a853 : 0x95a5a6));

    if (msg.title) c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${msg.title}`.replace(/\{user\}/g, `<@${userId}>`).replace(/\{server\}/g, guildName).replace(/\{username\}/g, username)
    ));

    if (msg.body) {
        if (msg.title) c.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            msg.body.replace(/\{user\}/g, `<@${userId}>`).replace(/\{server\}/g, guildName).replace(/\{username\}/g, username)
        ));
    }

    if (msg.footer) {
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
         .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${msg.footer}`));
    }

    return c;
}

// ─── Panel éditeur ───────────────────────────────────────────────────────────

function buildGeneralMsgEditor(guild, type) {
    const key = type === 'general' ? 'generalMsg' : 'departMsg';
    const label = type === 'general' ? 'message d\'accueil général' : 'message de départ';
    const emoji = type === 'general' ? '💬' : '👋';
    const msg = config.welcome?.[key] ?? {};

    const c = new ContainerBuilder().setAccentColor(0x5865f2)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# ${emoji}  Éditeur — ${label.charAt(0).toUpperCase() + label.slice(1)}\n-# Personnalise le message CV2 envoyé automatiquement.`
        ))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `**Variables :** \`{user}\` → mention · \`{username}\` → pseudo · \`{server}\` → serveur\n\n` +
            `**Titre** · ${msg.title ? `\`${msg.title}\`` : '*Non défini*'}\n` +
            `**Corps** · ${msg.body ? `\`${msg.body.slice(0, 80)}${msg.body.length > 80 ? '…' : ''}\`` : '*Non défini*'}\n` +
            `**Pied de page** · ${msg.footer ? `\`${msg.footer}\`` : '*Non défini*'}`
        ))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
        .addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`wgen_edit:${type}`).setLabel('Modifier le texte').setEmoji('✏️').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`wgen_preview:${type}`).setLabel('Aperçu').setEmoji('👁️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('wgen_back').setLabel('Retour').setEmoji('↩️').setStyle(ButtonStyle.Secondary),
        ));

    return c;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

async function handleButtonWelcomeEditor(interaction) {
    const id = interaction.customId;

    if (id.startsWith('wgen_edit:')) {
        const type = id.split(':')[1];
        const key = type === 'general' ? 'generalMsg' : 'departMsg';
        const msg = config.welcome?.[key] ?? {};
        const label = type === 'general' ? 'Message d\'accueil général' : 'Message de départ';
        const modal = new ModalBuilder().setCustomId(`wgen_modal:${type}`).setTitle(label);
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('title').setLabel('Titre (optionnel)').setStyle(TextInputStyle.Short).setRequired(false).setValue(msg.title ?? '').setMaxLength(80)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('body').setLabel('Corps ({user}, {username}, {server})').setStyle(TextInputStyle.Paragraph).setRequired(false).setValue(msg.body ?? '').setMaxLength(800)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('footer').setLabel('Pied de page (optionnel)').setStyle(TextInputStyle.Short).setRequired(false).setValue(msg.footer ?? '').setMaxLength(120)
            ),
        );
        return interaction.showModal(modal);
    }

    if (id.startsWith('wgen_preview:')) {
        await interaction.deferReply({ flags: EPHEMERAL });
        const type = id.split(':')[1];
        const c = buildCustomMessage(type, null);
        return interaction.editReply({ components: [c], flags: CV2 });
    }

    if (id === 'wgen_back') {
        await interaction.deferUpdate();
        const { buildWelcomePanel } = require('./buttons_welcome');
        return interaction.editReply({ components: [buildWelcomePanel(interaction.guild)], flags: CV2 });
    }
}

async function handleModalWelcomeEditor(interaction) {
    if (interaction.customId.startsWith('wgen_modal:')) {
        await interaction.deferUpdate();
        const type = interaction.customId.split(':')[1];
        const key = type === 'general' ? 'generalMsg' : 'departMsg';
        const title = interaction.fields.getTextInputValue('title')?.trim() || null;
        const body = interaction.fields.getTextInputValue('body')?.trim() || null;
        const footer = interaction.fields.getTextInputValue('footer')?.trim() || null;

        if (!config.welcome) config.welcome = {};
        config.welcome[key] = { title, body, footer, accentColor: type === 'general' ? 0xd4a853 : 0x95a5a6 };
        saveConfig();

        return interaction.editReply({ components: [buildGeneralMsgEditor(interaction.guild, type)], flags: CV2 });
    }
}

module.exports = { buildCustomMessage, buildGeneralMsgEditor, handleButtonWelcomeEditor, handleModalWelcomeEditor };