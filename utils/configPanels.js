const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SectionBuilder, ThumbnailBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
} = require('discord.js');

const Flags = require('./flags');

const GOLD = 0xd4a853;
const GREY = 0x2b2d31;

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

function selectMenu(current = null) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('config_select')
            .setPlaceholder('Choisir un module…')
            .addOptions(
                MODULES.map(m =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(m.label)
                        .setValue(m.value)
                        .setEmoji(m.emoji)
                        .setDefault(m.value === current)
                        .setDescription(m.available ? 'Disponible' : 'Bientôt disponible')
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

// ─── Accueil ──────────────────────────────────────────────────────────────────

function homePanel(guild) {
    const icon  = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const { config } = require('./config');
    const total = Object.keys(config.ticketCategories ?? {}).length;

    const c = new ContainerBuilder().setAccentColor(GOLD);

    const header = `# ⚙️  Configuration\n-# Sélectionne un module dans le menu ci-dessous.`;

    if (icon) {
        c.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(header))
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(icon))
        );
    } else {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(header));
    }

    c.addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        [
            `🎫  **Tickets** · ${total} embed${total !== 1 ? 's' : ''} configuré${total !== 1 ? 's' : ''}`,
            `🔨  **Modération** · *Bientôt disponible*`,
            `🗃️  **Logs** · *Bientôt disponible*`,
            `👋  **Arrivées & départs** · *Bientôt disponible*`,
        ].join('\n')
     ));

    return {
        components: [selectMenu(null), c],
        flags: Flags.CV2_Ephemeral,
    };
}

// ─── Tickets ──────────────────────────────────────────────────────────────────

function ticketsPanel(guild) {
    const icon   = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const { config } = require('./config');
    const cats   = config.ticketCategories ?? {};
    const keys   = Object.keys(cats);
    const total  = keys.length;

    const c = new ContainerBuilder().setAccentColor(GOLD);

    const header = `# 🎫  Tickets\n-# ${total === 0 ? 'Aucun embed configuré' : `${total} embed${total !== 1 ? 's' : ''} configuré${total !== 1 ? 's' : ''}`}`;

    if (icon) {
        c.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(header))
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(icon))
        );
    } else {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(header));
    }

    if (total === 0) {
        c.addSeparatorComponents(sep())
         .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `Aucun embed de tickets configuré.\n-# Utilise le bouton ci-dessous pour commencer.`
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
                `${catOk}  Catégorie · ${catRef}\n` +
                `${tsOk}  Transcripts · ${tsRef}\n` +
                `-# 🎫 *${e.buttonLabel}*`
             ));
        }
    }

    c.addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `-# Clique sur **Configurer** pour gérer les embeds de tickets.`
     ));

    const configRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('config_tickets_open')
            .setLabel('Configurer')
            .setEmoji('✏️')
            .setStyle(ButtonStyle.Primary),
    );

    return {
        components: [selectMenu('tickets'), c, homeButton(), configRow],
        flags: Flags.CV2_Ephemeral,
    };
}

// ─── Module indisponible ──────────────────────────────────────────────────────

function unavailablePanel(module, guild) {
    const icon = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const m    = MODULES.find(x => x.value === module) ?? { emoji: '⚙️', label: module };

    const c = new ContainerBuilder().setAccentColor(GREY);

    const header = `# ${m.emoji}  ${m.label}\n-# Ce module n'est pas encore disponible.`;

    if (icon) {
        c.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(header))
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(icon))
        );
    } else {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(header));
    }

    c.addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `Ce module est en cours de développement.\n-# Reviens plus tard ou sélectionne un autre module.`
     ));

    return {
        components: [selectMenu(module), c, homeButton()],
        flags: Flags.CV2_Ephemeral,
    };
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────

function buildConfigMessage(module = 'home', guild = null) {
    if (module === 'home')         return homePanel(guild);
    if (module === 'tickets')      return ticketsPanel(guild);
    return unavailablePanel(module, guild);
}

module.exports = { buildConfigMessage };