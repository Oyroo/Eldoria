const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    EmbedBuilder,
} = require('discord.js');

const { config }             = require('./config');
const { colorInt, intToHex } = require('./helpers');

// ─── Panel de ticket public (embed + bouton) ──────────────────────────────────

function buildTicketEmbed(catKey) {
    const cat = config.ticketCategories[catKey];
    return new EmbedBuilder()
        .setTitle(cat.title)
        .setDescription(cat.description)
        .setColor(colorInt(cat.color))
        .setFooter({ text: 'Eldoria — Système de tickets' });
}

function buildTicketOpenRow(catKey) {
    const cat = config.ticketCategories[catKey];
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`ticket_create:${catKey}`)
            .setLabel(cat.buttonLabel)
            .setEmoji('🎫')
            .setStyle(ButtonStyle.Primary)
    );
}

// ─── Menu principal ───────────────────────────────────────────────────────────
// Retourne un seul ContainerBuilder

function buildMainPanel() {
    const cats    = config.ticketCategories;
    const catKeys = Object.keys(cats);

    const container = new ContainerBuilder()
        .setAccentColor(0xd4a853)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `# ⚙️  Configuration — Tickets\n` +
                `-# ${catKeys.length} catégorie${catKeys.length !== 1 ? 's' : ''} configurée${catKeys.length !== 1 ? 's' : ''}`
            )
        );

    if (catKeys.length === 0) {
        container
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                '-# Aucune catégorie. Clique sur **➕ Nouvelle catégorie** pour commencer.'
            ));
    }

    for (const catKey of catKeys) {
        const c        = cats[catKey];
        const colorHex = typeof c.color === 'number' ? intToHex(c.color) : (c.color ?? '#5865f2');
        const catId    = c.categoryId          ? `<#${c.categoryId}>`          : '`—`';
        const tsId     = c.transcriptChannelId ? `<#${c.transcriptChannelId}>` : '`—`';

        container
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `**${c.label}**  \`${catKey}\`\n` +
                `-# 📁 ${catId}  ·  📋 ${tsId}  ·  🎨 \`${colorHex}\``
            ))
            .addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`cfg_open:${catKey}`)
                        .setLabel('Modifier')
                        .setEmoji('✏️')
                        .setStyle(ButtonStyle.Secondary),
                )
            );
    }

    container
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('cfg_create')
                    .setLabel('Nouvelle catégorie')
                    .setEmoji('➕')
                    .setStyle(ButtonStyle.Success),
            )
        );

    return container;
}

// ─── Page d'une catégorie ─────────────────────────────────────────────────────
// Retourne [ContainerBuilder, ActionRowBuilder]
// Le ContainerBuilder va dans components[0], l'ActionRow dans components[1]

function buildCategoryPanel(catKey, errorMsg = null) {
    const cat      = config.ticketCategories[catKey];
    const colorHex = typeof cat.color === 'number' ? intToHex(cat.color) : (cat.color ?? '#5865f2');
    const catId    = cat.categoryId          ? `<#${cat.categoryId}>`          : '`Non définie`';
    const tsId     = cat.transcriptChannelId ? `<#${cat.transcriptChannelId}>` : '`Non défini`';

    // Aperçu live du panel public
    const descLines   = (cat.description ?? '').split('\n').map(l => `> ${l}`).join('\n');
    const livePreview =
        `> **${cat.title}**\n` +
        `${descLines}\n> \n` +
        `> 🎫  *${cat.buttonLabel}*`;

    const container = new ContainerBuilder().setAccentColor(colorInt(cat.color));

    if (errorMsg) {
        container
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`❌  ${errorMsg}`))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    }

    container
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# ✏️  ${cat.label}\n` +
            `-# Clé : \`${catKey}\``
        ))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `📁  Catégorie Discord : ${catId}\n` +
            `📋  Transcripts : ${tsId}\n` +
            `🎨  Couleur : \`${colorHex}\``
        ))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(livePreview))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`cfg_edit:${catKey}`).setLabel('Modifier l\'embed').setEmoji('✏️').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`cfg_setcat:${catKey}`).setLabel('Catégorie Discord').setEmoji('📁').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`cfg_transcript:${catKey}`).setLabel('Transcripts').setEmoji('📋').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`cfg_send:${catKey}`).setLabel('Envoyer le panel').setEmoji('📤').setStyle(ButtonStyle.Primary),
            )
        );

    // Boutons hors container (retour / actions principales)
    const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cfg_back').setLabel('Retour').setEmoji('↩️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`cfg_save:${catKey}`).setLabel('Sauvegarder').setEmoji('💾').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`cfg_preview:${catKey}`).setLabel('Aperçu').setEmoji('👁️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`cfg_delete:${catKey}`).setLabel('Supprimer').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
    );

    return [container, actionRow];
}

// ─── Panel d'attente de saisie par message ────────────────────────────────────
// Retourne [ContainerBuilder, ActionRowBuilder]

function buildAwaitingPanel(type, catKey) {
    const cat = config.ticketCategories[catKey] ?? { label: catKey };

    const infos = {
        setcat: {
            icon: '📁', title: 'Définir la catégorie Discord',
            detail:
                `Envoie l'**ID de la catégorie Discord** pour **${cat.label}**.\n` +
                `-# Clic droit sur la catégorie → Mode développeur → Copier l'identifiant`,
        },
        transcript: {
            icon: '📋', title: 'Salon des transcripts',
            detail:
                `Envoie le **#salon** ou son **ID** pour les transcripts de **${cat.label}**.\n` +
                `-# Exemple : \`#transcripts\` ou l'ID numérique`,
        },
        sendchan: {
            icon: '📤', title: 'Envoyer le panel',
            detail:
                `Envoie le **#salon** ou son **ID** où envoyer le panel **${cat.label}**.\n` +
                `-# Exemple : \`#tickets\` ou l'ID numérique`,
        },
    };

    const info = infos[type] ?? { icon: '⌨️', title: 'Saisie', detail: 'Envoie ta réponse.' };

    const container = new ContainerBuilder()
        .setAccentColor(0xf0a500)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# ${info.icon}  ${info.title}\n-# En attente de ta réponse...`
        ))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(info.detail))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            '-# Tape `annuler` ou clique ci-dessous pour annuler.'
        ));

    const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cfg_cancel').setLabel('Annuler').setEmoji('✖️').setStyle(ButtonStyle.Secondary)
    );

    return [container, actionRow];
}

module.exports = {
    buildTicketEmbed,
    buildTicketOpenRow,
    buildMainPanel,
    buildCategoryPanel,
    buildAwaitingPanel,
};