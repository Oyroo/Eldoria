const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SectionBuilder, ThumbnailBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
} = require('discord.js');

const Flags = require('./flags');

// ─── Modules ──────────────────────────────────────────────────────────────────

const MODULES = [
    { value: 'home',       label: 'Accueil',            emoji: '🏡', available: true  },
    { value: 'tickets',    label: 'Tickets',            emoji: '🎫', available: true  },
    { value: 'moderation', label: 'Modération',         emoji: '🔨', available: false },
    { value: 'logs',       label: 'Logs',               emoji: '🗃️', available: false },
    { value: 'welcome',    label: 'Arrivées & départs', emoji: '👋', available: false },
    { value: 'autorole',   label: 'Rôles automatiques', emoji: '🏷️', available: false },
    { value: 'levels',     label: 'Niveaux',            emoji: '📈', available: false },
    { value: 'rolereact',  label: 'Rôles-Réactions',   emoji: '🔘', available: false },
    { value: 'report',     label: 'Signalements',       emoji: '🚨', available: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sep() { return new SeparatorBuilder().setDivider(true).setSpacing(2); }

function selectRow(current = 'home') {
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

// Boutons liens en bas (comme DraftBot : Panel Web / Support / Docs)
function linksRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Link).setURL('https://discord.gg/').setLabel('Support Discord'),
        new ButtonBuilder().setStyle(ButtonStyle.Link).setURL('https://github.com/').setLabel('GitHub'),
    );
}

// ─── Accueil ──────────────────────────────────────────────────────────────────

function homePanel(guild) {
    const icon       = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const guildName  = guild?.name ?? 'Serveur';
    const memberCount = guild?.memberCount?.toLocaleString('fr-FR') ?? '—';
    const createdAt  = guild?.createdAt
        ? `<t:${Math.floor(guild.createdAt.getTime() / 1000)}:D>`
        : '—';

    const { config } = require('./config');
    const totalEmbeds = Object.keys(config.ticketCategories ?? {}).length;

    const c = new ContainerBuilder().setAccentColor(0xd4a853);

    const headerText =
        `# ⚙️  Configuration de ${guildName}\n` +
        `Bienvenue dans le panel de configuration d'Eldoria.\n` +
        `Grâce à cette commande, vous pourrez configurer les différents systèmes proposés dans le sélecteur ci-dessus.`;

    if (icon) {
        c.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText))
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(icon))
        );
    } else {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));
    }

    c.addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### Informations du serveur\n` +
        `> 👥  **Membres** : ${memberCount}\n` +
        `> 📅  **Créé le** : ${createdAt}`
     ))
     .addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### État des modules\n` +
        `🎫  **Tickets** — ${totalEmbeds} embed${totalEmbeds !== 1 ? 's' : ''} configuré${totalEmbeds !== 1 ? 's' : ''}\n` +
        `🔨  **Modération** — *Bientôt disponible*\n` +
        `🗃️  **Logs** — *Bientôt disponible*\n` +
        `👋  **Arrivées & départs** — *Bientôt disponible*\n` +
        `📈  **Niveaux** — *Bientôt disponible*`
     ));

    return {
        components: [selectRow('home'), c, linksRow()],
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

    const c = new ContainerBuilder().setAccentColor(0xd4a853);

    const headerText =
        `# 🎫  Tickets\n` +
        `Configurez le système de tickets de votre serveur.\n` +
        `Chaque embed correspond à un type de demande avec ses propres paramètres.`;

    if (icon) {
        c.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText))
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(icon))
        );
    } else {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));
    }

    c.addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### Paramètres\n` +
        `> **Embeds configurés** : ${total}\n` +
        `> **Tickets ouverts** : ${Object.keys(require('./tickets').get() ?? {}).length}`
     ));

    if (total > 0) {
        c.addSeparatorComponents(sep())
         .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Embeds actifs`));

        for (const key of keys) {
            const e      = cats[key];
            const catOk  = e.categoryId          ? '🟢' : '🔴';
            const tsOk   = e.transcriptChannelId  ? '🟢' : '🔴';
            const catRef = e.categoryId          ? `<#${e.categoryId}>`          : '*Non définie*';
            const tsRef  = e.transcriptChannelId ? `<#${e.transcriptChannelId}>` : '*Non défini*';

            c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `\n**${e.label}**\n` +
                `${catOk} Catégorie · ${catRef}  ${tsOk} Transcripts · ${tsRef}\n` +
                `-# 🎫 *${e.buttonLabel}*`
            ));
        }
    } else {
        c.addSeparatorComponents(sep())
         .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `> ℹ️  Aucun embed configuré. Utilise le bouton ci-dessous pour commencer.`
         ));
    }

    const configRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('config_tickets_open')
            .setLabel('Gérer les embeds de tickets')
            .setEmoji('✏️')
            .setStyle(ButtonStyle.Primary),
    );

    return {
        components: [selectRow('tickets'), c, configRow, linksRow()],
        flags: Flags.CV2_Ephemeral,
    };
}

// ─── Module indisponible ──────────────────────────────────────────────────────

function unavailablePanel(module, guild) {
    const icon = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const m    = MODULES.find(x => x.value === module) ?? { emoji: '⚙️', label: module };

    const c = new ContainerBuilder().setAccentColor(0x4f545c);

    const headerText =
        `# ${m.emoji}  ${m.label}\n` +
        `Ce module n'est pas encore disponible sur Eldoria.`;

    if (icon) {
        c.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText))
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(icon))
        );
    } else {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));
    }

    c.addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `> Ce module est en cours de développement et sera disponible prochainement.\n` +
        `> Sélectionne un autre module dans le menu ci-dessus.`
     ));

    return {
        components: [selectRow(module), c, linksRow()],
        flags: Flags.CV2_Ephemeral,
    };
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────

function buildConfigMessage(module = 'home', guild = null) {
    if (module === 'home')    return homePanel(guild);
    if (module === 'tickets') return ticketsPanel(guild);
    return unavailablePanel(module, guild);
}

module.exports = { buildConfigMessage };