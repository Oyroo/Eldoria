const { Routes, MessageFlags } = require('discord.js');
const client = require('../client');

// Stocke les saisies en attente par userId
// { [userId]: { type, catKey, token, appId, guildId } }
const pendingInputs = {};

// Édite le panel de config éphémère via le token d'interaction
async function patchPanel(token, appId, panel) {
    try {
        await client.rest.patch(
            Routes.webhookMessage(appId, token),
            {
                body: {
                    components: [panel.toJSON()],
                    flags:      MessageFlags.IsComponentsV2,
                },
            }
        );
    } catch (err) {
        console.error('patchPanel error:', err.message);
    }
}

module.exports = { pendingInputs, patchPanel };