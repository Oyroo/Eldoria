const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SectionBuilder, ThumbnailBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    EmbedBuilder,
} = require('discord.js');

const { config }             = require('./config');
const { colorInt, intToHex } = require('./helpers');

// ─── Constantes ───────────────────────────────────────────────────────────────

const ACCENT      = 0xd4a853;
const ACCENT_WAIT = 0x5865f2;

function statusIcon(value) { return value ? '🟢' : '🔴'; }

// ─── Panel de ticket public ───────────────────────────────────────────────────

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
// guildIconURL : URL de l'icône du serveur (optionnel)

function buildMainPanel(guildIconURL = null) {
    const cats    = config.ticketCategories;
    const catKeys = Object.keys(cats);
    const total   = catKeys.length;

    const container = new ContainerBuilder().setAccentColor(ACCENT);

    // ── En-tête avec thumbnail ────────────────────────────────────────────────
    if (guildIconURL) {
        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `# 🎫  Gestion des tickets\n` +
                        `-# ${total === 0
                            ? 'Aucun embed — crée-en un pour commencer'
                            : `${total} embed${total > 1 ? 's' : ''} configuré${total > 1 ? 's' : ''}`
                        }`
                    )
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder().setURL(guildIconURL)
                )
        );
    } else {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `# 🎫  Gestion des tickets\n` +
                `-# ${total === 0
                    ? 'Aucun embed — crée-en un pour commencer'
                    : `${total} embed${total > 1 ? 's' : ''} configuré${total > 1 ? 's' : ''}`
                }`
            )
        );
    }

    // ── Aucun embed ──────────────────────────────────────────────────────
    if (total === 0) {
        container
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `Crée ton premier embed de tickets ci-dessous.\n` +
                `-# Chaque embed a son propre affichage, ses permissions et son salon de transcripts.`
            ));
    }

    // ── Embeds ────────────────────────────────────────────────────────────
    for (const catKey of catKeys) {
        const c        = cats[catKey];
        const colorHex = typeof c.color === 'number' ? intToHex(c.color) : (c.color ?? '#5865f2');
        const catRef   = c.categoryId          ? `<#${c.categoryId}>`          : '—';
        const tsRef    = c.transcriptChannelId ? `<#${c.transcriptChannelId}>` : '—';

        container
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `### ${c.label}\n` +
                `${statusIcon(c.categoryId)}  Catégorie Discord  ·  ${catRef}\n` +
                `${statusIcon(c.transcriptChannelId)}  Transcripts  ·  ${tsRef}\n` +
                `-# 🎨 \`${colorHex}\`  ·  🎫 *${c.buttonLabel}*`
            ))
            .addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`cfg_open:${catKey}`)
                        .setLabel(`Modifier`)
                        .setEmoji('✏️')
                        .setStyle(ButtonStyle.Secondary),
                )
            );
    }

    // ── Pied ──────────────────────────────────────────────────────────────────
    container
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
        .addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('cfg_create')
                    .setLabel('Nouvel embed')
                    .setEmoji('➕')
                    .setStyle(ButtonStyle.Success),
            )
        );

    return container;
}

// ─── Page embed ───────────────────────────────────────────────────────────

