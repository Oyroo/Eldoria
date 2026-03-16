const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { buildConfigHomePanel, buildWelcomePanel, buildMainPanel, panelToMessageOptions } = require('../utils/builders');
const { createWelcomeImage } = require('../utils/welcomeImage');
const { config } = require('../utils/config');

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

async function handleSelect(interaction) {
    if (interaction.customId !== 'config_selector') return;

    const icon = interaction.guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const [value] = interaction.values;

    switch (value) {
        case 'home':
            return interaction.update(panelToMessageOptions(buildConfigHomePanel(icon)));
        case 'welcome-goodbye':
            {
                const [container, actionRow] = buildWelcomePanel(icon);
                const { embed, files } = await generateWelcomePreview(interaction, 'welcome');

                await interaction.update(panelToMessageOptions([container, actionRow]));

                return interaction.followUp({
                    embeds: [embed],
                    files,
                    ephemeral: true,
                });
            }
        case 'tickets':
            return interaction.update(panelToMessageOptions(buildMainPanel(icon)));
        default: {
            const warning = new EmbedBuilder()
                .setColor(0xED4245)
                .setTitle('⚠️ Section non disponible')
                .setDescription('Cette section n’est pas encore disponible dans ce panel.');

            await interaction.update(panelToMessageOptions(buildConfigHomePanel(icon)));

            return interaction.followUp({
                embeds:    [warning],
                ephemeral: true,
            });
        }
    }
}

module.exports = { handleSelect };
