const {
    MessageFlags, ChannelType, PermissionFlagsBits,
    ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder,
    EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const fs   = require('fs');
const path = require('path');

const { config, saveConfig }      = require('../utils/config');
const { intToHex, colorInt }      = require('../utils/helpers');
const { getTickets, saveTickets } = require('../utils/tickets');
const { generateTranscript }      = require('../utils/transcript');
const {
    buildConfigHomePanel,
    buildWelcomePanel,
    buildMainPanel,
    buildCategoryPanel,
    buildDeleteConfirmPanel,
    buildTicketEmbed,
    buildTicketOpenRow,
} = require('../utils/builders');
const { createWelcomeImage } = require('../utils/welcomeImage');

function getGuildIcon(guild) {
    return guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
}

function formatWelcomeTemplate(template, member, guild) {
    return template
        .replace(/\{user\}/g, member.user.tag)
        .replace(/\{guild\}/g, guild.name);
}

async function generateWelcomePreview(interaction, type = 'welcome') {
    const member = interaction.guild?.members?.me ?? interaction.member ?? interaction.user;
    const text = type === 'welcome'
        ? formatWelcomeTemplate(config.welcomeText ?? '', member, interaction.guild)
        : formatWelcomeTemplate(config.leaveText ?? '', member, interaction.guild);

    const buffer = await createWelcomeImage(member, type, { message: text }).catch(() => null);
    const embed = new EmbedBuilder()
        .setTitle(type === 'welcome' ? 'Aperçu : message de bienvenue' : 'Aperçu : message de départ')
        .setDescription('Voici un aperçu de l’image générée. Utilise les boutons ci-dessous pour modifier le texte et rafraîchir l’aperçu.')
        .setColor(type === 'welcome' ? 0x5DB3FF : 0xFF6B6B);

    const files = [];
    if (buffer) {
        files.push(new AttachmentBuilder(buffer, { name: 'preview.png' }));
        embed.setImage('attachment://preview.png');
    }

    return { embed, files };
}

function buildChannelModal(customId, title, placeholder) {
    const modal = new ModalBuilder().setCustomId(customId).setTitle(title);
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('channel_id')
                .setLabel('ID du salon')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(placeholder)
                .setRequired(true)
        )
    );
    return modal;
}

function buildChannelModalFromButton(customId, title) {
    return buildChannelModal(customId, title, 'Ex: 123456789012345678');
}

function isTextChannel(channel) {
    return channel && [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildStageVoice, ChannelType.GuildForum].includes(channel.type);
}

function isCategoryChannel(channel) {
    return channel && channel.type === ChannelType.GuildCategory;
}

function safeReply(interaction, payload) {
    return interaction.replied || interaction.deferred
        ? interaction.followUp(payload)
        : interaction.reply(payload);
}

