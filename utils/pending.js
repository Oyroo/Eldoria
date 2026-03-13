const { Routes, MessageFlags } = require('discord.js');
const client   = require('../client');
const { buildConfigPanel } = require('./builders');

// { [userId]: { type, catKey, token, appId, guildId } }
const pendingInputs = {};

async function patchPanel(token, appId, errorMsg = null) {
    try {
        await client.rest.patch(
            Routes.webhookMessage(appId, token),
            {
                body: {
                    components: [buildConfigPanel(errorMsg).toJSON()],
                    flags: MessageFlags.IsComponentsV2,
                },
            }
        );
    } catch (err) {
        console.error('patchPanel error:', err.message);
    }
}

module.exports = { pendingInputs, patchPanel };