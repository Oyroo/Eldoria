const {
    MessageFlags, ChannelType, PermissionFlagsBits,
    ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder,
    EmbedBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const fs   = require('fs');
const path = require('path');

const { config, saveConfig }      = require('../utils/config');
const { intToHex, colorInt }      = require('../utils/helpers');
const { pendingInputs }           = require('../utils/pending');
const { getTickets, saveTickets } = require('../utils/tickets');
const { generateTranscript }      = require('../utils/transcript');
const {
    buildMainPanel,
    buildCategoryPanel,
    buildAwaitingPanel,
    buildTicketEmbed,
    buildTicketOpenRow,
} = require('../utils/builders');

// ─── Boutons de contrôle dans le salon ticket ─────────────────────────────────

function buildTicketControlRow(claimed = false, claimerTag = null) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('ticket_close')
            .setLabel('Fermer').setEmoji('🔒')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('ticket_claim')
            .setLabel(claimed ? `Claim : ${claimerTag}` : 'Claim')
            .setEmoji(claimed ? '✅' : '🙋')
            .setStyle(claimed ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setDisabled(claimed),
    );
}

async function handleButton(interaction) {
    const id = interaction.customId;

    // ════════════════════════════════════════════════════════════════════════
    // NAVIGATION
    // ════════════════════════════════════════════════════════════════════════

    // ← Retour au menu principal
    if (id === 'cfg_back') {
        return interaction.update({
            components: [buildMainPanel()],
            flags:      MessageFlags.IsComponentsV2,
        });
    }

    // Ouvrir la page d'une catégorie
    if (id.startsWith('cfg_open:')) {
        const catKey = id.split(':')[1];
        if (!config.ticketCategories[catKey])
            return interaction.update({ components: [buildMainPanel()], flags: MessageFlags.IsComponentsV2 });

        const [container, actionRow] = buildCategoryPanel(catKey);
        return interaction.update({
            components: [container, actionRow],
            flags:      MessageFlags.IsComponentsV2,
        });
    }

    // ════════════════════════════════════════════════════════════════════════
    // MENU PRINCIPAL
    // ════════════════════════════════════════════════════════════════════════

    // ── Nouvelle catégorie → modal ────────────────────────────────────────────
    if (id === 'cfg_create') {
        const modal = new ModalBuilder()
            .setCustomId('cfg_modal_create')
            .setTitle('Nouvelle catégorie de tickets');

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('label').setLabel('Nom affiché (ex: 🎫 Support)')
                    .setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('title').setLabel('Titre de l\'embed')
                    .setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('description').setLabel('Description de l\'embed')
                    .setStyle(TextInputStyle.Paragraph).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('color').setLabel('Couleur hex (optionnel)')
                    .setStyle(TextInputStyle.Short).setPlaceholder('#5865f2').setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('button_label').setLabel('Texte du bouton (optionnel)')
                    .setStyle(TextInputStyle.Short).setPlaceholder('Ouvrir un ticket').setRequired(false)
            ),
        );

        return interaction.showModal(modal);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PAGE CATÉGORIE
    // ════════════════════════════════════════════════════════════════════════

    // ── Modifier l'embed → modal ──────────────────────────────────────────────
    if (id.startsWith('cfg_edit:')) {
        const catKey = id.split(':')[1];
        const cat    = config.ticketCategories[catKey];
        if (!cat) return interaction.update({ components: [buildMainPanel()], flags: MessageFlags.IsComponentsV2 });

        const modal = new ModalBuilder()
            .setCustomId(`cfg_modal_edit:${catKey}`)
            .setTitle(`Modifier — ${cat.label}`);

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('title').setLabel('Titre')
                    .setStyle(TextInputStyle.Short).setValue(cat.title).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('description').setLabel('Description')
                    .setStyle(TextInputStyle.Paragraph).setValue(cat.description).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('color').setLabel('Couleur hex')
                    .setStyle(TextInputStyle.Short)
                    .setValue(typeof cat.color === 'number' ? intToHex(cat.color) : (cat.color ?? '#5865f2'))
                    .setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('button_label').setLabel('Texte du bouton')
                    .setStyle(TextInputStyle.Short).setValue(cat.buttonLabel).setRequired(false)
            ),
        );

        return interaction.showModal(modal);
    }

    // ── Catégorie Discord → attente message ───────────────────────────────────
    if (id.startsWith('cfg_setcat:')) {
        const catKey = id.split(':')[1];
        pendingInputs[interaction.user.id] = {
            type: 'setcat', catKey,
            token:   interaction.token,
            appId:   interaction.client.application.id,
            guildId: interaction.guildId,
        };
        const [container, actionRow] = buildAwaitingPanel('setcat', catKey);
        return interaction.update({
            components: [container, actionRow],
            flags:      MessageFlags.IsComponentsV2,
        });
    }

    // ── Salon transcripts → attente message ───────────────────────────────────
    if (id.startsWith('cfg_transcript:')) {
        const catKey = id.split(':')[1];
        pendingInputs[interaction.user.id] = {
            type: 'transcript', catKey,
            token:   interaction.token,
            appId:   interaction.client.application.id,
            guildId: interaction.guildId,
        };
        const [container, actionRow] = buildAwaitingPanel('transcript', catKey);
        return interaction.update({
            components: [container, actionRow],
            flags:      MessageFlags.IsComponentsV2,
        });
    }

    // ── Envoyer le panel → attente message ────────────────────────────────────
    if (id.startsWith('cfg_send:')) {
        const catKey = id.split(':')[1];
        pendingInputs[interaction.user.id] = {
            type: 'sendchan', catKey,
            token:   interaction.token,
            appId:   interaction.client.application.id,
            guildId: interaction.guildId,
        };
        const [container, actionRow] = buildAwaitingPanel('sendchan', catKey);
        return interaction.update({
            components: [container, actionRow],
            flags:      MessageFlags.IsComponentsV2,
        });
    }

    // ── Annuler l'attente → retour à la page catégorie ────────────────────────
    if (id === 'cfg_cancel') {
        const pending = pendingInputs[interaction.user.id];
        const catKey  = pending?.catKey;
        delete pendingInputs[interaction.user.id];

        if (catKey && config.ticketCategories[catKey]) {
            const [container, actionRow] = buildCategoryPanel(catKey);
            return interaction.update({
                components: [container, actionRow],
                flags:      MessageFlags.IsComponentsV2,
            });
        }

        return interaction.update({
            components: [buildMainPanel()],
            flags:      MessageFlags.IsComponentsV2,
        });
    }

    // ── Sauvegarder (force save + confirmation visuelle) ─────────────────────
    if (id.startsWith('cfg_save:')) {
        const catKey = id.split(':')[1];
        if (!config.ticketCategories[catKey])
            return interaction.update({ components: [buildMainPanel()], flags: MessageFlags.IsComponentsV2 });

        saveConfig();

        const [container, actionRow] = buildCategoryPanel(catKey);

        // Remplacer le bouton Sauvegarder par une confirmation temporaire
        const confirmedRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('cfg_back').setLabel('Retour').setEmoji('←').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`cfg_save:${catKey}`).setLabel('Sauvegardé !').setEmoji('✅').setStyle(ButtonStyle.Success).setDisabled(true),
            new ButtonBuilder().setCustomId(`cfg_preview:${catKey}`).setLabel('Aperçu').setEmoji('👁️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`cfg_delete:${catKey}`).setLabel('Supprimer').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
        );

        return interaction.update({
            components: [container, confirmedRow],
            flags:      MessageFlags.IsComponentsV2,
        });
    }

    // ── Aperçu du panel public ────────────────────────────────────────────────
    if (id.startsWith('cfg_preview:')) {
        const catKey = id.split(':')[1];
        const cat    = config.ticketCategories[catKey];
        if (!cat)
            return interaction.reply({ content: '❌ Catégorie introuvable.', flags: MessageFlags.Ephemeral });

        return interaction.reply({
            content:    `-# Aperçu — **${cat.label}**`,
            embeds:     [buildTicketEmbed(catKey)],
            components: [buildTicketOpenRow(catKey)],
            flags:      MessageFlags.Ephemeral,
        });
    }

    // ── Supprimer une catégorie ───────────────────────────────────────────────
    if (id.startsWith('cfg_delete:')) {
        delete config.ticketCategories[id.split(':')[1]];
        saveConfig();
        return interaction.update({
            components: [buildMainPanel()],
            flags:      MessageFlags.IsComponentsV2,
        });
    }

    // ════════════════════════════════════════════════════════════════════════
    // TICKETS
    // ════════════════════════════════════════════════════════════════════════

    // ── Ouvrir un ticket ──────────────────────────────────────────────────────
    if (id.startsWith('ticket_create:')) {
        const catKey = id.split(':')[1];
        const cat    = config.ticketCategories[catKey];

        if (!cat)
            return interaction.reply({
                content: '❌ Cette catégorie de ticket n\'existe plus.',
                flags:   MessageFlags.Ephemeral,
            });

        const openTickets = getTickets();
        const existing    = Object.values(openTickets).find(t => t.userId === interaction.user.id);
        if (existing)
            return interaction.reply({
                content: `❌ Tu as déjà un ticket ouvert : <#${existing.channelId}>`,
                flags:   MessageFlags.Ephemeral,
            });

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        config.ticketCounter = (config.ticketCounter ?? 0) + 1;
        saveConfig();

        const ticketNumber = config.ticketCounter;
        const channelName  = `ticket-${String(ticketNumber).padStart(4, '0')}-${interaction.user.username}`
            .toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 32);

        const ticketChannel = await interaction.guild.channels.create({
            name:   channelName,
            type:   ChannelType.GuildText,
            parent: cat.categoryId ?? null,
            topic:  `Ticket #${String(ticketNumber).padStart(4, '0')} — ${interaction.user.tag} — ${cat.label}`,
            permissionOverwrites: [
                { id: interaction.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.AttachFiles,
                ]},
            ],
        });

        const ticketInfo = {
            channelId: ticketChannel.id,
            userId:    interaction.user.id,
            username:  interaction.user.tag,
            openedAt:  Date.now(),
            claimedBy: null,
            ticketNumber,
            catKey,
        };
        openTickets[ticketChannel.id] = ticketInfo;
        saveTickets();

        await ticketChannel.send({
            content: `<@${interaction.user.id}>`,
            embeds: [
                new EmbedBuilder()
                    .setTitle(`${cat.label} — Ticket #${String(ticketNumber).padStart(4, '0')}`)
                    .setDescription(
                        `Bonjour <@${interaction.user.id}>, bienvenue dans ton ticket.\n` +
                        `Décris ta demande et notre équipe reviendra vers toi rapidement.`
                    )
                    .addFields(
                        { name: 'Ouvert par', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'Catégorie',  value: cat.label,                   inline: true },
                        { name: 'Ouvert le',  value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
                    )
                    .setColor(colorInt(cat.color))
                    .setFooter({ text: 'Eldoria — Système de tickets' }),
            ],
            components: [buildTicketControlRow()],
        });

        return interaction.editReply({ content: `✅ Ton ticket a été créé : <#${ticketChannel.id}>` });
    }

    // ── Claim ─────────────────────────────────────────────────────────────────
    if (id === 'ticket_claim') {
        const openTickets = getTickets();
        const ticketInfo  = openTickets[interaction.channelId];
        if (!ticketInfo)
            return interaction.reply({ content: '❌ Ticket introuvable.', flags: MessageFlags.Ephemeral });

        ticketInfo.claimedBy = interaction.user.tag;
        saveTickets();

        await interaction.message.edit({ components: [buildTicketControlRow(true, interaction.user.tag)] });
        return interaction.reply({ content: `🙋 Ticket pris en charge par **${interaction.user.tag}**.` });
    }

    // ── Fermeture ─────────────────────────────────────────────────────────────
    if (id === 'ticket_close') {
        const openTickets = getTickets();
        const ticketInfo  = openTickets[interaction.channelId];
        if (!ticketInfo)
            return interaction.reply({ content: '❌ Ticket introuvable.', flags: MessageFlags.Ephemeral });

        await interaction.reply({ content: '🔒 Fermeture en cours, génération du transcript...' });

        try {
            const html    = await generateTranscript(interaction.channel, ticketInfo);
            const fname   = `transcript-${interaction.channel.name}.html`;
            const tmpPath = path.join('/tmp', fname);
            fs.writeFileSync(tmpPath, html, 'utf-8');

            const cat  = config.ticketCategories[ticketInfo.catKey];
            const tsId = cat?.transcriptChannelId;

            if (tsId) {
                const tsChan = await interaction.guild.channels.fetch(tsId);
                await tsChan.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`📋 Transcript — Ticket #${String(ticketInfo.ticketNumber).padStart(4, '0')}`)
                            .addFields(
                                { name: 'Catégorie',   value: cat?.label ?? ticketInfo.catKey, inline: true },
                                { name: 'Utilisateur', value: `<@${ticketInfo.userId}> (${ticketInfo.username})`, inline: true },
                                { name: 'Fermé par',   value: interaction.user.tag, inline: true },
                                { name: 'Ouvert le',   value: `<t:${Math.floor(ticketInfo.openedAt / 1000)}:F>`, inline: false },
                                { name: 'Claim',       value: ticketInfo.claimedBy ?? 'Non claim', inline: true },
                            )
                            .setColor(colorInt(cat?.color ?? 0x5865f2))
                            .setTimestamp(),
                    ],
                    files: [{ attachment: tmpPath, name: fname }],
                });
            }

            if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
            delete openTickets[interaction.channelId];
            saveTickets();

            await interaction.channel.send('✅ Transcript généré. Suppression dans 5 secondes...');
            setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);

        } catch (err) {
            console.error('Erreur fermeture ticket :', err);
            await interaction.followUp({
                content: `❌ Erreur lors de la fermeture : \`${err.message}\``,
                flags:   MessageFlags.Ephemeral,
            });
        }
    }
}

module.exports = { handleButton };