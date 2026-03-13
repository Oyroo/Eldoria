const { Events, ChannelType } = require('discord.js');
const { config, saveConfig }        = require('../utils/config');
const { pendingInputs, patchPanel } = require('../utils/pending');
const { buildConfigPanel }          = require('../utils/builders');
const { buildTicketEmbed, buildTicketOpenRow } = require('../utils/builders');

module.exports = {
    name: Events.MessageCreate,

    async execute(message) {
        if (message.author.bot) return;

        const pending = pendingInputs[message.author.id];
        if (!pending || message.guildId !== pending.guildId) return;

        const input = message.content.trim();

        // Supprimer le message de l'utilisateur
        try { await message.delete(); } catch {}

        // Annulation
        if (input.toLowerCase() === 'annuler') {
            delete pendingInputs[message.author.id];
            await patchPanel(pending.token, pending.appId, buildConfigPanel());
            return;
        }

        delete pendingInputs[message.author.id];

        // Résoudre l'ID depuis <#123456> ou ID brut
        const resolvedId = input.replace(/[<#>]/g, '').trim();
        let errorMsg = null;

        // Définir la catégorie Discord
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
        }

        // Définir le salon des transcripts
        else if (pending.type === 'transcript') {
            try {
                await message.guild.channels.fetch(resolvedId);
                config.ticketCategories[pending.catKey].transcriptChannelId = resolvedId;
                saveConfig();
            } catch {
                errorMsg = 'Salon introuvable avec cet ID.';
            }
        }

        // Envoyer le panel dans un salon
        else if (pending.type === 'sendchan') {
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

        await patchPanel(pending.token, pending.appId, buildConfigPanel(errorMsg));
    },
};