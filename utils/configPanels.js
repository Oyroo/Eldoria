const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SectionBuilder, ThumbnailBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
} = require('discord.js');

const Flags = require('./flags');

// ─── Modules disponibles ──────────────────────────────────────────────────────

const MODULES = [
    { value: 'home',        label: 'Accueil',            emoji: '🏡', available: true  },
    { value: 'tickets',     label: 'Tickets',            emoji: '🎫', available: true  },
    { value: 'moderation',  label: 'Modération',         emoji: '🔨', available: false },
    { value: 'logs',        label: 'Logs',               emoji: '🗃️', available: false },
    { value: 'welcome',     label: 'Arrivées & départs', emoji: '👋', available: false },
    { value: 'autorole',    label: 'Rôles automatiques', emoji: '🏷️', available: false },
    { value: 'levels',      label: 'Niveaux',            emoji: '📈', available: false },
    { value: 'rolereact',   label: 'Rôles-Réactions',   emoji: '🔘', available: false },
    { value: 'report',      label: 'Signalements',       emoji: '🚨', available: false },
];

// ─── Select menu de navigation ────────────────────────────────────────────────

function configSelectMenu(current = 'home') {
    const select = new StringSelectMenuBuilder()
        .setCustomId('config_select')
        .setPlaceholder('Choisissez un module…')
        .addOptions(
            MODULES.map(m =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(m.label)
                    .setValue(m.value)
                    .setEmoji(m.emoji)
                    .setDefault(m.value === current)
                    .setDescription(m.available ? 'Configurer ce module' : 'Bientôt disponible')
            )
        );

    return new ActionRowBuilder().addComponents(select);
}

// ─── Panels par module ────────────────────────────────────────────────────────

function sep() {
    return new SeparatorBuilder().setDivider(true).setSpacing(2);
}

function homePanel(guild) {
    const iconURL = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const { config } = require('./config');

    const totalEmbeds = Object.keys(config.ticketCategories ?? {}).length;
    const available   = MODULES.filter(m => m.available).map(m => `${m.emoji}  ${m.label}`).join('\n');
    const soon        = MODULES.filter(m => !m.available).map(m => `${m.emoji}  ${m.label}`).join('\n');

    const c = new ContainerBuilder().setAccentColor(0xd4a853);

    const headerText = `# ⚙️  Configuration — Eldoria\n-# Sélectionne un module dans le menu ci-dessous pour le configurer.`;

    if (iconURL) {
        c.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText))
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(iconURL))
        );
    } else {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));
    }

    c.addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### Modules disponibles\n${available}`
     ))
     .addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### Bientôt disponibles\n${soon}`
     ))
     .addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### État actuel\n` +
        `🎫  **Tickets** · ${totalEmbeds} embed${totalEmbeds !== 1 ? 's' : ''} configuré${totalEmbeds !== 1 ? 's' : ''}`
     ));

    return c;
}

function ticketsPanel(guild) {
    const iconURL = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const { config } = require('./config');

    const cats  = config.ticketCategories ?? {};
    const keys  = Object.keys(cats);
    const total = keys.length;

    const c = new ContainerBuilder().setAccentColor(0xd4a853);

    const headerText = `# 🎫  Tickets\n-# ${total} embed${total !== 1 ? 's' : ''} configuré${total !== 1 ? 's' : ''}`;

    if (iconURL) {
        c.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText))
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(iconURL))
        );
    } else {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));
    }

    if (total === 0) {
        c.addSeparatorComponents(sep())
         .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `Aucun embed de tickets configuré.\nUtilise le bouton ci-dessous pour ouvrir le panel de configuration.`
         ));
    } else {
        for (const key of keys) {
            const e      = cats[key];
            const catOk  = e.categoryId          ? '🟢' : '🔴';
            const tsOk   = e.transcriptChannelId  ? '🟢' : '🔴';
            const catRef = e.categoryId          ? `<#${e.categoryId}>`          : '—';
            const tsRef  = e.transcriptChannelId ? `<#${e.transcriptChannelId}>` : '—';

            c.addSeparatorComponents(sep())
             .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `### ${e.label}\n` +
                `${catOk}  Catégorie Discord · ${catRef}\n` +
                `${tsOk}  Transcripts · ${tsRef}\n` +
                `-# 🎫 *${e.buttonLabel}*`
             ));
        }
    }

    c.addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `-# Clique sur **Configurer** pour gérer les embeds de tickets.`
     ));

    return c;
}

function unavailablePanel(module, guild) {
    const iconURL = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const m = MODULES.find(x => x.value === module) ?? { emoji: '⚙️', label: module };

    const c = new ContainerBuilder().setAccentColor(0x36393f);

    const headerText = `# ${m.emoji}  ${m.label}\n-# Ce module n'est pas encore disponible.`;

    if (iconURL) {
        c.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText))
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(iconURL))
        );
    } else {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));
    }

    c.addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `Ce module est en cours de développement et sera disponible prochainement.\n\n` +
        `-# Sélectionne un autre module dans le menu ci-dessous.`
     ));

    return c;
}

// ─── Boutons d'action par module ──────────────────────────────────────────────

function actionRow(module) {
    if (module === 'tickets') {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('config_tickets_open')
                .setLabel('Configurer les tickets')
                .setEmoji('🎫')
                .setStyle(ButtonStyle.Primary),
        );
    }
    return null;
}

// ─── Builder principal ────────────────────────────────────────────────────────

function buildConfigMessage(module = 'home', guild = null) {
    let panel;

    if (module === 'home')        panel = homePanel(guild);
    else if (module === 'tickets') panel = ticketsPanel(guild);
    else                           panel = unavailablePanel(module, guild);

    const components = [
        configSelectMenu(module),
        panel,
    ];

    const actions = actionRow(module);
    if (actions) components.push(actions);

    return { components, flags: Flags.CV2_Ephemeral };
}

module.exports = { buildConfigMessage, MODULES };