const {
    ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SectionBuilder, ThumbnailBuilder,
    ButtonBuilder, ButtonStyle,
} = require('discord.js');

const { config, saveConfig } = require('../utils/config');

const CV2 = 1 << 15;
const EPHEMERAL = 64;
const CV2_EPHEMERAL = CV2 | EPHEMERAL;

// ─── Panel principal ──────────────────────────────────────────────────────────

function buildWelcomePanel(guild) {
    const icon = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const wc = config.welcome ?? {};

    const active = wc.active ?? false;
    const channelStr = wc.channelId ? `<#${wc.channelId}>` : '*Non défini*';
    const roleStr = wc.roleId ? `<@&${wc.roleId}>` : '*Aucun*';
    const msgStr = wc.message
        ? `\`${wc.message.slice(0, 60)}${wc.message.length > 60 ? '…' : ''}\``
        : '*Aucun*';

    const genActive = wc.generalActive ?? false;
    const genChan = wc.generalChannelId ? `<#${wc.generalChannelId}>` : '*Non défini*';

    const depActive = wc.departActive ?? false;
    const depChan = wc.departChannelId ? `<#${wc.departChannelId}>` : '*Non défini*';

    const c = new ContainerBuilder().setAccentColor(0xd4a853);

    // Section principale
    const section = new SectionBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# 🚪  Arrivées & départs\n-# Messages de bienvenue et de départ automatiques.`
        )
    );
    if (icon) section.setThumbnailAccessory(new ThumbnailBuilder().setURL(icon));
    c.addSectionComponents(section);

    // ── Banner
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### 🖼️  Banner de bienvenue\n${active ? '🟢 Actif' : '🔴 Inactif'}\n📢 ${channelStr}\n🎭 ${roleStr}\n💬 ${msgStr}`
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

    // ── Général
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### 💬  Message d'accueil général\n${genActive ? '🟢 Actif' : '🔴 Inactif'}\n📢 ${genChan}`
     ))
     .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('welcome_gen_toggle')
            .setLabel(genActive ? 'Désactiver' : 'Activer')
            .setEmoji(genActive ? '🔴' : '🟢')
            .setStyle(genActive ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder().setCustomId('welcome_gen_setchannel')
            .setLabel('Salon').setEmoji('📢').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('welcome_gen_edit')
            .setLabel('Modifier le message CV2').setEmoji('✏️').setStyle(ButtonStyle.Primary),
     ));

    // ── Départ
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### 👋  Message de départ\n${depActive ? '🟢 Actif' : '🔴 Inactif'}\n📢 ${depChan}`
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

// ─── BUTTON HANDLER ──────────────────────────────────────────────────────────

async function handleButtonWelcome(interaction) {
    const id = interaction.customId;
    if (!config.welcome) config.welcome = {};

    if (id === 'welcome_toggle') {
        await interaction.deferUpdate();
        config.welcome.active = !config.welcome.active;
        saveConfig();
        return interaction.editReply({ components: [buildWelcomePanel(interaction.guild)], flags: CV2 });
    }

    if (id === 'welcome_gen_toggle') {
        await interaction.deferUpdate();
        config.welcome.generalActive = !config.welcome.generalActive;
        saveConfig();
        return interaction.editReply({ components: [buildWelcomePanel(interaction.guild)], flags: CV2 });
    }

    if (id === 'welcome_dep_toggle') {
        await interaction.deferUpdate();
        config.welcome.departActive = !config.welcome.departActive;
        saveConfig();
        return interaction.editReply({ components: [buildWelcomePanel(interaction.guild)], flags: CV2 });
    }
}

// ─── MODAL HANDLER ───────────────────────────────────────────────────────────

async function handleModalWelcome(interaction) {
    // vide pour l’instant
}

module.exports = {
    handleButtonWelcome,
    handleModalWelcome,
    buildWelcomePanel,
};