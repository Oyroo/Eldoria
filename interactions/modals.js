const { MessageFlags } = require('discord.js');
const { config, saveConfig } = require('../utils/config');
const { hexToInt, uniqueKey } = require('../utils/helpers');
const { buildMainPanel, buildCategoryPanel } = require('../utils/builders');

async function handleModal(interaction) {
    const id = interaction.customId;

    // ── Créer une nouvelle catégorie ──────────────────────────────────────────
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

        // Atterrir directement sur la page de la nouvelle catégorie
        const [container, actionRow] = buildCategoryPanel(catKey);
        return interaction.update({
            components: [container, actionRow],
            flags:      MessageFlags.IsComponentsV2,
        });
    }

    // ── Modifier une catégorie existante ──────────────────────────────────────
    if (id.startsWith('cfg_modal_edit:')) {
        const catKey = id.split(':')[1];
        const cat    = config.ticketCategories[catKey];

        if (!cat)
            return interaction.update({
                components: [buildMainPanel()],
                flags:      MessageFlags.IsComponentsV2,
            });

        const colorRaw = interaction.fields.getTextInputValue('color').trim();
        const btnLabel = interaction.fields.getTextInputValue('button_label').trim();

        cat.title       = interaction.fields.getTextInputValue('title');
        cat.description = interaction.fields.getTextInputValue('description');
        if (colorRaw) cat.color       = hexToInt(colorRaw);
        if (btnLabel) cat.buttonLabel = btnLabel;
        saveConfig();

        // Revenir sur la page catégorie avec l'aperçu mis à jour
        const [container, actionRow] = buildCategoryPanel(catKey);
        return interaction.update({
            components: [container, actionRow],
            flags:      MessageFlags.IsComponentsV2,
        });
    }
}

module.exports = { handleModal };