const { buildConfigMessage } = require('../utils/configPanels');

async function handleSelect(interaction) {
    const id = interaction.customId;

    if (id === 'config_select') {
        const module = interaction.values[0];
        return interaction.update(buildConfigMessage(module, interaction.guild));
    }
}

module.exports = { handleSelect };