async function handleButton(interaction) {
    const id   = interaction.customId;
    const icon = getGuildIcon(interaction.guild);

    // ── Navigation
    if (id === 'cfg_back_home') {
        return interaction.update({ components: [buildConfigHomePanel(icon)] });
    }

    if (id === 'cfg_back') {
        return interaction.update({ components: [buildMainPanel(icon)] });
    }

    // ── Configuration des arrivées/départs
    if (id === 'cfg_welcome_set_welcome') {
        const modal = buildChannelModalFromButton('cfg_modal_set_welcome', 'Salon de bienvenue');
        return interaction.showModal(modal);
    }

    if (id === 'cfg_welcome_set_leave') {
        const modal = buildChannelModalFromButton('cfg_modal_set_leave', 'Salon de départ');
        return interaction.showModal(modal);
    }

    if (id.startsWith('cfg_welcome_preview:')) {
        const type = id.split(':')[1] === 'leave' ? 'leave' : 'welcome';
        const [container, actionRow] = buildWelcomePanel(icon);
        const { embed, files } = await generateWelcomePreview(interaction, type);
        return interaction.update({ components: [container, actionRow], embeds: [embed], files });
    }

    if (id.startsWith('cfg_welcome_edit:')) {
        const type = id.split(':')[1];
        const modal = new ModalBuilder()
            .setCustomId(`cfg_modal_welcome:${type}`)
            .setTitle(type === 'leave' ? 'Modifier le message de départ' : 'Modifier le message de bienvenue');

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('message')
                    .setLabel('Texte (utilise {user} et {guild})')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setValue(type === 'leave' ? config.leaveText : config.welcomeText)
            )
        );

        return interaction.showModal(modal);
    }

    // ── Navigation vers la configuration tickets
    if (id.startsWith('cfg_open:')) {
        const catKey = id.split(':')[1];
        if (!config.ticketCategories[catKey])
            return interaction.update({ components: [buildMainPanel(icon)] });

        const [container, actionRow] = buildCategoryPanel(catKey, null, icon);
        return interaction.update({ components: [container, actionRow] });
    }

    if (id.startsWith('cfg_back_cat:')) {
        const catKey = id.split(':')[1];
        const [container, actionRow] = buildCategoryPanel(catKey, null, icon);
        return interaction.update({ components: [container, actionRow] });
    }

    // ── Création et édition des embeds
    if (id === 'cfg_create') {
        const modal = new ModalBuilder()
            .setCustomId('cfg_modal_create')
            .setTitle('Nouvel embed de tickets');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('label').setLabel('Nom affiché (ex: 🎫 Support)').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Titre de l\'embed').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Description de l\'embed').setStyle(TextInputStyle.Paragraph).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('color').setLabel('Couleur hex (optionnel)').setStyle(TextInputStyle.Short).setPlaceholder('#5865f2').setRequired(false)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('button_label').setLabel('Texte du bouton (optionnel)').setStyle(TextInputStyle.Short).setPlaceholder('Ouvrir un ticket').setRequired(false)),
        );
        return interaction.showModal(modal);
    }

    if (id.startsWith('cfg_edit:')) {
        const catKey = id.split(':')[1];
        const cat    = config.ticketCategories[catKey];
        if (!cat) return interaction.update({ components: [buildMainPanel(icon)] });

        const modal = new ModalBuilder().setCustomId(`cfg_modal_edit:${catKey}`).setTitle(`Modifier — ${cat.label}`);
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Titre').setStyle(TextInputStyle.Short).setValue(cat.title).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setValue(cat.description).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('button_label').setLabel('Texte du bouton').setStyle(TextInputStyle.Short).setValue(cat.buttonLabel).setRequired(false)),
        );
        return interaction.showModal(modal);
    }

    if (id.startsWith('cfg_color:')) {
        const catKey = id.split(':')[1];
        const cat    = config.ticketCategories[catKey];
        if (!cat) return interaction.update({ components: [buildMainPanel(icon)] });

        const modal = new ModalBuilder().setCustomId(`cfg_modal_color:${catKey}`).setTitle(`Couleur — ${cat.label}`);
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('color')
                    .setLabel('Couleur hex')
                    .setStyle(TextInputStyle.Short)
                    .setValue(typeof cat.color === 'number' ? intToHex(cat.color) : (cat.color ?? '#5865f2'))
                    .setPlaceholder('#d4a853')
                    .setRequired(true)
            ),
        );
        return interaction.showModal(modal);
    }

    // ── Canaux et envoi d'embed
    if (id.startsWith('cfg_setcat:')) {
        const catKey = id.split(':')[1];
        const modal = buildChannelModalFromButton(`cfg_modal_setcat:${catKey}`, 'Catégorie Discord');
        return interaction.showModal(modal);
    }

    if (id.startsWith('cfg_transcript:')) {
        const catKey = id.split(':')[1];
        const modal = buildChannelModalFromButton(`cfg_modal_transcript:${catKey}`, 'Salon des transcripts');
        return interaction.showModal(modal);
    }

    if (id.startsWith('cfg_send:')) {
        const catKey = id.split(':')[1];
        const modal = buildChannelModalFromButton(`cfg_modal_send:${catKey}`, 'Salon d\'envoi');
        return interaction.showModal(modal);
    }

    if (id === 'cfg_cancel') {
        return interaction.update({ components: [buildMainPanel(icon)] });
    }

    // ── Sauvegarde / aperçu / suppression
    if (id.startsWith('cfg_save:')) {
        const catKey = id.split(':')[1];
        if (!config.ticketCategories[catKey])
            return interaction.update({ components: [buildMainPanel(icon)] });

        saveConfig();
        const [container, actionRow] = buildCategoryPanel(catKey, null, icon);
        const confirmedRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('cfg_back').setLabel('Retour').setEmoji('↩️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`cfg_save:${catKey}`).setLabel('Sauvegardé !').setEmoji('✅').setStyle(ButtonStyle.Success).setDisabled(true),
            new ButtonBuilder().setCustomId(`cfg_preview:${catKey}`).setLabel('Aperçu complet').setEmoji('👁️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`cfg_delete_confirm:${catKey}`).setLabel('Supprimer').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
        );
        return interaction.update({ components: [container, confirmedRow] });
    }

    if (id.startsWith('cfg_preview:')) {
        const catKey = id.split(':')[1];
        const cat    = config.ticketCategories[catKey];
        if (!cat) return interaction.reply({ content: '❌ Embed introuvable.', flags: MessageFlags.Ephemeral });
        return interaction.reply({
            content:    `-# Aperçu — **${cat.label}**`,
            embeds:     [buildTicketEmbed(catKey)],
            components: [buildTicketOpenRow(catKey)],
            flags:      MessageFlags.Ephemeral,
        });
    }

    if (id.startsWith('cfg_delete_confirm:')) {
        const catKey = id.split(':')[1];
        if (!config.ticketCategories[catKey])
            return interaction.update({ components: [buildMainPanel(icon)] });

        const [container, actionRow] = buildDeleteConfirmPanel(catKey);
        return interaction.update({ components: [container, actionRow] });
    }

    if (id.startsWith('cfg_delete_yes:')) {
        const catKey = id.split(':')[1];
        delete config.ticketCategories[catKey];
        saveConfig();
        return interaction.update({ components: [buildMainPanel(icon)] });
    }

    // ── Système de tickets
    if (id.startsWith('ticket_create:')) {
        const catKey = id.split(':')[1];
        const cat    = config.ticketCategories[catKey];

        if (!cat)
            return interaction.reply({ content: '❌ Cet embed n\'existe plus.', flags: MessageFlags.Ephemeral });

        const openTickets = getTickets();
        const existing    = Object.values(openTickets).find(t => t.userId === interaction.user.id);
        if (existing)
            return interaction.reply({ content: `❌ Tu as déjà un ticket ouvert : <#${existing.channelId}>`, flags: MessageFlags.Ephemeral });

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
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
            ],
        });

        const ticketInfo = { channelId: ticketChannel.id, userId: interaction.user.id, username: interaction.user.tag, openedAt: Date.now(), claimedBy: null, ticketNumber, catKey };
        openTickets[ticketChannel.id] = ticketInfo;
        saveTickets();

        await ticketChannel.send({
            content: `<@${interaction.user.id}>`,
            embeds: [
                new EmbedBuilder()
                    .setTitle(`${cat.label} — Ticket #${String(ticketNumber).padStart(4, '0')}`)
                    .setDescription(`Bonjour <@${interaction.user.id}>, bienvenue dans ton ticket.\nDécris ta demande et notre équipe reviendra vers toi rapidement.`)
                    .addFields(
                        { name: 'Ouvert par', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'Embed',  value: cat.label,                   inline: true },
                        { name: 'Ouvert le',  value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
                    )
                    .setColor(colorInt(cat.color))
                    .setFooter({ text: 'Eldoria — Système de tickets' }),
            ],
            components: [buildTicketControlRow()],
        });

        return interaction.editReply({ content: `✅ Ton ticket a été créé : <#${ticketChannel.id}>` });
    }

    if (id === 'ticket_claim') {
        const openTickets = getTickets();
        const ticketInfo  = openTickets[interaction.channelId];
        if (!ticketInfo) return interaction.reply({ content: '❌ Ticket introuvable.', flags: MessageFlags.Ephemeral });
        ticketInfo.claimedBy = interaction.user.tag;
        saveTickets();
        await interaction.message.edit({ components: [buildTicketControlRow(true, interaction.user.tag)] });
        return interaction.reply({ content: `🙋 Ticket pris en charge par **${interaction.user.tag}**.` });
    }

    if (id === 'ticket_close') {
        const openTickets = getTickets();
        const ticketInfo  = openTickets[interaction.channelId];
        if (!ticketInfo) return interaction.reply({ content: '❌ Ticket introuvable.', flags: MessageFlags.Ephemeral });

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
                                { name: 'Embed',   value: cat?.label ?? ticketInfo.catKey, inline: true },
                                { name: 'Utilisateur', value: `<@${ticketInfo.userId}> (${ticketInfo.username})`, inline: true },
                                { name: 'Fermé par',   value: interaction.user.tag, inline: true },
                                { name: 'Ouvert le',  value: `<t:${Math.floor(ticketInfo.openedAt / 1000)}:F>`, inline: false },
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
            await interaction.followUp({ content: '❌ Erreur : `' + err.message + '`', flags: MessageFlags.Ephemeral });
        }
    }
}

module.exports = { handleButton };
