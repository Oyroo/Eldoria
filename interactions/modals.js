const { MessageFlags } = require('discord.js');
const { config, saveConfig }                 = require('../utils/config');
const { hexToInt, uniqueKey }                = require('../utils/helpers');
const { buildMainPanel, buildCategoryPanel } = require('../utils/builders');

function getGuildIcon(guild) {
    return guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
}

async function handleModal(interaction) {
    const id   = interaction.customId;
    const icon = getGuildIcon(interaction.guild);

    // ── Créer un embed ───────────────────────────────────────────────────
    if (id === 'cfg_modal_create') {
        const label       = interaction.fields.getTextInputValue('label').trim();
        const title       = interaction.fields.getTextInputValue('title').trim();
        const description = interaction.fields.getTextInputValue('description').trim();
        const colorRaw    = interaction.fields.getTextInputValue('color').trim();
        const buttonLabel = interaction.fields.getTextInputValue('button_label').trim();

        const catKey = uniqueKey(label, config.ticketCategories);
        config.ticketCategories[catKey] = {
            label,
            title,
            description,
            color:               colorRaw ? hexToInt(colorRaw) : 0x5865f2,
            buttonLabel:         buttonLabel || `Ouvrir un ticket ${label}`,
            categoryId:          null,
            transcriptChannelId: null,
        };
        saveConfig();

        const [container, actionRow] = buildCategoryPanel(catKey, null, icon);
        return interaction.update({ components: [container, actionRow], flags: MessageFlags.IsComponentsV2 });
    }

    // ── Modifier l'embed ──────────────────────────────────────
    if (id.startsWith('cfg_modal_edit:')) {
        const catKey = id.split(':')[1];
        const cat    = config.ticketCategories[catKey];
        if (!cat) return interaction.update({ components: [buildMainPanel(icon)], flags: MessageFlags.IsComponentsV2 });

        const btnLabel = interaction.fields.getTextInputValue('button_label').trim();
        cat.title       = interaction.fields.getTextInputValue('title');
        cat.description = interaction.fields.getTextInputValue('description');
        if (btnLabel) cat.buttonLabel = btnLabel;
        saveConfig();

        const [container, actionRow] = buildCategoryPanel(catKey, null, icon);
        return interaction.update({ components: [container, actionRow], flags: MessageFlags.IsComponentsV2 });
    }

    // ── Modifier la couleur ───────────────────────────────────────────────────
    if (id.startsWith('cfg_modal_color:')) {
        const catKey  = id.split(':')[1];
        const cat     = config.ticketCategories[catKey];
        if (!cat) return interaction.update({ components: [buildMainPanel(icon)], flags: MessageFlags.IsComponentsV2 });

        const colorRaw = interaction.fields.getTextInputValue('color').trim();
        cat.color = hexToInt(colorRaw);
        saveConfig();

        const [container, actionRow] = buildCategoryPanel(catKey, null, icon);
        return interaction.update({ components: [container, actionRow], flags: MessageFlags.IsComponentsV2 });
    }
}

module.exports = { handleModal };