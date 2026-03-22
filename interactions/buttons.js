const {
    MessageFlags, ChannelType, PermissionFlagsBits,
    ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle,
    EmbedBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const fs   = require('fs');
const path = require('path');

const Flags                                     = require('../utils/flags');
const { config, saveConfig }                    = require('../utils/config');
const { intToHex, colorInt }                    = require('../utils/helpers');
const { pending }                               = require('../utils/pending');
const { get: getTickets, save: saveTickets }    = require('../utils/tickets');
const { generate }                              = require('../utils/transcript');
const { logTicketOpen, logTicketClose, logError } = require('../utils/botLogger');
const { mainPanel, categoryPanel, deletePanel, awaitPanel, ticketEmbed, ticketOpenRow, ticketControlRow } = require('../utils/builders');

function icon(guild) { return guild?.iconURL({ size: 256, extension: 'png' }) ?? null; }

async function handleButton(interaction) {
    const id = interaction.customId;
    const ic = icon(interaction.guild);

    // ─── Navigation ───────────────────────────────────────────────────────────

    if (id === 'cfg_back') {
        return interaction.update({ components: mainPanel(ic), flags: Flags.CV2 });
    }

    if (id.startsWith('cfg_open:')) {
        const key = id.split(':')[1];
        if (!config.ticketCategories[key])
            return interaction.update({ components: mainPanel(ic), flags: Flags.CV2 });
        const [c, row] = categoryPanel(key, null, ic);
        return interaction.update({ components: [c, row], flags: Flags.CV2 });
    }

    if (id.startsWith('cfg_back_cat:')) {
        const key = id.split(':')[1];
        const [c, row] = categoryPanel(key, null, ic);
        return interaction.update({ components: [c, row], flags: Flags.CV2 });
    }

    // ─── Menu principal ───────────────────────────────────────────────────────

    if (id === 'cfg_create') {
        const modal = new ModalBuilder().setCustomId('modal_create').setTitle('Nouvel embed de tickets');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('label').setLabel('Nom affiché').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Titre de l\'embed').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('color').setLabel('Couleur hex (optionnel)').setStyle(TextInputStyle.Short).setPlaceholder('#5865f2').setRequired(false)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('button_label').setLabel('Texte du bouton (optionnel)').setStyle(TextInputStyle.Short).setPlaceholder('Ouvrir un ticket').setRequired(false)),
        );
        return interaction.showModal(modal);
    }

    // ─── Page embed — dans le container ──────────────────────────────────────

    if (id.startsWith('cfg_edit:')) {
        const key = id.split(':')[1];
        const e   = config.ticketCategories[key];
        if (!e) return interaction.update({ components: mainPanel(ic), flags: Flags.CV2 });

        const modal = new ModalBuilder().setCustomId(`modal_edit:${key}`).setTitle(`Modifier — ${e.label}`);
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Titre').setStyle(TextInputStyle.Short).setValue(e.title).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setValue(e.description).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('button_label').setLabel('Texte du bouton').setStyle(TextInputStyle.Short).setValue(e.buttonLabel).setRequired(false)),
        );
        return interaction.showModal(modal);
    }

    if (id.startsWith('cfg_color:')) {
        const key = id.split(':')[1];
        const e   = config.ticketCategories[key];
        if (!e) return interaction.update({ components: mainPanel(ic), flags: Flags.CV2 });

        const modal = new ModalBuilder().setCustomId(`modal_color:${key}`).setTitle(`Couleur — ${e.label}`);
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('color').setLabel('Couleur hex')
                    .setStyle(TextInputStyle.Short)
                    .setValue(typeof e.color === 'number' ? intToHex(e.color) : '#5865f2')
                    .setPlaceholder('#d4a853').setRequired(true)
            )
        );
        return interaction.showModal(modal);
    }

    if (id.startsWith('cfg_setcat:')) {
        const key = id.split(':')[1];
        pending[interaction.user.id] = { type: 'setcat', catKey: key, token: interaction.token, appId: interaction.client.application.id, guildId: interaction.guildId };
        const [c, row] = awaitPanel('setcat', key);
        return interaction.update({ components: [c, row], flags: Flags.CV2 });
    }

    if (id.startsWith('cfg_transcript:')) {
        const key = id.split(':')[1];
        pending[interaction.user.id] = { type: 'transcript', catKey: key, token: interaction.token, appId: interaction.client.application.id, guildId: interaction.guildId };
        const [c, row] = awaitPanel('transcript', key);
        return interaction.update({ components: [c, row], flags: Flags.CV2 });
    }

    if (id.startsWith('cfg_send:')) {
        const key = id.split(':')[1];
        pending[interaction.user.id] = { type: 'sendchan', catKey: key, token: interaction.token, appId: interaction.client.application.id, guildId: interaction.guildId };
        const [c, row] = awaitPanel('sendchan', key);
        return interaction.update({ components: [c, row], flags: Flags.CV2 });
    }

    if (id === 'cfg_cancel') {
        const p   = pending[interaction.user.id];
        const key = p?.catKey;
        delete pending[interaction.user.id];
        if (key && config.ticketCategories[key]) {
            const [c, row] = categoryPanel(key, null, ic);
            return interaction.update({ components: [c, row], flags: Flags.CV2 });
        }
        return interaction.update({ components: mainPanel(ic), flags: Flags.CV2 });
    }

    // ─── Page embed — hors container ─────────────────────────────────────────

    if (id.startsWith('cfg_save:')) {
        const key = id.split(':')[1];
        if (!config.ticketCategories[key])
            return interaction.update({ components: mainPanel(ic), flags: Flags.CV2 });

        saveConfig();

        const [c] = categoryPanel(key, null, ic);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('cfg_back').setLabel('Retour').setEmoji('↩️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`cfg_save:${key}`).setLabel('Sauvegardé !').setEmoji('✅').setStyle(ButtonStyle.Success).setDisabled(true),
            new ButtonBuilder().setCustomId(`cfg_preview:${key}`).setLabel('Aperçu').setEmoji('👁️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`cfg_delete_ask:${key}`).setLabel('Supprimer').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
        );
        return interaction.update({ components: [c, row], flags: Flags.CV2 });
    }

    if (id.startsWith('cfg_preview:')) {
        const key = id.split(':')[1];
        const e   = config.ticketCategories[key];
        if (!e) return interaction.reply({ content: '❌ Embed introuvable.', flags: Flags.Ephemeral });
        return interaction.reply({
            content:    `-# Aperçu — **${e.label}**`,
            embeds:     [ticketEmbed(key)],
            components: [ticketOpenRow(key)],
            flags:      Flags.Ephemeral,
        });
    }

    if (id.startsWith('cfg_delete_ask:')) {
        const key = id.split(':')[1];
        if (!config.ticketCategories[key])
            return interaction.update({ components: mainPanel(ic), flags: Flags.CV2 });
        const [c, row] = deletePanel(key);
        return interaction.update({ components: [c, row], flags: Flags.CV2 });
    }

    if (id.startsWith('cfg_delete_yes:')) {
        const key = id.split(':')[1];
        delete config.ticketCategories[key];
        saveConfig();
        return interaction.update({ components: mainPanel(ic), flags: Flags.CV2 });
    }

    // ─── Tickets ──────────────────────────────────────────────────────────────

    if (id.startsWith('ticket_open:')) {
        const key     = id.split(':')[1];
        const e       = config.ticketCategories[key];
        if (!e) return interaction.reply({ content: '❌ Cet embed n\'existe plus.', flags: Flags.Ephemeral });

        const tickets  = getTickets();
        const existing = Object.values(tickets).find(t => t.userId === interaction.user.id);
        if (existing)
            return interaction.reply({ content: `❌ Tu as déjà un ticket ouvert : <#${existing.channelId}>`, flags: Flags.Ephemeral });

        await interaction.deferReply({ flags: Flags.Ephemeral });

        config.ticketCounter = (config.ticketCounter ?? 0) + 1;
        saveConfig();

        const num  = config.ticketCounter;
        const name = `ticket-${String(num).padStart(4,'0')}-${interaction.user.username}`
            .toLowerCase().replace(/[^a-z0-9-]/g,'-').slice(0,32);

        const channel = await interaction.guild.channels.create({
            name, type: ChannelType.GuildText,
            parent: e.categoryId ?? null,
            topic:  `Ticket #${String(num).padStart(4,'0')} — ${interaction.user.tag} — ${e.label}`,
            permissionOverwrites: [
                { id: interaction.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
            ],
        });

        tickets[channel.id] = { channelId: channel.id, userId: interaction.user.id, username: interaction.user.tag, openedAt: Date.now(), claimedBy: null, ticketNumber: num, catKey: key };
        saveTickets();

        await channel.send({
            content: `<@${interaction.user.id}>`,
            embeds: [
                new EmbedBuilder()
                    .setTitle(`${e.label} — Ticket #${String(num).padStart(4,'0')}`)
                    .setDescription(`Bonjour <@${interaction.user.id}>, bienvenue dans ton ticket.\nDécris ta demande et notre équipe reviendra vers toi rapidement.`)
                    .addFields(
                        { name: 'Ouvert par', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'Embed',      value: e.label,                     inline: true },
                        { name: 'Ouvert le',  value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false },
                    )
                    .setColor(colorInt(e.color))
                    .setFooter({ text: 'Eldoria — Système de tickets' }),
            ],
            components: [ticketControlRow()],
        });

        return interaction.editReply({ content: `✅ Ticket créé : <#${channel.id}>` });
    }

    if (id === 'ticket_claim') {
        const tickets = getTickets();
        const info    = tickets[interaction.channelId];
        if (!info) return interaction.reply({ content: '❌ Ticket introuvable.', flags: Flags.Ephemeral });

        info.claimedBy = interaction.user.tag;
        saveTickets();

        await interaction.message.edit({ components: [ticketControlRow(true, interaction.user.tag)] });
        return interaction.reply({ content: `🙋 Pris en charge par **${interaction.user.tag}**.` });
    }

    if (id === 'ticket_close') {
        const tickets = getTickets();
        const info    = tickets[interaction.channelId];
        if (!info) return interaction.reply({ content: '❌ Ticket introuvable.', flags: Flags.Ephemeral });

        await interaction.reply({ content: '🔒 Fermeture en cours...' });

        try {
            const html    = await generate(interaction.channel, info);
            const fname   = `transcript-${interaction.channel.name}.html`;
            const tmp     = path.join('/tmp', fname);
            fs.writeFileSync(tmp, html, 'utf-8');

            const e    = config.ticketCategories[info.catKey];
            const tsId = e?.transcriptChannelId;

            if (tsId) {
                const tsChan = await interaction.guild.channels.fetch(tsId);
                await tsChan.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`📋 Transcript — Ticket #${String(info.ticketNumber).padStart(4,'0')}`)
                            .addFields(
                                { name: 'Embed',       value: e?.label ?? info.catKey,                              inline: true  },
                                { name: 'Utilisateur', value: `<@${info.userId}> (${info.username})`,               inline: true  },
                                { name: 'Fermé par',   value: interaction.user.tag,                                 inline: true  },
                                { name: 'Ouvert le',   value: `<t:${Math.floor(info.openedAt/1000)}:F>`,            inline: false },
                                { name: 'Claim',       value: info.claimedBy ?? 'Non claim',                        inline: true  },
                            )
                            .setColor(colorInt(e?.color ?? 0x5865f2))
                            .setTimestamp(),
                    ],
                    files: [{ attachment: tmp, name: fname }],
                });
            }

            fs.existsSync(tmp) && fs.unlinkSync(tmp);
            delete tickets[interaction.channelId];
            saveTickets();

            await interaction.channel.send('✅ Transcript généré. Suppression dans 5 secondes...');
            setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);

        } catch (err) {
            console.error(err);
            await interaction.followUp({ content: `❌ Erreur : \`${err.message}\``, flags: Flags.Ephemeral });
        }
    }
}

module.exports = { handleButton };