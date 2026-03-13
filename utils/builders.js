const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    EmbedBuilder,
} = require('discord.js');

const { config }             = require('./config');
const { colorInt, intToHex } = require('./helpers');

// ─── Constantes visuelles ─────────────────────────────────────────────────────

const ACCENT      = 0xd4a853; // or Eldoria
const ACCENT_WAIT = 0x5865f2; // blurple Discord pour l'attente

// Barre de statut : icône selon si configuré ou non
function statusIcon(value) { return value ? '🟢' : '🔴'; }

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

function buildMainPanel() {
    const cats    = config.ticketCategories;
    const catKeys = Object.keys(cats);
    const total   = catKeys.length;

    const container = new ContainerBuilder().setAccentColor(ACCENT);

    // ── En-tête ───────────────────────────────────────────────────────────────
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# 🎫  Gestion des tickets\n` +
            `-# ${total === 0 ? 'Aucune catégorie configurée' : `${total} catégorie${total > 1 ? 's' : ''} · Clique sur une catégorie pour la modifier`}`
        )
    );

    // ── Aucune catégorie ──────────────────────────────────────────────────────
    if (total === 0) {
        container
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                [
                    `### Pour commencer`,
                    ``,
                    `Crée ta première catégorie de tickets avec le bouton ci-dessous.`,
                    `Chaque catégorie correspond à un type de demande (support, roleplay, signalement…)`,
                    `et possède son propre embed, salon de tickets et salon de transcripts.`,
                ].join('\n')
            ));
    }

    // ── Liste des catégories ──────────────────────────────────────────────────
    for (const catKey of catKeys) {
        const c        = cats[catKey];
        const colorHex = typeof c.color === 'number' ? intToHex(c.color) : (c.color ?? '#5865f2');
        const catRef   = c.categoryId          ? `<#${c.categoryId}>`          : '*Non définie*';
        const tsRef    = c.transcriptChannelId ? `<#${c.transcriptChannelId}>` : '*Non défini*';

        const catOk = statusIcon(c.categoryId);
        const tsOk  = statusIcon(c.transcriptChannelId);

        container
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                [
                    `### ${c.label}`,
                    `${catOk} Catégorie Discord · ${catRef}`,
                    `${tsOk} Transcripts · ${tsRef}`,
                    `-# 🎨 \`${colorHex}\`  ·  🎫 *${c.buttonLabel}*`,
                ].join('\n')
            ))
            .addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`cfg_open:${catKey}`)
                        .setLabel(`Modifier ${c.label}`)
                        .setEmoji('✏️')
                        .setStyle(ButtonStyle.Secondary),
                )
            );
    }

    // ── Pied de panel ─────────────────────────────────────────────────────────
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

function buildCategoryPanel(catKey, errorMsg = null) {
    const cat      = config.ticketCategories[catKey];
    const colorHex = typeof cat.color === 'number' ? intToHex(cat.color) : (cat.color ?? '#5865f2');
    const catRef   = cat.categoryId          ? `<#${cat.categoryId}>`          : '*Non définie*';
    const tsRef    = cat.transcriptChannelId ? `<#${cat.transcriptChannelId}>` : '*Non défini*';

    const catOk = statusIcon(cat.categoryId);
    const tsOk  = statusIcon(cat.transcriptChannelId);

    // Aperçu live du panel public
    const descLines   = (cat.description ?? '').split('\n').map(l => `> ${l}`).join('\n');
    const livePreview =
        `> ### ${cat.title}\n` +
        `${descLines}\n` +
        `> \n` +
        `> 🎫  *${cat.buttonLabel}*`;

    const container = new ContainerBuilder().setAccentColor(colorInt(cat.color));

    // ── Bandeau d'erreur ──────────────────────────────────────────────────────
    if (errorMsg) {
        container
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `> ❌  **Erreur**\n> ${errorMsg}`
            ))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    }

    // ── En-tête ───────────────────────────────────────────────────────────────
    container
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# ${cat.label}\n` +
            `-# Clé interne : \`${catKey}\``
        ))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

    // ── Statut de configuration ───────────────────────────────────────────────
    container
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            [
                `### Configuration`,
                `${catOk}  **Catégorie Discord**`,
                `-# ${catRef}`,
                `${tsOk}  **Salon des transcripts**`,
                `-# ${tsRef}`,
                `🎨  **Couleur de l'embed** · \`${colorHex}\``,
            ].join('\n')
        ))
        .addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`cfg_setcat:${catKey}`).setLabel('Catégorie Discord').setEmoji('📁').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`cfg_transcript:${catKey}`).setLabel('Transcripts').setEmoji('📋').setStyle(ButtonStyle.Secondary),
            )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

    // ── Aperçu live ───────────────────────────────────────────────────────────
    container
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `### Aperçu de l'embed public\n` +
            livePreview
        ))
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
        new ButtonBuilder().setCustomId(`cfg_delete:${catKey}`).setLabel('Supprimer').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
    );

    return [container, actionRow];
}

// ─── Panel d'attente de saisie par message ────────────────────────────────────

function buildAwaitingPanel(type, catKey) {
    const cat = config.ticketCategories[catKey] ?? { label: catKey };

    const infos = {
        setcat: {
            emoji: '📁',
            title: 'Catégorie Discord',
            what:  'Envoie l\'**ID de la catégorie Discord**',
            hint:  'Clic droit sur la catégorie → *Copier l\'identifiant*\n-# Pense à activer le mode développeur dans tes paramètres Discord.',
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
            hint:  'Le panel sera envoyé dans ce salon avec l\'embed et le bouton d\'ouverture.',
        },
    };

    const info = infos[type] ?? { emoji: '⌨️', title: 'Saisie', what: 'Envoie ta réponse.', hint: '' };

    const container = new ContainerBuilder()
        .setAccentColor(ACCENT_WAIT)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# ${info.emoji}  ${info.title}\n` +
            `-# Catégorie : **${cat.label}**`
        ))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            [
                `### Que faire ?`,
                `${info.what} dans ce salon.`,
                ``,
                info.hint,
                ``,
                `-# Tape \`annuler\` ou clique sur le bouton pour annuler.`,
            ].join('\n')
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
    buildAwaitingPanel,
};