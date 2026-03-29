const {
    ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SectionBuilder, ThumbnailBuilder,
    ButtonBuilder, ButtonStyle,
} = require('discord.js');

const { config, saveConfig } = require('../utils/config');
const { pending } = require('../utils/pending');
const { generateWelcomeBanner } = require('../utils/welcomeImage');

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

    const genActive = wc?.generalActive ?? false;
    const genChan = wc?.generalChannelId ? `<#${wc.generalChannelId}>` : '*Non défini*';

    const depActive = wc?.departActive ?? false;
    const depChan = wc?.departChannelId ? `<#${wc.departChannelId}>` : '*Non défini*';

    const c = new ContainerBuilder().setAccentColor(0xd4a853);

    const section = new SectionBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# 🚪  Arrivées & départs\n-# Messages automatiques.`
        )
    );

    if (icon) section.setThumbnailAccessory(new ThumbnailBuilder().setURL(icon));
    c.addSectionComponents(section);

    // Banner
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### 🖼️ Banner\n${active ? '🟢' : '🔴'} ${active ? 'Actif' : 'Inactif'}\n📢 ${channelStr}`
     ))
     .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('welcome_toggle')
            .setLabel(active ? 'Désactiver' : 'Activer')
            .setStyle(active ? ButtonStyle.Danger : ButtonStyle.Success),
     ));

    // Général
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### 💬 Général\n${genActive ? '🟢' : '🔴'} ${genActive ? 'Actif' : 'Inactif'}\n📢 ${genChan}`
     ))
     .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('welcome_gen_toggle')
            .setLabel(genActive ? 'Désactiver' : 'Activer')
            .setStyle(genActive ? ButtonStyle.Danger : ButtonStyle.Success),
     ));

    // Départ
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### 👋 Départ\n${depActive ? '🟢' : '🔴'} ${depActive ? 'Actif' : 'Inactif'}\n📢 ${depChan}`
     ))
     .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('welcome_dep_toggle')
            .setLabel(depActive ? 'Désactiver' : 'Activer')
            .setStyle(depActive ? ButtonStyle.Danger : ButtonStyle.Success),
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
        return interaction.editReply({ components: [buildWelcomePanel(interaction.guild)] });
    }

    if (id === 'welcome_gen_toggle') {
        await interaction.deferUpdate();
        config.welcome.generalActive = !config.welcome.generalActive;
        saveConfig();
        return interaction.editReply({ components: [buildWelcomePanel(interaction.guild)] });
    }

    if (id === 'welcome_dep_toggle') {
        await interaction.deferUpdate();
        config.welcome.departActive = !config.welcome.departActive;
        saveConfig();
        return interaction.editReply({ components: [buildWelcomePanel(interaction.guild)] });
    }
}

// ─── MODAL HANDLER ───────────────────────────────────────────────────────────

async function handleModalWelcome(interaction) {
    // (vide pour l’instant mais obligatoire pour éviter l’erreur)
}

// ✅ EXPORT FIX (LE PLUS IMPORTANT)
module.exports = {
    handleButtonWelcome,
    handleModalWelcome,
    buildWelcomePanel
};