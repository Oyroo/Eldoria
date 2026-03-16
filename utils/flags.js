// Valeurs hardcodées car MessageFlags.IsComponentsV2
// n'est pas toujours exporté selon la version de discord.js

module.exports = {
    Ephemeral:     64,
    CV2:           1 << 15,           // 32768
    CV2_Ephemeral: (1 << 15) | 64,    // 32832
};