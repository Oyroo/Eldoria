const Flags = require('../utils/flags');
const { config, saveConfig }              = require('../utils/config');
const { hexToInt, uniqueKey }             = require('../utils/helpers');
const { mainPanel, categoryPanel }        = require('../utils/builders');

function icon(guild) { return guild?.iconURL({ size: 256, extension: 'png' }) ?? null; }

async function handleModal(interaction) {
    const id = interaction.customId;
    const ic = icon(interaction.guild);

    // Créer un embed
    if (id === 'modal_create') {
        const label       = interaction.fields.getTextInputValue('label').trim();
        const title       = interaction.fields.getTextInputValue('title').trim();
        const description = interaction.fields.getTextInputValue('description').trim();
        const colorRaw    = interaction.fields.getTextInputValue('color').trim();
        const buttonLabel = interaction.fields.getTextInputValue('button_label').trim();

        const key = uniqueKey(label, config.ticketCategories);
        config.ticketCategories[key] = {
            label, title, description,
            color:               colorRaw ? hexToInt(colorRaw) : 0x5865f2,
            buttonLabel:         buttonLabel || `Ouvrir un ticket`,
            categoryId:          null,
            transcriptChannelId: null,
        };
        saveConfig();

        const [c, row] = categoryPanel(key, null, ic);
        return interaction.update({ components: [c, row], flags: Flags.CV2 });
    }

    // Modifier un embed
    if (id.startsWith('modal_edit:')) {
        const key = id.split(':')[1];
        const e   = config.ticketCategories[key];
        if (!e) return interaction.update({ components: [mainPanel(ic)], flags: Flags.CV2 });

        e.title       = interaction.fields.getTextInputValue('title');
        e.description = interaction.fields.getTextInputValue('description');
        const btn = interaction.fields.getTextInputValue('button_label').trim();
        if (btn) e.buttonLabel = btn;
        saveConfig();

        const [c, row] = categoryPanel(key, null, ic);
        return interaction.update({ components: [c, row], flags: Flags.CV2 });
    }

    // Modifier la couleur
    if (id.startsWith('modal_color:')) {
        const key = id.split(':')[1];
        const e   = config.ticketCategories[key];
        if (!e) return interaction.update({ components: [mainPanel(ic)], flags: Flags.CV2 });

        e.color = hexToInt(interaction.fields.getTextInputValue('color').trim());
        saveConfig();

        const [c, row] = categoryPanel(key, null, ic);
        return interaction.update({ components: [c, row], flags: Flags.CV2 });
    }
}

module.exports = { handleModal };