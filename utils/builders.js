const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SectionBuilder, ThumbnailBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    StringSelectMenuBuilder,
    EmbedBuilder,
} = require('discord.js');

const { config }             = require('./config');
const { colorInt, intToHex } = require('./helpers');

const ACCENT = 0xd4a853;

function statusIcon(value) {
    return value ? '🟢' : '🔴';
}

function buildConfigHomePanel(guildIconURL = null) {
    const container = new ContainerBuilder().setAccentColor(ACCENT);

    const headerText =
        `# ⚙️  Configuration\n` +
        `-# Choisissez un système pour accéder à sa configuration.\n` +
        `-# Cette commande regroupe tous les paramètres du bot.`;

    if (guildIconURL) {
        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText))
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(guildIconURL))
        );
    } else {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));
    }

    const select = new StringSelectMenuBuilder()
        .setCustomId('config_selector')
        .setPlaceholder('Choisissez une catégorie de configuration…')
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions([
            { label: 'Accueil', value: 'home', emoji: '🏡', default: true },
            { label: 'Arrivées & départs', value: 'welcome-goodbye', emoji: '👋' },
            { label: 'Tickets', value: 'tickets', emoji: '🎟️' },
            { label: 'Autres (bientôt)', value: 'coming-soon', emoji: '⏳' },
        ]);

    container
        .addActionRowComponents(new ActionRowBuilder().addComponents(select))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `🧩 *Sélectionnez une catégorie pour modifier ses paramètres.*\n` +
            `🔎 Certains systèmes ne sont pas encore configurables via le panel : ils seront ajoutés prochainement.`
        ));

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2));
    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel('Support Discord')
                .setURL('https://discord.gg/3y4HWyFHPX'),
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel('Documentation')
                .setURL('https://www.draftbot.fr/docs'),
        )
    );

    return container;
}

function buildWelcomePanel(guildIconURL = null, errorMsg = null) {
    const welcomeRef = config.welcomeChannelId ? `<#${config.welcomeChannelId}>` : '*Non défini*';
    const leaveRef   = config.leaveChannelId   ? `<#${config.leaveChannelId}>`   : '*Non défini*';

    const container = new ContainerBuilder().setAccentColor(ACCENT);

    if (errorMsg) {
        container
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`> ❌  **Erreur** — ${errorMsg}`))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2));
    }

    const headerText =
        `# 👋  Arrivées & départs\n` +
        `-# Configure les salons utilisés pour les messages de bienvenue et de départ.`;

    if (guildIconURL) {
        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText))
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(guildIconURL))
        );
    } else {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));
    }

    const statusText =
        `### Salons configurés\n` +
        `• 🎉 Bienvenue : ${welcomeRef}\n` +
        `• 👋 Départs : ${leaveRef}\n\n` +
        `### Textes (aperçu)\n` +
        `• Bienvenue : ${config.welcomeText}\n` +
        `• Départ : ${config.leaveText}`;

    container
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(statusText))
        .addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('cfg_welcome_set_welcome')
                    .setLabel('Salon bienvenue')
                    .setEmoji('🎉')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('cfg_welcome_set_leave')
                    .setLabel('Salon départ')
                    .setEmoji('👋')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('cfg_welcome_edit:welcome')
                    .setLabel('Modifier texte bienvenue')
                    .setEmoji('✏️')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('cfg_welcome_edit:leave')
                    .setLabel('Modifier texte départ')
                    .setEmoji('✏️')
                    .setStyle(ButtonStyle.Secondary),
            )
        );

    const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cfg_back_home').setLabel('Accueil').setEmoji('🏡').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('cfg_welcome_preview:welcome').setLabel('Aperçu bienvenue').setEmoji('👀').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('cfg_welcome_preview:leave').setLabel('Aperçu départ').setEmoji('👀').setStyle(ButtonStyle.Primary),
    );

    return [container, actionRow];
}

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

function buildMainPanel(guildIconURL = null) {
    const cats = config.ticketCategories;
    const catKeys = Object.keys(cats);
    const total = catKeys.length;

    const container = new ContainerBuilder().setAccentColor(ACCENT);

    const headerText =
        `# 🎫  Gestion des tickets\n` +
        `-# ${total === 0 ? 'Aucun embed — crée-en un pour commencer' : `${total} embed${total > 1 ? 's' : ''} configuré${total > 1 ? 's' : ''}`}`;

    if (guildIconURL) {
        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText))
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(guildIconURL))
        );
    } else {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));
    }

    if (total === 0) {
        container
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `Crée ton premier embed de tickets ci-dessous.\n` +
                `-# Chaque embed a son propre affichage, ses permissions et son salon de transcripts.`
            ));
    }

    for (const catKey of catKeys) {
        const c = cats[catKey];
        const colorHex = typeof c.color === 'number' ? intToHex(c.color) : (c.color ?? '#5865f2');
        const catRef = c.categoryId ? `<#${c.categoryId}>` : '—';
        const tsRef = c.transcriptChannelId ? `<#${c.transcriptChannelId}>` : '—';

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

    container
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
        .addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('cfg_create')
                    .setLabel('Nouvel embed')
                    .setEmoji('➕')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('cfg_back_home')
                    .setLabel('Accueil')
                    .setEmoji('🏡')
                    .setStyle(ButtonStyle.Secondary),
            )
        );

    return container;
}

function buildCategoryPanel(catKey, errorMsg = null, guildIconURL = null) {
    const cat = config.ticketCategories[catKey];
    const colorHex = typeof cat.color === 'number' ? intToHex(cat.color) : (cat.color ?? '#5865f2');
    const catRef = cat.categoryId ? `<#${cat.categoryId}>` : '*Non définie*';
    const tsRef = cat.transcriptChannelId ? `<#${cat.transcriptChannelId}>` : '*Non défini*';

    const descLines = (cat.description ?? '').split('\n').map(l => `> ${l}`).join('\n');
    const livePreview =
        `> ### ${cat.title}\n` +
        `${descLines}\n` +
        `> \n` +
        `> 🎫  *${cat.buttonLabel}*`;

    const container = new ContainerBuilder().setAccentColor(colorInt(cat.color));

    if (errorMsg) {
        container
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `> ❌  **Erreur** — ${errorMsg}`
            ))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2));
    }

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

    const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cfg_back').setLabel('Retour').setEmoji('↩️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`cfg_save:${catKey}`).setLabel('Sauvegarder').setEmoji('💾').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`cfg_preview:${catKey}`).setLabel('Aperçu complet').setEmoji('👁️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`cfg_delete_confirm:${catKey}`).setLabel('Supprimer').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
    );

    return [container, actionRow];
}

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

module.exports = {
    buildConfigHomePanel,
    buildWelcomePanel,
    buildTicketEmbed,
    buildTicketOpenRow,
    buildMainPanel,
    buildCategoryPanel,
    buildDeleteConfirmPanel,
};
