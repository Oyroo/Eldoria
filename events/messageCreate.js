const { Events, ChannelType }       = require('discord.js');
const { config, saveConfig }        = require('../utils/config');
const { pendingInputs, patchPanel } = require('../utils/pending');
const { buildCategoryPanel }        = require('../utils/builders');
const { buildTicketEmbed, buildTicketOpenRow } = require('../utils/builders');

module.exports = {
    name: Events.MessageCreate,

    async execute(message) {
        if (message.author.bot) return;

        const pending = pendingInputs[message.author.id];
        if (!pending || message.guildId !== pending.guildId) return;

        const input = message.content.trim();
        try { await message.delete(); } catch {}

        const icon = message.guild?.iconURL({ size: 256, extension: 'png' }) ?? null;

        if (input.toLowerCase() === 'annuler') {
            delete pendingInputs[message.author.id];
            const [container, actionRow] = buildCategoryPanel(pending.catKey, null, icon);
            await patchPanel(pending.token, pending.appId, [container, actionRow]);
            return;
        }

        delete pendingInputs[message.author.id];

        const resolvedId = input.replace(/[<#>]/g, '').trim();
        let errorMsg = null;

        if (pending.type === 'setcat') {
            try {
                const ch = await message.guild.channels.fetch(resolvedId);
                if (ch.type !== ChannelType.GuildCategory) {
                    errorMsg = 'Ce salon n\'est pas une catégorie Discord.';
                } else {
                    config.ticketCategories[pending.catKey].categoryId = resolvedId;
                    saveConfig();
                }
            } catch {
                errorMsg = 'Aucune catégorie Discord trouvée avec cet ID.';
            }
        } else if (pending.type === 'transcript') {
            try {
                await message.guild.channels.fetch(resolvedId);
                config.ticketCategories[pending.catKey].transcriptChannelId = resolvedId;
                saveConfig();
            } catch {
                errorMsg = 'Salon introuvable avec cet ID.';
            }
        } else if (pending.type === 'sendchan') {
            try {
                const ch = await message.guild.channels.fetch(resolvedId);
                await ch.send({
                    embeds:     [buildTicketEmbed(pending.catKey)],
                    components: [buildTicketOpenRow(pending.catKey)],
                });
            } catch {
                errorMsg = 'Impossible d\'envoyer dans ce salon.';
            }
        }

        const [container, actionRow] = buildCategoryPanel(pending.catKey, errorMsg, icon);
        await patchPanel(pending.token, pending.appId, [container, actionRow]);
    },
};