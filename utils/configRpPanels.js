const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SectionBuilder, ThumbnailBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
} = require('discord.js');

const Flags = require('./flags');

const MODULES_RP = [
    { value: 'meteo',      label: 'Météo',              emoji: '🌦️', available: false },
    { value: 'journal',    label: 'Journal',            emoji: '📰', available: false },
    { value: 'evenements', label: 'Événements RP',      emoji: '🎭', available: false },
    { value: 'lore',       label: 'Lore & Encyclopédie',emoji: '📖', available: false },
    { value: 'rumeurs',    label: 'Rumeurs',            emoji: '🗣️', available: false },
    { value: 'economies',  label: 'Économie RP',        emoji: '💰', available: false },
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

    c.addSeparatorComponents(thinSep())
     .addActionRowComponents(selectRow(null))
     .addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### Modules RP\n` +
        `🌦️  **Météo** · *Bientôt disponible*\n` +
        `📰  **Journal** · *Bientôt disponible*\n` +
        `🎭  **Événements RP** · *Bientôt disponible*\n` +
        `📖  **Lore & Encyclopédie** · *Bientôt disponible*\n` +
        `🗣️  **Rumeurs** · *Bientôt disponible*\n` +
        `💰  **Économie RP** · *Bientôt disponible*`
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
        lore: [
            `- Constituer une encyclopédie du monde d'Eldoria`,
            `- Organiser les entrées par catégorie (lieux, factions, magie…)`,
            `- Mettre à jour le lore au fil des événements`,
            `- Rendre le lore consultable par tous les joueurs`,
        ],
        rumeurs: [
            `- Publier des rumeurs anonymes ou attribuées dans le monde`,
            `- Gérer la propagation des informations in-game`,
            `- Programmer des révélations et rebondissements`,
            `- Lier les rumeurs aux événements en cours`,
        ],
        economies: [
            `- Gérer une monnaie RP propre au serveur`,
            `- Créer des commerces et marchés in-universe`,
            `- Attribuer des revenus selon les rôles et métiers RP`,
            `- Suivre les transactions et l'économie globale du monde`,
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

// ─── Dispatcher ──────────────────────────────────────────────────────────────

function buildConfigRpMessage(module = 'home', guild = null) {
    if (!module || module === 'home') return homePanel(guild);
    return unavailablePanel(module, guild);
}

module.exports = { buildConfigRpMessage };