const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Bot Eldoria running");
});

app.listen(3000, () => {
    console.log("Web server ready");
});

const {
    Client,
    GatewayIntentBits,
    ChannelType,
    Events,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    PermissionFlagsBits,
} = require('discord.js');
const fs   = require('fs');
const path = require('path');
const config = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// ─── Initialisation config tickets ────────────────────────────────────────────

if (!config.ticketCategoryId)          config.ticketCategoryId          = null;
if (!config.ticketTranscriptChannelId) config.ticketTranscriptChannelId = null;
if (!config.ticketCounter)             config.ticketCounter             = 0;
if (!config.ticketPanelConfig) {
    config.ticketPanelConfig = {
        title:       "🎫 Support Eldoria",
        description: "Clique sur le bouton ci-dessous pour ouvrir un ticket.\nNotre équipe te répondra dans les plus brefs délais.",
        color:       0xd4a853,
        buttonLabel: "Créer un ticket",
    };
}

// ─── Tickets en mémoire ────────────────────────────────────────────────────────
// Structure : { channelId: { userId, username, openedAt, claimedBy, ticketNumber } }

let openTickets = {};
const TICKETS_FILE = path.join(__dirname, 'tickets.json');

function loadTickets() {
    try {
        if (fs.existsSync(TICKETS_FILE))
            openTickets = JSON.parse(fs.readFileSync(TICKETS_FILE, 'utf-8'));
    } catch { openTickets = {}; }
}

function saveTickets() {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(openTickets, null, 2));
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function saveConfig() {
    fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(config, null, 4));
}

function hexToInt(hex) {
    const clean = hex.replace('#', '');
    const val = parseInt(clean, 16);
    return isNaN(val) ? 0xd4a853 : val;
}

// ─── Transcript HTML ──────────────────────────────────────────────────────────

