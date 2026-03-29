const {
    ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SectionBuilder, ThumbnailBuilder,
    ButtonBuilder, ButtonStyle,
} = require('discord.js');

const Flags                     = require('../utils/flags');
const { config, saveConfig }    = require('../utils/config');
const { pending }               = require('../utils/pending');
const { generateWelcomeBanner } = require('../utils/welcomeImage');

const CV2           = 1 << 15;
const EPHEMERAL     = 64;
const CV2_EPHEMERAL = CV2 | EPHEMERAL;

// ─── Panel principal ──────────────────────────────────────────────────────────

function buildWelcomePanel(guild) {
    const icon = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const wc   = config.welcome ?? {};

    // Banner
    const active     = wc.active ?? false;
    const channelStr = wc.channelId ? `<#${wc.channelId}>` : '*Non défini*';
    const roleStr    = wc.roleId ? `<@&${wc.roleId}>` : '*Aucun*';
    const msgStr     = wc.message
        ? `\`${wc.message.slice(0, 60)}${wc.message.length > 60 ? '…' : ''}\``
        : '*Aucun*';

    // Message général d'accueil
    const genActive  = wc?.generalActive ?? false;
    const genChan    = wc?.generalChannelId ? `<#${wc.generalChannelId}>` : '*Non défini*';

    // Message de départ
    const depActive  = wc?.departActive ?? false;
    const depChan    = wc?.departChannelId ? `<#${wc.departChannelId}>` : '*Non défini*';

    const c = new ContainerBuilder().setAccentColor(0xd4a853);

    const section = new SectionBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# 🚪  Arrivées & départs\n` +
            `-# Messages de bienvenue et de départ automatiques.`
        )
    );
    if (icon) section.setThumbnailAccessory(new ThumbnailBuilder().setURL(icon));
    c.addSectionComponents(section);

    // ── Banner bienvenue ──────────────────────────────────────────────────────
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### 🖼️  Banner de bienvenue\n` +
        `${active ? '🟢' : '🔴'}  **Statut** · ${active ? 'Actif' : 'Inactif'}\n` +
        `📢  **Salon** · ${channelStr}\n` +
        `🎭  **Rôle automatique** · ${roleStr}\n` +
        `💬  **Message sous le banner** · ${msgStr}`
     ))
     .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('welcome_toggle')
            .setLabel(active ? 'Désactiver' : 'Activer')
            .setEmoji(active ? '🔴' : '🟢')
            .setStyle(active ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder().setCustomId('welcome_setchannel')
            .setLabel('Salon').setEmoji('📢').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('welcome_setrole')
            .setLabel('Rôle').setEmoji('🎭').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('welcome_setmessage')
            .setLabel('Message').setEmoji('💬').setStyle(ButtonStyle.Secondary),
     ))
     .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('welcome_preview')
            .setLabel('Aperçu banner').setEmoji('👁️').setStyle(ButtonStyle.Secondary),
     ));

    // ── Message d'accueil dans le général ─────────────────────────────────────
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### 💬  Message d'accueil dans le général\n` +
        `${genActive ? '🟢' : '🔴'}  **Statut** · ${genActive ? 'Actif' : 'Inactif'}\n` +
        `📢  **Salon** · ${genChan}`
     ))
     .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('welcome_gen_toggle')
            .setLabel(genActive ? 'Désactiver' : 'Activer') // ✅ FIX ICI
            .setEmoji(genActive ? '🔴' : '🟢')
            .setStyle(genActive ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder().setCustomId('welcome_gen_setchannel')
            .setLabel('Salon').setEmoji('📢').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('welcome_gen_edit')
            .setLabel('Modifier le message CV2').setEmoji('✏️').setStyle(ButtonStyle.Primary),
     ));

    // ── Message de départ ─────────────────────────────────────────────────────
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### 👋  Message de départ\n` +
        `${depActive ? '🟢' : '🔴'}  **Statut** · ${depActive ? 'Actif' : 'Inactif'}\n` +
        `📢  **Salon** · ${depChan}`
     ))
     .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('welcome_dep_toggle')
            .setLabel(depActive ? 'Désactiver' : 'Activer')
            .setEmoji(depActive ? '🔴' : '🟢')
            .setStyle(depActive ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder().setCustomId('welcome_dep_setchannel')
            .setLabel('Salon').setEmoji('📢').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('welcome_dep_edit')
            .setLabel('Modifier le message CV2').setEmoji('✏️').setStyle(ButtonStyle.Primary),
     ));

    return c;
}