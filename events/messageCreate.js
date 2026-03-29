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

        // bump reminder inputs
        if (p.type?.startsWith('bump_')) {
            try { await msg.delete(); } catch {}
            if (msg.content.trim().toLowerCase() === 'annuler') {
                delete pending[msg.author.id];
                const { buildBumpPanel } = require('../interactions/buttons_bump');
                await patch(p.token, p.appId, [buildBumpPanel(msg.guild)]);
                return;
            }
            delete pending[msg.author.id];
            const val = msg.content.trim().replace(/[<@&!#>]/g, '').trim();
            const [field, type] = p.type.replace('bump_', '').split(':');
            if (!config.bumpReminders) config.bumpReminders = {};
            if (!config.bumpReminders[type]) config.bumpReminders[type] = {};
            try {
                if (field === 'chan') {
                    await msg.guild.channels.fetch(val);
                    config.bumpReminders[type].channelId = val;
                } else if (field === 'role') {
                    if (val.toLowerCase() === 'aucun') {
                        config.bumpReminders[type].roleId = null;
                    } else {
                        await msg.guild.roles.fetch(val);
                        config.bumpReminders[type].roleId = val;
                    }
                }
                saveConfig();
            } catch {}
            const { buildBumpPanel } = require('../interactions/buttons_bump');
            await patch(p.token, p.appId, [buildBumpPanel(msg.guild)]);
            return;
        }

        // welcome depart channel
        if (p.type === 'welcome_dep_channel') {
            try { await msg.delete(); } catch {}
            if (msg.content.trim().toLowerCase() === 'annuler') {
                delete pending[msg.author.id];
                const { buildWelcomePanel } = require('../interactions/buttons_welcome');
                await patch(p.token, p.appId, [buildWelcomePanel(msg.guild)]);
                return;
            }
            delete pending[msg.author.id];
            const val = msg.content.trim().replace(/[<#>]/g, '').trim();
            try {
                await msg.guild.channels.fetch(val);
                if (!config.welcome) config.welcome = {};
                config.welcome.departChannelId = val;
                saveConfig();
            } catch {}
            const { buildWelcomePanel } = require('../interactions/buttons_welcome');
            await patch(p.token, p.appId, [buildWelcomePanel(msg.guild)]);
            return;
        }

        // welcome depart channel
        if (p.type === 'welcome_dep_channel') {
            try { await msg.delete(); } catch {}
            if (msg.content.trim().toLowerCase() === 'annuler') {
                delete pending[msg.author.id];
                const { buildWelcomePanel } = require('../interactions/buttons_welcome');
                await patch(p.token, p.appId, [buildWelcomePanel(msg.guild)]);
                return;
            }
            delete pending[msg.author.id];
            const val = msg.content.trim().replace(/[<#>]/g, '').trim();
            try {
                await msg.guild.channels.fetch(val);
                if (!config.welcome) config.welcome = {};
                config.welcome.departChannelId = val;
                saveConfig();
            } catch {}
            const { buildWelcomePanel } = require('../interactions/buttons_welcome');
            await patch(p.token, p.appId, [buildWelcomePanel(msg.guild)]);
            return;
        }

        // welcome general channel
        if (p.type === 'welcome_gen_channel') {
            try { await msg.delete(); } catch {}
            if (msg.content.trim().toLowerCase() === 'annuler') {
                delete pending[msg.author.id];
                const { buildWelcomePanel } = require('../interactions/buttons_welcome');
                await patch(p.token, p.appId, [buildWelcomePanel(msg.guild)]);
                return;
            }
            delete pending[msg.author.id];
            const val = msg.content.trim().replace(/[<#>]/g, '').trim();
            try {
                await msg.guild.channels.fetch(val);
                if (!config.welcome) config.welcome = {};
                config.welcome.generalChannelId = val;
                saveConfig();
            } catch {}
            const { buildWelcomePanel } = require('../interactions/buttons_welcome');
            await patch(p.token, p.appId, [buildWelcomePanel(msg.guild)]);
            return;
        }

        // invite tracker inputs
        if (['inv_forum', 'inv_aowyn', 'inv_disboard'].includes(p.type)) {
            try { await msg.delete(); } catch {}
            if (msg.content.trim().toLowerCase() === 'annuler') {
                delete pending[msg.author.id];
                const { buildInvitesPanel } = require('../interactions/buttons_invites');
                await patch(p.token, p.appId, [buildInvitesPanel(msg.guild)]);
                return;
            }
            delete pending[msg.author.id];
            const val = msg.content.trim().replace(/[<#>]/g, '').trim();
            if (!config.inviteTracker) config.inviteTracker = {};
            if (p.type === 'inv_forum') {
                try { await msg.guild.channels.fetch(val); config.inviteTracker.forumChannelId = val; saveConfig(); } catch {}
            } else if (p.type === 'inv_aowyn') {
                config.inviteTracker.aowynCode = val; saveConfig();
            } else if (p.type === 'inv_disboard') {
                config.inviteTracker.disboardCode = val; saveConfig();
            }
            const { buildInvitesPanel } = require('../interactions/buttons_invites');
            await patch(p.token, p.appId, [buildInvitesPanel(msg.guild)]);
            return;
        }

        // welcome → géré par messageCreate_welcome.js
        if (p.type === 'welcome_channel' || p.type === 'welcome_role') return;

        // ── Logs ───────────────────────────────────────────────────────────────
        if (p.type === 'logs_single_channel' || p.type?.startsWith('logs_channel:')) {
            try { await msg.delete(); } catch {}
            if (msg.content.trim().toLowerCase() === 'annuler') {
                delete pending[msg.author.id];
                const { buildLogsPanel } = require('../interactions/buttons_logs');
                await patch(p.token, p.appId, [buildLogsPanel(msg.guild)]);
                return;
            }
            delete pending[msg.author.id];
            const id = msg.content.trim().replace(/[<#>]/g, '').trim();
            try {
                await msg.guild.channels.fetch(id);
                if (!config.logs) config.logs = {};
                if (p.type === 'logs_single_channel') {
                    config.logs.channelId = id;
                } else {
                    const key = p.type.split(':')[1];
                    if (!config.logs.channels) config.logs.channels = {};
                    config.logs.channels[key] = id;
                }
                saveConfig();
            } catch {}
            const { buildLogsPanel } = require('../interactions/buttons_logs');
            await patch(p.token, p.appId, [buildLogsPanel(msg.guild)]);
            return;
        }

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