async function generateTranscript(channel, ticketInfo) {
    const messages = [];
    let lastId;

    while (true) {
        const options = { limit: 100 };
        if (lastId) options.before = lastId;
        const fetched = await channel.messages.fetch(options);
        if (fetched.size === 0) break;
        messages.push(...fetched.values());
        lastId = fetched.last().id;
        if (fetched.size < 100) break;
    }

    messages.reverse();

    const rows = messages.map(m => {
        const time = new Date(m.createdTimestamp).toLocaleString('fr-FR');
        const avatar = m.author.displayAvatarURL({ size: 32, extension: 'png' });
        const content = m.content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            || '<em style="opacity:.4">— pas de texte —</em>';
        const attachments = [...m.attachments.values()]
            .map(a => `<a href="${a.url}" target="_blank">[📎 ${a.name}]</a>`)
            .join(' ');

        return `
        <div class="msg">
            <img class="avatar" src="${avatar}" alt="">
            <div class="body">
                <span class="author">${m.author.username}</span>
                <span class="time">${time}</span>
                <div class="content">${content} ${attachments}</div>
            </div>
        </div>`;
    }).join('');

    const openedAt = new Date(ticketInfo.openedAt).toLocaleString('fr-FR');
    const closedAt = new Date().toLocaleString('fr-FR');
    const claimed  = ticketInfo.claimedBy ? `<b>${ticketInfo.claimedBy}</b>` : '<em>Non claim</em>';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Transcript — ${channel.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #1e1f22; color: #dcddde; font-family: 'Segoe UI', sans-serif; font-size: 14px; }
  header { background: #2b2d31; border-bottom: 1px solid #1e1f22; padding: 20px 32px; display: flex; align-items: center; gap: 16px; }
  header h1 { font-size: 18px; font-weight: 600; color: #fff; }
  header .meta { font-size: 12px; color: #949ba4; margin-top: 4px; }
  header .badge { background: #d4a853; color: #1e1f22; font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 99px; }
  .msgs { padding: 24px 32px; display: flex; flex-direction: column; gap: 2px; }
  .msg { display: flex; gap: 12px; padding: 4px 8px; border-radius: 4px; }
  .msg:hover { background: rgba(255,255,255,.03); }
  .avatar { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; margin-top: 2px; }
  .body { flex: 1; min-width: 0; }
  .author { font-weight: 600; color: #fff; margin-right: 8px; }
  .time { font-size: 11px; color: #6d6f78; }
  .content { color: #dcddde; line-height: 1.5; margin-top: 2px; word-break: break-word; }
  .content a { color: #00aff4; }
  footer { padding: 20px 32px; border-top: 1px solid #2b2d31; font-size: 12px; color: #6d6f78; text-align: center; }
</style>
</head>
<body>
<header>
  <div>
    <div style="display:flex;align-items:center;gap:10px">
      <h1>#${channel.name}</h1>
      <span class="badge">Ticket #${String(ticketInfo.ticketNumber).padStart(4, '0')}</span>
    </div>
    <div class="meta">
      Ouvert par <b>${ticketInfo.username}</b> le ${openedAt} · Fermé le ${closedAt} · Claim : ${claimed}
    </div>
  </div>
</header>
<div class="msgs">${rows}</div>
<footer>Eldoria Bot — ${messages.length} message${messages.length > 1 ? 's' : ''}</footer>
</body>
</html>`;
}

// ─── Embed du panel de ticket ─────────────────────────────────────────────────

function buildPanelEmbed() {
    const cfg = config.ticketPanelConfig;
    return new EmbedBuilder()
        .setTitle(cfg.title)
        .setDescription(cfg.description)
        .setColor(typeof cfg.color === 'string' ? hexToInt(cfg.color) : cfg.color)
        .setFooter({ text: 'Eldoria — Système de tickets' });
}

function buildPanelRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('ticket_create')
            .setLabel(config.ticketPanelConfig.buttonLabel)
            .setEmoji('🎫')
            .setStyle(ButtonStyle.Primary)
    );
}

function buildTicketRow(claimed = false, claimerTag = null) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('ticket_close')
            .setLabel('Fermer le ticket')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('ticket_claim')
            .setLabel(claimed ? `Claim : ${claimerTag}` : 'Claim')
            .setEmoji(claimed ? '✅' : '🙋')
            .setStyle(claimed ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setDisabled(claimed),
    );
}

// ─── Forum tags ───────────────────────────────────────────────────────────────

const forumTags = [
    { name: "Social",         emoji: "💬", moderated: false },
    { name: "Exploration",    emoji: "🧭", moderated: false },
    { name: "Combat",         emoji: "⚔️", moderated: false },
    { name: "Event",          emoji: "🎉", moderated: true  },
    { name: "Ouvert",         emoji: "🌍", moderated: false },
    { name: "Sur Invitation", emoji: "📜", moderated: false },
    { name: "Privé",          emoji: "🔒", moderated: false },
    { name: "En Cours",       emoji: "🟢", moderated: false },
    { name: "Pause",          emoji: "⏸️", moderated: false },
    { name: "Terminé",        emoji: "✅", moderated: false },
];

async function recreateForums(guild) {
    const results = [];
    for (const channelId of config.textChannelsToConvert) {
        try {
            const channel = await guild.channels.fetch(channelId);
            if (!channel) { results.push(`⚠️ Salon \`${channelId}\` introuvable.`); continue; }

            const oldName        = channel.name;
            const oldTopic       = channel.topic || null;
            const oldPermissions = channel.permissionOverwrites.cache.map(p => ({
                id: p.id, allow: p.allow.bitfield, deny: p.deny.bitfield
            }));
            const oldCategory = channel.parentId || null;

            await channel.delete();

            const forum = await guild.channels.create({
                name: oldName, type: ChannelType.GuildForum,
                topic: oldTopic, permissionOverwrites: oldPermissions,
                parent: oldCategory, defaultThreadAppliedTagsRequired: true,
            });

            await forum.setAvailableTags(forumTags.map(tag => ({
                name: tag.name, emoji: { id: null, name: tag.emoji }, moderated: tag.moderated,
            })));

            results.push(`✅ \`${oldName}\` → forum recréé`);
        } catch (err) {
            console.error(`Erreur pour le salon ${channelId}:`, err);
            results.push(`❌ Erreur sur \`${channelId}\` : ${err.message}`);
        }
    }
    return results;
}

// ─── Ready ────────────────────────────────────────────────────────────────────

client.once(Events.ClientReady, () => {
    loadTickets();
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// ─── Interactions ─────────────────────────────────────────────────────────────

client.on(Events.InteractionCreate, async interaction => {

    // ── Slash commands ────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {

        // /recreate_forums
        if (interaction.commandName === 'recreate_forums') {
            if (!config.textChannelsToConvert.length)
                return interaction.reply({ content: '⚠️ Aucun salon configuré. Utilise `/add_channel` d\'abord.', ephemeral: true });

            await interaction.deferReply();
            const results = await recreateForums(interaction.guild);
            await interaction.editReply(`**Recréation terminée :**\n${results.join('\n')}`);
        }

        // /list_channels
        else if (interaction.commandName === 'list_channels') {
            if (!config.textChannelsToConvert.length)
                return interaction.reply({ content: 'Aucun salon configuré pour la conversion.', ephemeral: true });

            const list = config.textChannelsToConvert.map(id => `• <#${id}> (\`${id}\`)`).join('\n');
            await interaction.reply({ content: `**Salons configurés pour la conversion :**\n${list}`, ephemeral: true });
        }

        // /add_channel
        else if (interaction.commandName === 'add_channel') {
            const channelId = interaction.options.getString('channel_id');
            if (config.textChannelsToConvert.includes(channelId))
                return interaction.reply({ content: `⚠️ Le salon \`${channelId}\` est déjà dans la liste.`, ephemeral: true });

            try { await interaction.guild.channels.fetch(channelId); }
            catch { return interaction.reply({ content: `❌ Salon \`${channelId}\` introuvable sur ce serveur.`, ephemeral: true }); }

            config.textChannelsToConvert.push(channelId);
            saveConfig();
            await interaction.reply({ content: `✅ Salon <#${channelId}> ajouté à la liste de conversion.`, ephemeral: true });
        }

        // /serverinfo
        else if (interaction.commandName === 'serverinfo') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const guild = interaction.guild;
            await guild.fetch();

            const owner    = await guild.fetchOwner();
            const channels = guild.channels.cache;

            const textCount  = channels.filter(c => c.type === ChannelType.GuildText).size;
            const voiceCount = channels.filter(c => c.type === ChannelType.GuildVoice).size;
            const forumCount = channels.filter(c => c.type === ChannelType.GuildForum).size;
            const catCount   = channels.filter(c => c.type === ChannelType.GuildCategory).size;
            const roleCount  = guild.roles.cache.size - 1;

            const createdAt = `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`;

            const verificationLabels = { 0: 'Aucune', 1: 'Faible', 2: 'Moyenne', 3: 'Élevée', 4: 'Très élevée' };
            const verification = verificationLabels[guild.verificationLevel] ?? 'Inconnue';
            const boostTierLabels = { 0: 'Aucun', 1: 'Niveau 1', 2: 'Niveau 2', 3: 'Niveau 3' };
            const boostTier = boostTierLabels[guild.premiumTier] ?? 'Inconnu';
            const iconURL   = guild.iconURL({ size: 256, extension: 'png' }) ?? 'https://cdn.discordapp.com/embed/avatars/0.png';

            const container = new ContainerBuilder()
                .setAccentColor(0xd4a853)
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`# ${guild.name}\n-# ID : \`${guild.id}\``)
                        )
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(iconURL))
                )
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent([
                        `👑  **Propriétaire** : ${owner.user.username} (\`${owner.id}\`)`,
                        `👥  **Membres** : ${guild.memberCount.toLocaleString('fr-FR')}`,
                        `🎭  **Rôles** : ${roleCount}`,
                        `📅  **Créé le** : ${createdAt}`,
                        `🔐  **Vérification** : ${verification}`,
                    ].join('\n'))
                )
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent([
                        `**Salons**`,
                        `💬  Texte : **${textCount}**`,
                        `🔊  Vocal : **${voiceCount}**`,
                        `📋  Forum : **${forumCount}**`,
                        `📁  Catégorie : **${catCount}**`,
                    ].join('\n'))
                )
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent([
                        `**Boosts**`,
                        `✨  Niveau : **${boostTier}**`,
                        `🚀  Nombre : **${guild.premiumSubscriptionCount ?? 0}**`,
                    ].join('\n'))
                );

            await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        }

        // /ticket-panel send
        else if (interaction.commandName === 'ticket-panel' && interaction.options.getSubcommand() === 'send') {
            const channel = interaction.options.getChannel('salon');
            const cfg     = config.ticketPanelConfig;

            const modal = new ModalBuilder()
                .setCustomId(`ticket_panel_modal:${channel.id}`)
                .setTitle('Personnaliser le panel de tickets');

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('title')
                        .setLabel('Titre de l\'embed')
                        .setStyle(TextInputStyle.Short)
                        .setValue(cfg.title)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('description')
                        .setLabel('Description')
                        .setStyle(TextInputStyle.Paragraph)
                        .setValue(cfg.description)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('color')
                        .setLabel('Couleur hex (ex: #d4a853)')
                        .setStyle(TextInputStyle.Short)
                        .setValue(typeof cfg.color === 'number' ? '#' + cfg.color.toString(16).padStart(6, '0') : cfg.color)
                        .setRequired(false)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('button_label')
                        .setLabel('Texte du bouton')
                        .setStyle(TextInputStyle.Short)
                        .setValue(cfg.buttonLabel)
                        .setRequired(false)
                ),
            );

            await interaction.showModal(modal);
        }

        // /ticket-panel config
        else if (interaction.commandName === 'ticket-panel' && interaction.options.getSubcommand() === 'config') {
            const transcriptChannel = interaction.options.getChannel('transcript');
            const category          = interaction.options.getChannel('categorie');

            if (transcriptChannel) {
                config.ticketTranscriptChannelId = transcriptChannel.id;
            }
            if (category) {
                config.ticketCategoryId = category.id;
            }
            saveConfig();

            const lines = [];
            if (transcriptChannel) lines.push(`📋 Salon transcripts → <#${transcriptChannel.id}>`);
            if (category)          lines.push(`📁 Catégorie tickets → **${category.name}**`);

            await interaction.reply({ content: `✅ Configuration mise à jour :\n${lines.join('\n')}`, ephemeral: true });
        }
    }

    // ── Modal submits ─────────────────────────────────────────────────────────
    else if (interaction.isModalSubmit()) {

        if (interaction.customId.startsWith('ticket_panel_modal:')) {
            const channelId  = interaction.customId.split(':')[1];
            const title       = interaction.fields.getTextInputValue('title');
            const description = interaction.fields.getTextInputValue('description');
            const colorRaw    = interaction.fields.getTextInputValue('color').trim();
            const buttonLabel = interaction.fields.getTextInputValue('button_label').trim();

            config.ticketPanelConfig.title       = title;
            config.ticketPanelConfig.description = description;
            config.ticketPanelConfig.color       = colorRaw ? hexToInt(colorRaw) : config.ticketPanelConfig.color;
            if (buttonLabel) config.ticketPanelConfig.buttonLabel = buttonLabel;
            saveConfig();

            const targetChannel = await interaction.guild.channels.fetch(channelId);
            await targetChannel.send({ embeds: [buildPanelEmbed()], components: [buildPanelRow()] });

            await interaction.reply({ content: `✅ Panel envoyé dans <#${channelId}>.`, ephemeral: true });
        }
    }

    // ── Boutons ───────────────────────────────────────────────────────────────
    else if (interaction.isButton()) {

        // Bouton : créer un ticket
        if (interaction.customId === 'ticket_create') {
            const existingTicket = Object.values(openTickets).find(t => t.userId === interaction.user.id);
            if (existingTicket) {
                return interaction.reply({
                    content: `❌ Tu as déjà un ticket ouvert : <#${existingTicket.channelId}>`,
                    ephemeral: true,
                });
            }

            await interaction.deferReply({ ephemeral: true });

            config.ticketCounter = (config.ticketCounter || 0) + 1;
            saveConfig();

            const ticketNumber = config.ticketCounter;
            const channelName  = `ticket-${String(ticketNumber).padStart(4, '0')}-${interaction.user.username}`;

            const permOverwrites = [
                { id: interaction.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles,
                    ],
                },
            ];

            const ticketChannel = await interaction.guild.channels.create({
                name:               channelName,
                type:               ChannelType.GuildText,
                parent:             config.ticketCategoryId || null,
                permissionOverwrites: permOverwrites,
                topic:              `Ticket #${String(ticketNumber).padStart(4, '0')} — ${interaction.user.tag}`,
            });

            const ticketInfo = {
                channelId:    ticketChannel.id,
                userId:       interaction.user.id,
                username:     interaction.user.tag,
                openedAt:     Date.now(),
                claimedBy:    null,
                ticketNumber,
            };
            openTickets[ticketChannel.id] = ticketInfo;
            saveTickets();

            const embed = new EmbedBuilder()
                .setTitle(`🎫 Ticket #${String(ticketNumber).padStart(4, '0')}`)
                .setDescription(
                    `Bonjour <@${interaction.user.id}>, bienvenue dans ton ticket.\n` +
                    `Décris ton problème ou ta demande, notre équipe reviendra vers toi rapidement.`
                )
                .addFields(
                    { name: 'Ouvert par',  value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'Ouvert le',   value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                )
                .setColor(typeof config.ticketPanelConfig.color === 'string'
                    ? hexToInt(config.ticketPanelConfig.color)
                    : config.ticketPanelConfig.color)
                .setFooter({ text: 'Eldoria — Système de tickets' });

            await ticketChannel.send({
                content: `<@${interaction.user.id}>`,
                embeds:  [embed],
                components: [buildTicketRow()],
            });

            await interaction.editReply({ content: `✅ Ton ticket a été créé : <#${ticketChannel.id}>` });
        }

        // Bouton : claim
        else if (interaction.customId === 'ticket_claim') {
            const ticketInfo = openTickets[interaction.channelId];
            if (!ticketInfo) return interaction.reply({ content: '❌ Ticket introuvable.', ephemeral: true });

            ticketInfo.claimedBy = interaction.user.tag;
            saveTickets();

            await interaction.message.edit({
                components: [buildTicketRow(true, interaction.user.tag)],
            });

            await interaction.reply({ content: `🙋 Ticket claim par **${interaction.user.tag}**.` });
        }

        // Bouton : fermer le ticket
        else if (interaction.customId === 'ticket_close') {
            const ticketInfo = openTickets[interaction.channelId];
            if (!ticketInfo) return interaction.reply({ content: '❌ Ticket introuvable.', ephemeral: true });

            await interaction.reply({ content: '🔒 Fermeture du ticket en cours, génération du transcript...' });

            try {
                const html     = await generateTranscript(interaction.channel, ticketInfo);
                const fileName = `transcript-${interaction.channel.name}.html`;
                const tmpPath  = path.join('/tmp', fileName);
                fs.writeFileSync(tmpPath, html, 'utf-8');

                if (config.ticketTranscriptChannelId) {
                    const transcriptChannel = await interaction.guild.channels.fetch(config.ticketTranscriptChannelId);

                    const summaryEmbed = new EmbedBuilder()
                        .setTitle(`📋 Transcript — Ticket #${String(ticketInfo.ticketNumber).padStart(4, '0')}`)
                        .addFields(
                            { name: 'Utilisateur', value: `<@${ticketInfo.userId}> (${ticketInfo.username})`, inline: true },
                            { name: 'Fermé par',   value: interaction.user.tag, inline: true },
                            { name: 'Ouvert le',   value: `<t:${Math.floor(ticketInfo.openedAt / 1000)}:F>`, inline: false },
                            { name: 'Claim',       value: ticketInfo.claimedBy ?? 'Non claim', inline: true },
                        )
                        .setColor(0x5865f2)
                        .setTimestamp();

                    await transcriptChannel.send({
                        embeds: [summaryEmbed],
                        files:  [{ attachment: tmpPath, name: fileName }],
                    });
                }

                // Nettoyage
                if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

                delete openTickets[interaction.channelId];
                saveTickets();

                await interaction.channel.send('✅ Transcript généré. Suppression dans 5 secondes...');
                setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);

            } catch (err) {
                console.error('Erreur lors de la fermeture du ticket :', err);
                await interaction.followUp({ content: `❌ Erreur : ${err.message}`, ephemeral: true });
            }
        }
    }
});

client.login(process.env.TOKEN);