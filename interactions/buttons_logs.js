const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SectionBuilder, ThumbnailBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');

const Flags                   = require('../utils/flags');
const { config, saveConfig }  = require('../utils/config');
const { pending }             = require('../utils/pending');
const { autoSetupLogs }       = require('../utils/logsSetup');
const { LOG_CATEGORIES }      = require('../utils/logger');

// ─── Builder du panel Logs ────────────────────────────────────────────────────

function buildLogsPanel(guild) {
    const icon = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const logs = config.logs ?? {};
    const active = logs.active ?? false;
    const mode   = logs.mode ?? null;

    const modeStr = {
        single: `Salon unique · ${logs.channelId ? `<#${logs.channelId}>` : '*Non défini*'}`,
        multi:  'Par catégorie',
        null:   '*Non configuré*',
    }[mode] ?? '*Non configuré*';

    const c = new ContainerBuilder().setAccentColor(0x95a5a6);

    const section = new SectionBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# 📜  Logs\n-# Journalisation des événements du serveur et du bot.`
        )
    );
    if (icon) section.setThumbnailAccessory(new ThumbnailBuilder().setURL(icon));
    c.addSectionComponents(section);

    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### Configuration\n` +
        `${active ? '🟢' : '🔴'}  **Statut** · ${active ? 'Actif' : 'Inactif'}\n` +
        `⚙️  **Mode** · ${modeStr}`
     ))
     .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('logs_toggle').setLabel(active ? 'Désactiver' : 'Activer').setEmoji(active ? '🔴' : '🟢').setStyle(active ? ButtonStyle.Danger : ButtonStyle.Success),
     ));

    // Mode single
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Options de configuration`))
     .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('logs_mode_single').setLabel('Salon unique').setEmoji('📌').setStyle(mode === 'single' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('logs_mode_multi').setLabel('Par catégorie').setEmoji('📂').setStyle(mode === 'multi' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('logs_autosetup').setLabel('Créer automatiquement').setEmoji('✨').setStyle(ButtonStyle.Success),
     ));

    // Si mode multi, afficher les catégories
    if (mode === 'multi') {
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
         .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Salons par catégorie`));

        for (const [key, cat] of Object.entries(LOG_CATEGORIES)) {
            const chId = logs.channels?.[key];
            c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `${cat.emoji}  **${cat.label}** · ${chId ? `<#${chId}>` : '*Non défini*'}`
            ));
        }

        c.addActionRowComponents(new ActionRowBuilder().addComponents(
            ...Object.entries(LOG_CATEGORIES).slice(0, 4).map(([key, cat]) =>
                new ButtonBuilder().setCustomId(`logs_setchan:${key}`).setLabel(cat.label).setEmoji(cat.emoji).setStyle(ButtonStyle.Secondary)
            )
        ));
        c.addActionRowComponents(new ActionRowBuilder().addComponents(
            ...Object.entries(LOG_CATEGORIES).slice(4).map(([key, cat]) =>
                new ButtonBuilder().setCustomId(`logs_setchan:${key}`).setLabel(cat.label).setEmoji(cat.emoji).setStyle(ButtonStyle.Secondary)
            )
        ));
    }

    return c;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

async function handleButtonLogs(interaction) {
    const id = interaction.customId;

    if (id === 'logs_toggle') {
        await interaction.deferUpdate();
        if (!config.logs) config.logs = {};
        config.logs.active = !config.logs.active;
        saveConfig();
        return interaction.editReply({ components: [buildLogsPanel(interaction.guild)] });
    }

    if (id === 'logs_mode_single') {
        await interaction.deferUpdate();
        if (!config.logs) config.logs = {};
        config.logs.mode = 'single';
        saveConfig();
        // Demander le salon
        pending[interaction.user.id] = {
            type: 'logs_single_channel', token: interaction.token,
            appId: interaction.client.application.id, guildId: interaction.guildId,
        };
        const c = new ContainerBuilder().setAccentColor(0x5865f2)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `# 📌  Salon unique de logs\n-# Envoie le **#salon** ou son **ID**.`
            ));
        return interaction.editReply({ components: [c, cancelRow()] });
    }

    if (id === 'logs_mode_multi') {
        await interaction.deferUpdate();
        if (!config.logs) config.logs = {};
        config.logs.mode = 'multi';
        if (!config.logs.channels) config.logs.channels = {};
        saveConfig();
        return interaction.editReply({ components: [buildLogsPanel(interaction.guild)] });
    }

    if (id === 'logs_autosetup') {
        await interaction.deferUpdate();
        try {
            await autoSetupLogs(interaction.guild);
            return interaction.editReply({ components: [buildLogsPanel(interaction.guild)] });
        } catch (err) {
            return interaction.editReply({ content: `❌ Erreur : \`${err.message}\`` });
        }
    }

    if (id.startsWith('logs_setchan:')) {
        await interaction.deferUpdate();
        const key = id.split(':')[1];
        pending[interaction.user.id] = {
            type: `logs_channel:${key}`, token: interaction.token,
            appId: interaction.client.application.id, guildId: interaction.guildId,
        };
        const cat = LOG_CATEGORIES[key];
        const c = new ContainerBuilder().setAccentColor(0x5865f2)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `# ${cat.emoji}  Salon — ${cat.label}\n-# Envoie le **#salon** ou son **ID**.`
            ));
        return interaction.editReply({ components: [c, cancelRow()] });
    }

    if (id === 'logs_cancel') {
        await interaction.deferUpdate();
        delete pending[interaction.user.id];
        return interaction.editReply({ components: [buildLogsPanel(interaction.guild)] });
    }
}

function cancelRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('logs_cancel').setLabel('Annuler').setEmoji('✖️').setStyle(ButtonStyle.Secondary)
    );
}

module.exports = { handleButtonLogs, buildLogsPanel };