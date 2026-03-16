const { Routes } = require('discord.js');
const Flags      = require('./flags');
const client     = require('../client');

// Saisies en attente par userId
// { [userId]: { type, catKey, token, appId, guildId } }
const pending = {};

// Édite le message éphémère du panel via son token d'interaction
async function patch(token, appId, components) {
    const list = Array.isArray(components) ? components : [components];
    try {
        await client.rest.patch(Routes.webhookMessage(appId, token), {
            body: { components: list.map(c => c.toJSON()), flags: Flags.CV2 },
        });
    } catch (err) {
        console.error('patch error:', err.message);
    }
}

module.exports = { pending, patch };