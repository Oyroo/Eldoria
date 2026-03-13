const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SectionBuilder, ThumbnailBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    EmbedBuilder,
} = require('discord.js');

const { config }             = require('./config');
const { colorInt, intToHex } = require('./helpers');

// ─── Panel de ticket (embed public + bouton) ──────────────────────────────────

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

// ─── Panel de configuration (Components V2, éphémère) ────────────────────────

function buildConfigPanel(errorMsg = null) {
    const cats    = config.ticketCategories;
    const catKeys = Object.keys(cats);

    const container = new ContainerBuilder().setAccentColor(0xd4a853);

    // Bandeau d'erreur
    if (errorMsg) {
        container
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`❌  ${errorMsg}`))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    }

    // En-tête
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# ⚙️  Configuration — Tickets\n` +
            `-# ${catKeys.length} catégorie${catKeys.length !== 1 ? 's' : ''} configurée${catKeys.length !== 1 ? 's' : ''}`
        )
    );

    // Aucune catégorie
    if (catKeys.length === 0) {
        container
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                '-# Aucune catégorie. Clique sur **➕ Nouvelle catégorie** pour commencer.'
            ));
    }

    // Une section par catégorie
    for (const catKey of catKeys) {
        const c        = cats[catKey];
        const colorHex = typeof c.color === 'number' ? intToHex(c.color) : (c.color ?? '#5865f2');
        const catId    = c.categoryId          ? `<#${c.categoryId}>`          : '`Non définie`';
        const tsId     = c.transcriptChannelId ? `<#${c.transcriptChannelId}>` : '`Non défini`';

        // Aperçu live du panel final
        const descLines  = (c.description ?? '').split('\n').map(l => `> ${l}`).join('\n');
        const livePreview =
            `> **${c.title}**\n` +
            `${descLines}\n` +
            `> \n` +
            `> 🎫  *${c.buttonLabel}*`;

        container
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `**${c.label}**  \`${catKey}\`\n` +
                `📁  Catégorie Discord : ${catId}\n` +
                `📋  Transcripts : ${tsId}\n` +
                `🎨  Couleur : \`${colorHex}\`\n\n` +
                livePreview
            ))
            .addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`cfg_edit:${catKey}`).setLabel('Modifier').setEmoji('✏️').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`cfg_setcat:${catKey}`).setLabel('Catégorie Discord').setEmoji('📁').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`cfg_transcript:${catKey}`).setLabel('Transcripts').setEmoji('📋').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`cfg_send:${catKey}`).setLabel('Envoyer le panel').setEmoji('📤').setStyle(ButtonStyle.Primary),
                )
            )
            .addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`cfg_preview:${catKey}`).setLabel('Aperçu').setEmoji('👁️').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`cfg_delete:${catKey}`).setLabel('Supprimer').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
                )
            );
    }

    // Pied de panel
    container
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('cfg_create').setLabel('Nouvelle catégorie').setEmoji('➕').setStyle(ButtonStyle.Success),
            )
        );

    return container;
}

// ─── Panel d'attente de saisie par message ────────────────────────────────────

function buildAwaitingPanel(type, catKey) {
    const cat = config.ticketCategories[catKey] ?? { label: catKey };

    const infos = {
        setcat: {
            icon: '📁',
            title: 'Définir la catégorie Discord',
            detail:
                `Envoie l'**ID de la catégorie Discord** pour **${cat.label}**.\n` +
                `-# Clic droit sur la catégorie → Mode développeur → Copier l'identifiant`,
        },
        transcript: {
            icon: '📋',
            title: 'Salon des transcripts',
            detail:
                `Envoie le **#salon** ou son **ID** pour les transcripts de **${cat.label}**.\n` +
                `-# Exemple : \`#transcripts\` ou l'ID numérique`,
        },
        sendchan: {
            icon: '📤',
            title: 'Envoyer le panel',
            detail:
                `Envoie le **#salon** ou son **ID** où envoyer le panel **${cat.label}**.\n` +
                `-# Exemple : \`#tickets\` ou l'ID numérique`,
        },
    };

    const info = infos[type] ?? { icon: '⌨️', title: 'Saisie', detail: 'Envoie ta réponse.' };

    return new ContainerBuilder()
        .setAccentColor(0xf0a500)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# ${info.icon}  ${info.title}\n-# En attente de ta réponse...`
        ))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(info.detail))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            '-# Tape `annuler` ou clique ci-dessous pour annuler.'
        ))
        .addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('cfg_cancel').setLabel('Annuler').setEmoji('✖️').setStyle(ButtonStyle.Secondary)
            )
        );
}

module.exports = {
    buildTicketEmbed,
    buildTicketOpenRow,
    buildConfigPanel,
    buildAwaitingPanel,
};