const { buildConfigMessage } = require('../utils/configPanels');

async function handleSelect(interaction) {
    if (interaction.customId === 'config_select') {
        return interaction.update(buildConfigMessage(interaction.values[0], interaction.guild));
    }
}

module.exports = { handleSelect };