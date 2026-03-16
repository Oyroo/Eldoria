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

function sep()      { return new SeparatorBuilder().setDivider(true).setSpacing(2); }
function thinSep()  { return new SeparatorBuilder().setDivider(false).setSpacing(1); }

function selectRow(current = null) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('config_select')
            .setPlaceholder('Choisissez une catégorie…')
            .addOptions(
                MODULES.map(m =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(m.label)
                        .setValue(m.value)
                        .setEmoji(m.emoji)
                        .setDefault(m.value === current)
                        .setDescription(m.available ? 'Configurer ce module' : 'Bientôt disponible')
                )
            )
    );
}

function homeButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('config_home')
            .setLabel('Accueil')
            .setEmoji('🏡')
            .setStyle(ButtonStyle.Secondary)
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
    const { config } = require('./config');
    const totalEmbeds = Object.keys(config.ticketCategories ?? {}).length;
    const openTickets = Object.keys(require('./tickets').get() ?? {}).length;

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

    c.addSeparatorComponents(thinSep())
     .addActionRowComponents(selectRow(null))
     .addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### État des modules\n` +
        `🎫  **Tickets** · ${totalEmbeds} embed${totalEmbeds !== 1 ? 's' : ''}, ${openTickets} ticket${openTickets !== 1 ? 's' : ''} ouverts\n` +
        `🔨  **Modération** · *Bientôt disponible*\n` +
        `🗃️  **Logs** · *Bientôt disponible*\n` +
        `👋  **Arrivées & départs** · *Bientôt disponible*\n` +
        `📈  **Niveaux** · *Bientôt disponible*\n` +
        `🏷️  **Rôles automatiques** · *Bientôt disponible*\n` +
        `🔘  **Rôles-Réactions** · *Bientôt disponible*\n` +
        `🚨  **Signalements** · *Bientôt disponible*`
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
            `-# Gérez les embeds et paramètres du système de tickets.`
        )
    );
    if (icon) section.setThumbnailAccessory(new ThumbnailBuilder().setURL(icon));
    c.addSectionComponents(section);

    c.addSeparatorComponents(thinSep())
     .addActionRowComponents(selectRow('tickets'))
     .addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `> **Embeds configurés** : ${total}\n` +
        `> **Tickets actuellement ouverts** : ${openCount}`
     ));

    if (total > 0) {
        c.addSeparatorComponents(sep())
         .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Embeds actifs`));

        for (const key of keys) {
            const e   = cats[key];
            const catOk = e.categoryId          ? '🟢' : '🔴';
            const tsOk  = e.transcriptChannelId ? '🟢' : '🔴';
            const cat   = e.categoryId          ? `<#${e.categoryId}>`          : '*Non définie*';
            const ts    = e.transcriptChannelId ? `<#${e.transcriptChannelId}>` : '*Non défini*';

            c.addSeparatorComponents(thinSep())
             .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `**${e.label}**\n` +
                `${catOk}  Catégorie : ${cat}\n` +
                `${tsOk}  Transcripts : ${ts}\n` +
                `-# 🎫 *${e.buttonLabel}*`
             ));
        }
    } else {
        c.addSeparatorComponents(sep())
         .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `> ℹ️  Aucun embed configuré.\n> Utilisez le bouton **Gérer** ci-dessous pour commencer.`
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
     );

    return {
        components: [c, homeButton()],
        flags: Flags.CV2_Ephemeral,
    };
}

// ─── Module indisponible ──────────────────────────────────────────────────────

function unavailablePanel(module, guild) {
    const icon = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const m    = MODULES.find(x => x.value === module) ?? { emoji: '⚙️', label: module };

    const c = new ContainerBuilder().setAccentColor(0x4f545c);

    const section = new SectionBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# ${m.emoji}  ${m.label}\n` +
            `-# Ce module est en cours de développement.`
        )
    );
    if (icon) section.setThumbnailAccessory(new ThumbnailBuilder().setURL(icon));
    c.addSectionComponents(section);

    c.addSeparatorComponents(thinSep())
     .addActionRowComponents(selectRow(module))
     .addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### 🔧  Module en développement\n\n` +
        `Le module **${m.label}** n'est pas encore disponible sur Eldoria.\n\n` +
        `Il sera ajouté dans une prochaine mise à jour. En attendant, tu peux :\n` +
        `- Configurer les modules déjà disponibles\n` +
        `- Revenir à l'accueil via le bouton ci-dessous`
     ))
     .addSeparatorComponents(sep());

    return {
        components: [c, homeButton()],
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