const { Events } = require('discord.js');
const { config, saveConfig } = require('../utils/config');
const { pending, patch }     = require('../utils/pending');
const { buildWelcomePanel }  = require('../interactions/buttons_welcome');

const CV2 = 1 << 15;

module.exports = {
    name: Events.MessageCreate,

    async execute(msg) {
        if (msg.author.bot) return;

        const p = pending[msg.author.id];
        if (!p || msg.guildId !== p.guildId) return;
        if (p.type !== 'welcome_channel' && p.type !== 'welcome_role') return;

        try { await msg.delete(); } catch {}

        if (msg.content.trim().toLowerCase() === 'annuler') {
            delete pending[msg.author.id];
            const panel = buildWelcomePanel(msg.guild);
            await patch(p.token, p.appId, [panel]);
            return;
        }

        delete pending[msg.author.id];

        const id = msg.content.trim().replace(/[<@&!#>]/g, '').trim();
        let error = null;

        if (p.type === 'welcome_channel') {
            try {
                await msg.guild.channels.fetch(id);
                if (!config.welcome) config.welcome = {};
                config.welcome.channelId = id;
                saveConfig();
            } catch {
                error = 'Salon introuvable avec cet ID.';
            }
        } else if (p.type === 'welcome_role') {
            try {
                await msg.guild.roles.fetch(id);
                if (!config.welcome) config.welcome = {};
                config.welcome.roleId = id;
                saveConfig();
            } catch {
                error = 'Rôle introuvable avec cet ID.';
            }
        }

        const panel = buildWelcomePanel(msg.guild);

        if (error) {
            // Ajouter un message d'erreur temporaire en haut
            const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('discord.js');
            const errPanel = new ContainerBuilder()
                .setAccentColor(0xed4245)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`❌  ${error}`))
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(1));
            await patch(p.token, p.appId, [errPanel, panel]);
        } else {
            await patch(p.token, p.appId, [panel]);
        }
    },
};