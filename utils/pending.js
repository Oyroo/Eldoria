const { Routes } = require('discord.js');
const client = require('../client');

// { [userId]: { type, catKey, token, appId, guildId } }
const pendingInputs = {};

const { panelToMessageOptions } = require('./builders');

// Édite le panel éphémère via le token d'interaction
// components : ContainerBuilder | [ContainerBuilder, ActionRowBuilder]
async function patchPanel(token, appId, components) {
    const options = panelToMessageOptions(components);

    try {
        await client.rest.patch(
            Routes.webhookMessage(appId, token),
            {
                body: options,
            }
        );
    } catch (err) {
        console.error('patchPanel error:', err.message);
    }
}

module.exports = { pendingInputs, patchPanel };