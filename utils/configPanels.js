const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SectionBuilder, ThumbnailBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
} = require('discord.js');

const Flags = require('./flags');

const MODULES = [
    { value: 'tickets',    label: 'Tickets',            emoji: '🎫', available: true  },
    { value: 'moderation', label: 'Modération',         emoji: '🔨', available: false },
    { value: 'logs',       label: 'Logs',               emoji: '🗃️', available: false },
    { value: 'welcome',    label: 'Arrivées & départs', emoji: '👋', available: false },
    { value: 'autorole',   label: 'Rôles automatiques', emoji: '🏷️', available: false },
    { value: 'levels',     label: 'Niveaux',            emoji: '📈', available: false },
    { value: 'rolereact',  label: 'Rôles-Réactions',   emoji: '🔘', available: false },
    { value: 'report',     label: 'Signalements',       emoji: '🚨', available: false },
];

function sep() {
    return new SeparatorBuilder().setDivider(true).setSpacing(2);
}

function selectRow(current = null) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('config_select')
            .setPlaceholder('Choisissez une catégorie de commandes…')
            .addOptions(
                MODULES.map(m =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(m.label)
                        .setValue(m.value)
                        .setEmoji(m.emoji)
                        .setDefault(m.value === current)
                )
            )
    );
}

function linksRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Link).setURL('https://discord.gg/eldoria').setLabel('Support Discord'),
        new ButtonBuilder().setStyle(ButtonStyle.Link).setURL('https://github.com/Oyroo/Eldoria').setLabel('Documentation'),
    );
}

// ─── Accueil ──────────────────────────────────────────────────────────────────

function homePanel(guild) {
    const icon = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;

    const c = new ContainerBuilder().setAccentColor(0xd4a853);

    const section = new SectionBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# ⚙️  Configuration\n` +
            `-# Choisissez un système pour accéder à sa configuration.\n` +
            `-# Cette commande regroupe tous les paramètres du bot.`
        )
    );
    if (icon) section.setThumbnailAccessory(new ThumbnailBuilder().setURL(icon));
    c.addSectionComponents(section);

    // Select DANS le container
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1))
     .addActionRowComponents(selectRow(null))
     .addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `🧩  *Sélectionnez une catégorie pour modifier ses paramètres.*\n` +
        `🔍  *Certains systèmes ne sont pas encore configurables via le panel : ils seront ajoutés prochainement.*`
     ))
     .addSeparatorComponents(sep())
     .addActionRowComponents(linksRow());

    return {
        components: [c],
        flags: Flags.CV2_Ephemeral,
    };
}

// ─── Tickets ──────────────────────────────────────────────────────────────────

function ticketsPanel(guild) {
    const icon = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const { config } = require('./config');
    const cats  = config.ticketCategories ?? {};
    const keys  = Object.keys(cats);
    const total = keys.length;
    const openCount = Object.keys(require('./tickets').get() ?? {}).length;

    const c = new ContainerBuilder().setAccentColor(0xd4a853);

    const section = new SectionBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# 🎫  Tickets\n` +
            `-# Configurez le système de tickets de votre serveur.`
        )
    );
    if (icon) section.setThumbnailAccessory(new ThumbnailBuilder().setURL(icon));
    c.addSectionComponents(section);

    c.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1))
     .addActionRowComponents(selectRow('tickets'))
     .addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `> **Embeds configurés** : ${total}\n` +
        `> **Tickets ouverts** : ${openCount}`
     ));

    if (total > 0) {
        for (const key of keys) {
            const e   = cats[key];
            const catOk = e.categoryId          ? '🟢' : '🔴';
            const tsOk  = e.transcriptChannelId ? '🟢' : '🔴';
            const cat   = e.categoryId          ? `<#${e.categoryId}>`          : '*—*';
            const ts    = e.transcriptChannelId ? `<#${e.transcriptChannelId}>` : '*—*';

            c.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1))
             .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `**${e.label}**\n` +
                `${catOk} Catégorie : ${cat}  ·  ${tsOk} Transcripts : ${ts}\n` +
                `-# 🎫 *${e.buttonLabel}*`
             ));
        }
    } else {
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1))
         .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `🧩  *Aucun embed configuré. Utilisez le bouton ci-dessous pour commencer.*`
         ));
    }

    c.addSeparatorComponents(sep())
     .addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('config_tickets_open')
                .setLabel('Gérer les embeds')
                .setEmoji('✏️')
                .setStyle(ButtonStyle.Primary),
        )
     )
     .addActionRowComponents(linksRow());

    return {
        components: [c],
        flags: Flags.CV2_Ephemeral,
    };
}

// ─── Module indisponible ──────────────────────────────────────────────────────

function unavailablePanel(module, guild) {
    const icon = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const m    = MODULES.find(x => x.value === module) ?? { emoji: '⚙️', label: module };

    const c = new ContainerBuilder().setAccentColor(0xd4a853);

    const section = new SectionBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# ${m.emoji}  ${m.label}\n` +
            `-# Choisissez un système pour accéder à sa configuration.\n` +
            `-# Cette commande regroupe tous les paramètres du bot.`
        )
    );
    if (icon) section.setThumbnailAccessory(new ThumbnailBuilder().setURL(icon));
    c.addSectionComponents(section);

    c.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1))
     .addActionRowComponents(selectRow(module))
     .addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `🧩  *Sélectionnez une catégorie pour modifier ses paramètres.*\n` +
        `🔍  *Ce système n'est pas encore configurable via le panel : il sera ajouté prochainement.*`
     ))
     .addSeparatorComponents(sep())
     .addActionRowComponents(linksRow());

    return {
        components: [c],
        flags: Flags.CV2_Ephemeral,
    };
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────

function buildConfigMessage(module = 'home', guild = null) {
    if (!module || module === 'home') return homePanel(guild);
    if (module === 'tickets')         return ticketsPanel(guild);
    return unavailablePanel(module, guild);
}

module.exports = { buildConfigMessage };