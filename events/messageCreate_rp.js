const { Events } = require('discord.js');
const { config, saveConfig }        = require('../utils/config');
const { pending, patch }            = require('../utils/pending');
const { buildConfigRpMessage }      = require('../utils/configRpPanels');

module.exports = {
    name: Events.MessageCreate,

    async execute(msg) {
        if (msg.author.bot) return;

        const p = pending[msg.author.id];
        if (!p || p.type !== 'meteo_channel' || msg.guildId !== p.guildId) return;

        try { await msg.delete(); } catch {}

        if (msg.content.trim().toLowerCase() === 'annuler') {
            delete pending[msg.author.id];
            const [c, row] = buildConfigRpMessage('meteo', msg.guild).components;
            await patch(p.token, p.appId, buildConfigRpMessage('meteo', msg.guild).components);
            return;
        }

        delete pending[msg.author.id];

        const id = msg.content.trim().replace(/[<#>]/g, '').trim();
        let errorUpdate = false;

        try {
            await msg.guild.channels.fetch(id);
            if (!config.meteo) config.meteo = {};
            config.meteo.channelId = id;
            saveConfig();
        } catch {
            errorUpdate = true;
        }

        const result = buildConfigRpMessage('meteo', msg.guild);
        await patch(p.token, p.appId, result.components);
    },
};