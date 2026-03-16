const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { config, saveConfig }                 = require('../utils/config');
const { hexToInt, uniqueKey }                = require('../utils/helpers');
const { buildMainPanel, buildCategoryPanel, buildWelcomePanel, panelToMessageOptions } = require('../utils/builders');
const { createWelcomeImage } = require('../utils/welcomeImage');

function formatWelcomeTemplate(template, member, guild) {
    return template
        .replace(/\{user\}/g, member.user.tag)
        .replace(/\{guild\}/g, guild.name);
}

async function generateWelcomePreview(interaction, type = 'welcome') {
    const member = interaction.guild?.members?.me ?? interaction.member ?? interaction.user;
    const text = type === 'welcome'
        ? formatWelcomeTemplate(config.welcomeText ?? '', member, interaction.guild)
        : formatWelcomeTemplate(config.leaveText ?? '', member, interaction.guild);

    const buffer = await createWelcomeImage(member, type, { message: text }).catch(() => null);
    const embed = new EmbedBuilder()
        .setTitle(type === 'welcome' ? 'Aperçu : message de bienvenue' : 'Aperçu : message de départ')
        .setDescription('Voici un aperçu de l’image générée. Utilise les boutons ci-dessous pour modifier le texte et rafraîchir l’aperçu.')
        .setColor(type === 'welcome' ? 0x5DB3FF : 0xFF6B6B);

    const files = [];
    if (buffer) {
        files.push(new AttachmentBuilder(buffer, { name: 'preview.png' }));
        embed.setImage('attachment://preview.png');
    }

    return { embed, files };
}

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
        return interaction.update(panelToMessageOptions([container, actionRow]));
    }

    // ── Modifier l'embed ──────────────────────────────────────
    if (id.startsWith('cfg_modal_edit:')) {
        const catKey = id.split(':')[1];
        const cat    = config.ticketCategories[catKey];
        if (!cat) return interaction.update(panelToMessageOptions(buildMainPanel(icon)));

        const btnLabel = interaction.fields.getTextInputValue('button_label').trim();
        cat.title       = interaction.fields.getTextInputValue('title');
        cat.description = interaction.fields.getTextInputValue('description');
        if (btnLabel) cat.buttonLabel = btnLabel;
        saveConfig();

        const [container, actionRow] = buildCategoryPanel(catKey, null, icon);
        return interaction.update(panelToMessageOptions([container, actionRow]));
    }

    // ── Modifier la couleur ───────────────────────────────────────────────────
    if (id.startsWith('cfg_modal_color:')) {
        const catKey  = id.split(':')[1];
        const cat     = config.ticketCategories[catKey];
        if (!cat) return interaction.update(panelToMessageOptions(buildMainPanel(icon)));

        const colorRaw = interaction.fields.getTextInputValue('color').trim();
        cat.color = hexToInt(colorRaw);
        saveConfig();

        const [container, actionRow] = buildCategoryPanel(catKey, null, icon);
        return interaction.update(panelToMessageOptions([container, actionRow]));
    }

    // ── Modifier le texte bienvenue/départ ─────────────────────────────────────
    if (id.startsWith('cfg_modal_welcome:')) {
        const type = id.split(':')[1];
        const value = interaction.fields.getTextInputValue('message').trim();
        if (type === 'leave') {
            config.leaveText = value;
        } else {
            config.welcomeText = value;
        }
        saveConfig();

        const [container, actionRow] = buildWelcomePanel(icon);
        const { embed, files } = await generateWelcomePreview(interaction, type === 'leave' ? 'leave' : 'welcome');

        await interaction.update(panelToMessageOptions([container, actionRow]));

        return interaction.followUp({
            embeds:    [embed],
            files,
            ephemeral: true,
        });
    }
}

module.exports = { handleModal };