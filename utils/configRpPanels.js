const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SectionBuilder, ThumbnailBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
} = require('discord.js');

const Flags = require('./flags');

const MODULES_RP = [
    { value: 'meteo',      label: 'Météo',              emoji: '🌦️', available: true  },
    { value: 'journal',    label: 'Journal',            emoji: '📰', available: false },
    { value: 'evenements', label: 'Événements RP',      emoji: '🎭', available: false },
];

function sep()     { return new SeparatorBuilder().setDivider(true).setSpacing(2); }
function thinSep() { return new SeparatorBuilder().setDivider(false).setSpacing(1); }

function selectRow(current = null) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('config_rp_select')
            .setPlaceholder('Choisissez un module RP…')
            .addOptions(
                MODULES_RP.map(m =>
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
            .setCustomId('config_rp_home')
            .setLabel('Accueil')
            .setEmoji('🏡')
            .setStyle(ButtonStyle.Secondary)
    );
}

// ─── Accueil ──────────────────────────────────────────────────────────────────

function homePanel(guild) {
    const icon = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const { config } = require('./config');

    const c = new ContainerBuilder().setAccentColor(0x8b5e3c);

    const section = new SectionBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# 📜  Configuration — Roleplay\n` +
            `-# Gérez tous les systèmes liés au roleplay d'Eldoria.\n` +
            `-# Sélectionnez un module dans le menu ci-dessous.`
        )
    );
    if (icon) section.setThumbnailAccessory(new ThumbnailBuilder().setURL(icon));
    c.addSectionComponents(section);

    const { METEOS } = require('./meteo');
    const meteoConf  = config.meteo ?? {};
    const meteoKey   = meteoConf.meteoActuelle;
    const meteoM     = METEOS[meteoKey];
    const meteoLine  = meteoConf.active && meteoM
        ? `${meteoM.emoji}  **Météo** · ${meteoM.label} — ${meteoM.intensite}${ meteoConf.channelId ? ` · <#${meteoConf.channelId}>` : '' }`
        : `🌦️  **Météo** · ${ meteoConf.channelId ? `<#${meteoConf.channelId}>` : 'Non configurée' }${ meteoConf.active ? '' : ' · *Inactif*' }`;

    c.addSeparatorComponents(thinSep())
     .addActionRowComponents(selectRow(null))
     .addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### Modules RP\n` +
        `${meteoLine}\n` +
        `📰  **Journal** · *Bientôt disponible*\n` +
        `🎭  **Événements RP** · *Bientôt disponible*`
     ))
     .addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `-# Ces modules sont en cours de développement et seront disponibles prochainement.`
     ));

    return { components: [c], flags: Flags.CV2_Ephemeral };
}

// ─── Builder générique pour modules indisponibles ─────────────────────────────

function unavailablePanel(module, guild) {
    const icon = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const m    = MODULES_RP.find(x => x.value === module) ?? { emoji: '⚙️', label: module };

    const descriptions = {
        meteo: [
            `- Définir des zones géographiques (forêt, ville, montagne…)`,
            `- Générer une météo dynamique par zone, mise à jour automatiquement`,
            `- Publier des bulletins météo dans un salon dédié`,
            `- Personnaliser les saisons et conditions climatiques du monde`,
        ],
        journal: [
            `- Rédiger et publier des éditions de gazette in-universe`,
            `- Programmer des parutions automatiques`,
            `- Archiver les anciens numéros`,
            `- Gérer les rédacteurs et correspondants RP`,
        ],
        evenements: [
            `- Créer et planifier des événements RP`,
            `- Publier des annonces automatiques avant le début`,
            `- Gérer les inscriptions des joueurs`,
            `- Archiver les événements passés`,
        ],
    };

    const lines = descriptions[module] ?? [`- Ce module est en cours de conception.`];

    const c = new ContainerBuilder().setAccentColor(0x8b5e3c);

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
        `Le module **${m.label}** permettra de :\n` +
        lines.join('\n') + `\n\n` +
        `-# Ce module sera disponible dans une prochaine mise à jour.`
     ))
     .addSeparatorComponents(sep());

    return { components: [c, homeButton()], flags: Flags.CV2_Ephemeral };
}

// ─── Panel Météo ─────────────────────────────────────────────────────────────

function meteoPanel(guild) {
    const { config }   = require('./config');
    const { METEOS, buildMeteoEmbed, choisirProchaineMeteo } = require('./meteo');

    const icon       = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const meteoConf  = config.meteo ?? {};
    const active     = meteoConf.active     ?? false;
    const channelId  = meteoConf.channelId  ?? null;
    const heure      = meteoConf.heure      ?? null;
    const actuelle   = meteoConf.meteoActuelle ?? null;
    const dernierEnvoi = meteoConf.dernierEnvoi ?? null;

    const statusStr  = active ? '🟢  **Actif**' : '🔴  **Inactif**';
    const channelStr = channelId ? `<#${channelId}>` : '*Non défini*';
    const heureStr   = heure ?? '*Non définie*';
    const meteoStr   = actuelle && METEOS[actuelle]
        ? `${METEOS[actuelle].emoji}  ${METEOS[actuelle].label}`
        : '*Aucune météo envoyée*';
    const dernierStr = dernierEnvoi ?? '*Jamais*';

    const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SectionBuilder,
            ThumbnailBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

    function sep()     { return new SeparatorBuilder().setDivider(true).setSpacing(2); }
    function thinSep() { return new SeparatorBuilder().setDivider(false).setSpacing(1); }

    const c = new ContainerBuilder().setAccentColor(0x8b5e3c);

    const section = new SectionBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# 🌦️  Météo
` +
            `-# Bulletin météorologique quotidien automatisé.`
        )
    );
    if (icon) section.setThumbnailAccessory(new ThumbnailBuilder().setURL(icon));
    c.addSectionComponents(section);

    c.addSeparatorComponents(thinSep())
     .addActionRowComponents(selectRow('meteo'))
     .addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### Configuration
` +
        `${statusStr}
` +
        `📢  **Salon de publication** · ${channelStr}
` +
        `🕐  **Heure d'envoi** · ${heureStr}
` +
        `🌤️  **Météo actuelle** · ${meteoStr}
` +
        `-# Dernier envoi : ${dernierStr}`
     ))
     .addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`meteo_toggle`)
                .setLabel(active ? 'Désactiver' : 'Activer')
                .setEmoji(active ? '🔴' : '🟢')
                .setStyle(active ? ButtonStyle.Danger : ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('meteo_setchannel')
                .setLabel('Salon de publication')
                .setEmoji('📢')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('meteo_setheure')
                .setLabel("Heure d'envoi")
                .setEmoji('🕐')
                .setStyle(ButtonStyle.Secondary),
        )
     )
     .addSeparatorComponents(sep())
     .addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('meteo_preview')
                .setLabel('Aperçu du rendu')
                .setEmoji('👁️')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('meteo_force')
                .setLabel('Envoyer maintenant')
                .setEmoji('📤')
                .setStyle(ButtonStyle.Primary),
        )
     );

    return {
        components: [c, homeButton()],
        flags: Flags.CV2_Ephemeral,
    };
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────

function buildConfigRpMessage(module = 'home', guild = null) {
    if (!module || module === 'home') return homePanel(guild);
    if (module === 'meteo')          return meteoPanel(guild);
    return unavailablePanel(module, guild);
}

module.exports = { buildConfigRpMessage };