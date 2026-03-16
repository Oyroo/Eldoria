const { buildConfigRpMessage } = require('../utils/configRpPanels');

async function handleSelectRp(interaction) {
    if (interaction.customId === 'config_rp_select') {
        return interaction.update(buildConfigRpMessage(interaction.values[0], interaction.guild));
    }
}

module.exports = { handleSelectRp };