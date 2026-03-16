const { Routes, MessageFlags } = require('discord.js');
const client = require('../client');

// { [userId]: { type, catKey, token, appId, guildId } }
const pendingInputs = {};

// Édite le panel éphémère via le token d'interaction
// components : ContainerBuilder | [ContainerBuilder, ActionRowBuilder]
async function patchPanel(token, appId, components) {
    const list = Array.isArray(components) ? components : [components];

    try {
        await client.rest.patch(
            Routes.webhookMessage(appId, token),
            {
                body: {
                    components: list.map(c => c.toJSON()),
                },
            }
        );
    } catch (err) {
        console.error('patchPanel error:', err.message);
    }
}

module.exports = { pendingInputs, patchPanel };