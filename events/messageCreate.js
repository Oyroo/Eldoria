const { Events, ChannelType } = require('discord.js');
const { config, saveConfig }  = require('../utils/config');
const { pendingInputs, patchPanel } = require('../utils/pending');
const { buildTicketEmbed, buildTicketPanelRow } = require('../utils/builders');

module.exports = {
    name: Events.MessageCreate,

    async execute(message) {
        if (message.author.bot) return;

        const pending = pendingInputs[message.author.id];
        if (!pending || message.guildId !== pending.guildId) return;

        const input = message.content.trim();

        // Supprimer le message de l'utilisateur
        try { await message.delete(); } catch {}

        // Annulation par message
        if (input.toLowerCase() === 'annuler') {
            delete pendingInputs[message.author.id];
            await patchPanel(pending.token, pending.appId);
            return;
        }

        delete pendingInputs[message.author.id];

        // Résoudre l'ID depuis <#123> ou ID brut
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
                errorMsg = 'Catégorie Discord introuvable avec cet ID.';
            }

        } else if (pending.type === 'sendchan') {
            try {
                const ch = await message.guild.channels.fetch(resolvedId);
                await ch.send({
                    embeds:     [buildTicketEmbed(pending.catKey)],
                    components: [buildTicketPanelRow(pending.catKey)],
                });
            } catch {
                errorMsg = 'Salon introuvable ou impossible d\'y envoyer un message.';
            }

        } else if (pending.type === 'transcript') {
            try {
                await message.guild.channels.fetch(resolvedId);
                config.ticketCategories[pending.catKey].transcriptChannelId = resolvedId;
                saveConfig();
            } catch {
                errorMsg = 'Salon de transcripts introuvable avec cet ID.';
            }
        }

        await patchPanel(pending.token, pending.appId, errorMsg);
    },
};