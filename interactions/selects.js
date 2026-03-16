const { MessageFlags } = require('discord.js');
const { buildConfigHomePanel, buildWelcomePanel, buildMainPanel } = require('../utils/builders');

async function handleSelect(interaction) {
    if (interaction.customId !== 'config_selector') return;

    const icon = interaction.guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const [value] = interaction.values;

    switch (value) {
        case 'home':
            return interaction.update({ components: [buildConfigHomePanel(icon)], flags: MessageFlags.IsComponentsV2 });
        case 'welcome-goodbye':
            {
                const [container, actionRow] = buildWelcomePanel(icon);
                return interaction.update({ components: [container, actionRow], flags: MessageFlags.IsComponentsV2 });
            }
        case 'tickets':
            return interaction.update({ components: [buildMainPanel(icon)], flags: MessageFlags.IsComponentsV2 });
        default:
            return interaction.update({
                content: '⚠️ Cette section n’est pas encore disponible.',
                components: [buildConfigHomePanel(icon)],
                flags: MessageFlags.IsComponentsV2,
            });
    }
}

module.exports = { handleSelect };
