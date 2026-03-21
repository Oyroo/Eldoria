const { Events, ChannelType }  = require('discord.js');
const { config, saveConfig }   = require('../utils/config');
const { pending, patch }       = require('../utils/pending');
const { categoryPanel, ticketEmbed, ticketOpenRow } = require('../utils/builders');
const { buildConfigRpMessage } = require('../utils/configRpPanels');

module.exports = {
    name: Events.MessageCreate,

    async execute(msg) {
        if (msg.author.bot) return;

        const p = pending[msg.author.id];
        if (!p || msg.guildId !== p.guildId) return;

        // welcome → géré par messageCreate_welcome.js
        if (p.type === 'welcome_channel' || p.type === 'welcome_role') return;

        try { await msg.delete(); } catch {}

        const icon = msg.guild?.iconURL({ size: 256, extension: 'png' }) ?? null;

        // ── Météo ──────────────────────────────────────────────────────────────
        if (p.type === 'meteo_channel') {
            if (msg.content.trim().toLowerCase() === 'annuler') {
                delete pending[msg.author.id];
                await patch(p.token, p.appId, buildConfigRpMessage('meteo', msg.guild).components);
                return;
            }
            delete pending[msg.author.id];
            const id = msg.content.trim().replace(/[<#>]/g, '').trim();
            try {
                await msg.guild.channels.fetch(id);
                if (!config.meteo) config.meteo = {};
                config.meteo.channelId = id;
                saveConfig();
            } catch {}
            await patch(p.token, p.appId, buildConfigRpMessage('meteo', msg.guild).components);
            return;
        }

        // ── Tickets ────────────────────────────────────────────────────────────
        if (msg.content.trim().toLowerCase() === 'annuler') {
            delete pending[msg.author.id];
            const [c, row] = categoryPanel(p.catKey, null, icon);
            await patch(p.token, p.appId, [c, row]);
            return;
        }

        delete pending[msg.author.id];

        const id    = msg.content.trim().replace(/[<#>]/g, '').trim();
        let   error = null;

        if (p.type === 'setcat') {
            try {
                const ch = await msg.guild.channels.fetch(id);
                if (ch.type !== ChannelType.GuildCategory) {
                    error = 'Ce salon n\'est pas une catégorie Discord.';
                } else {
                    config.ticketCategories[p.catKey].categoryId = id;
                    saveConfig();
                }
            } catch { error = 'Catégorie Discord introuvable.'; }

        } else if (p.type === 'transcript') {
            try {
                await msg.guild.channels.fetch(id);
                config.ticketCategories[p.catKey].transcriptChannelId = id;
                saveConfig();
            } catch { error = 'Salon introuvable.'; }

        } else if (p.type === 'sendchan') {
            try {
                const ch = await msg.guild.channels.fetch(id);
                await ch.send({
                    embeds:     [ticketEmbed(p.catKey)],
                    components: [ticketOpenRow(p.catKey)],
                });
            } catch { error = 'Impossible d\'envoyer dans ce salon.'; }
        }

        if (!p.catKey || !config.ticketCategories[p.catKey]) return;
        const [c, row] = categoryPanel(p.catKey, error, icon);
        await patch(p.token, p.appId, [c, row]);
    },
};