function buildCategoryPanel(catKey, errorMsg = null, guildIconURL = null) {
    const cat      = config.ticketCategories[catKey];
    const colorHex = typeof cat.color === 'number' ? intToHex(cat.color) : (cat.color ?? '#5865f2');
    const catRef   = cat.categoryId          ? `<#${cat.categoryId}>`          : '*Non définie*';
    const tsRef    = cat.transcriptChannelId ? `<#${cat.transcriptChannelId}>` : '*Non défini*';

    // Aperçu live
    const descLines   = (cat.description ?? '').split('\n').map(l => `> ${l}`).join('\n');
    const livePreview =
        `> ### ${cat.title}\n` +
        `${descLines}\n` +
        `> \n` +
        `> 🎫  *${cat.buttonLabel}*`;

    const container = new ContainerBuilder().setAccentColor(colorInt(cat.color));

    // ── Erreur ────────────────────────────────────────────────────────────────
    if (errorMsg) {
        container
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `> ❌  **Erreur** — ${errorMsg}`
            ))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2));
    }

    // ── En-tête ───────────────────────────────────────────────────────────────
    if (guildIconURL) {
        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `# ${cat.label}\n-# Clé : \`${catKey}\``
                    )
                )
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(guildIconURL))
        );
    } else {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${cat.label}\n-# Clé : \`${catKey}\``)
        );
    }

    // ── Configuration ─────────────────────────────────────────────────────────
    container
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `### Configuration\n` +
            `${statusIcon(cat.categoryId)}  **Catégorie Discord**  ·  ${catRef}\n` +
            `${statusIcon(cat.transcriptChannelId)}  **Transcripts**  ·  ${tsRef}\n` +
            `🎨  **Couleur**  ·  \`${colorHex}\``
        ))
        .addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`cfg_setcat:${catKey}`).setLabel('Catégorie Discord').setEmoji('📁').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`cfg_transcript:${catKey}`).setLabel('Transcripts').setEmoji('📋').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`cfg_color:${catKey}`).setLabel('Couleur').setEmoji('🎨').setStyle(ButtonStyle.Secondary),
            )
        );

    // ── Aperçu embed ──────────────────────────────────────────────────────────
    container
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `### Aperçu de l'embed public\n` +
            livePreview
        ))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1))
        .addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`cfg_edit:${catKey}`).setLabel('Modifier l\'embed').setEmoji('✏️').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`cfg_send:${catKey}`).setLabel('Envoyer dans un salon').setEmoji('📤').setStyle(ButtonStyle.Primary),
            )
        );

    // ── Boutons hors container ────────────────────────────────────────────────
    const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cfg_back').setLabel('Retour').setEmoji('↩️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`cfg_save:${catKey}`).setLabel('Sauvegarder').setEmoji('💾').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`cfg_preview:${catKey}`).setLabel('Aperçu complet').setEmoji('👁️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`cfg_delete_confirm:${catKey}`).setLabel('Supprimer').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
    );

    return [container, actionRow];
}

// ─── Confirmation de suppression ──────────────────────────────────────────────

function buildDeleteConfirmPanel(catKey) {
    const cat = config.ticketCategories[catKey];

    const container = new ContainerBuilder()
        .setAccentColor(0xed4245)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# 🗑️  Supprimer un embed\n` +
            `-# Cette action est irréversible`
        ))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `Tu es sur le point de supprimer l'embed **${cat.label}**.\n` +
            `\n` +
            `Les tickets déjà ouverts dans cet embed ne seront pas affectés,\n` +
            `mais il ne sera plus possible d'en ouvrir de nouveaux.\n` +
            `\n` +
            `-# Cette action supprime définitivement la configuration de l'embed.`
        ));

    const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`cfg_back_cat:${catKey}`).setLabel('Annuler').setEmoji('✖️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`cfg_delete_yes:${catKey}`).setLabel('Supprimer définitivement').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
    );

    return [container, actionRow];
}

// ─── Panel d'attente de saisie ────────────────────────────────────────────────

function buildAwaitingPanel(type, catKey) {
    const cat = config.ticketCategories[catKey] ?? { label: catKey };

    const infos = {
        setcat: {
            emoji: '📁',
            title: 'Catégorie Discord',
            what:  'Envoie l\'**ID de la catégorie Discord**',
            hint:  'Clic droit sur la catégorie → *Copier l\'identifiant*\n-# Active le mode développeur : Paramètres → Avancés → Mode développeur.',
        },
        transcript: {
            emoji: '📋',
            title: 'Salon des transcripts',
            what:  'Envoie le **#salon** ou son **ID**',
            hint:  'Exemple : `#transcripts` ou l\'ID numérique du salon.',
        },
        sendchan: {
            emoji: '📤',
            title: 'Envoyer le panel',
            what:  'Envoie le **#salon** ou son **ID**',
            hint:  'L\'embed et le bouton d\'ouverture seront envoyés dans ce salon.',
        },
    };

    const info = infos[type] ?? { emoji: '⌨️', title: 'Saisie', what: 'Envoie ta réponse.', hint: '' };

    const container = new ContainerBuilder()
        .setAccentColor(ACCENT_WAIT)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# ${info.emoji}  ${info.title}\n` +
            `-# Embed : **${cat.label}**`
        ))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${info.what} directement dans ce salon.\n` +
            `\n` +
            info.hint +
            `\n` +
            `-# Tape \`annuler\` ou clique sur le bouton ci-dessous pour annuler.`
        ));

    const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('cfg_cancel')
            .setLabel('Annuler')
            .setEmoji('✖️')
            .setStyle(ButtonStyle.Secondary)
    );

    return [container, actionRow];
}

module.exports = {
    buildTicketEmbed,
    buildTicketOpenRow,
    buildMainPanel,
    buildCategoryPanel,
    buildDeleteConfirmPanel,
    buildAwaitingPanel,
};