const express = require("express");
const app = express();
app.get("/", (req, res) => res.send("Bot Eldoria running"));
app.listen(3000, () => console.log("Web server ready"));

const {
    Client, GatewayIntentBits, ChannelType, Events, MessageFlags,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SectionBuilder, ThumbnailBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    EmbedBuilder, PermissionFlagsBits,
} = require('discord.js');
const fs   = require('fs');
const path = require('path');
const config = require('./config.json');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// ─── Initialisation config ────────────────────────────────────────────────────

if (!config.ticketCategories)          config.ticketCategories          = {};
if (!config.ticketTranscriptChannelId) config.ticketTranscriptChannelId = null;
if (!config.ticketCounter)             config.ticketCounter             = 0;

// ─── Tickets persistants ──────────────────────────────────────────────────────

let openTickets = {};
const TICKETS_FILE = path.join(__dirname, 'tickets.json');

function loadTickets() {
    try { if (fs.existsSync(TICKETS_FILE)) openTickets = JSON.parse(fs.readFileSync(TICKETS_FILE, 'utf-8')); }
    catch { openTickets = {}; }
}
function saveTickets() { fs.writeFileSync(TICKETS_FILE, JSON.stringify(openTickets, null, 2)); }
function saveConfig()  { fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(config, null, 4)); }

function hexToInt(hex) { const v = parseInt(hex.replace('#',''), 16); return isNaN(v) ? 0x5865f2 : v; }
function intToHex(n)   { return '#' + (typeof n === 'number' ? n : 0x5865f2).toString(16).padStart(6,'0'); }
function colorInt(c)   { return typeof c === 'number' ? c : hexToInt(c); }

// Génère une clé unique à partir d'un label (ex: "Support RP" → "support_rp")
function slugify(str) {
    return str.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 24) || 'categorie_' + Date.now();
}

// Assure l'unicité de la clé
function uniqueKey(label) {
    const base = slugify(label);
    if (!config.ticketCategories[base]) return base;
    let i = 2;
    while (config.ticketCategories[`${base}_${i}`]) i++;
    return `${base}_${i}`;
}

// ─── Forum tags ───────────────────────────────────────────────────────────────

const forumTags = [
    { name:"Social",emoji:"💬",moderated:false }, { name:"Exploration",emoji:"🧭",moderated:false },
    { name:"Combat",emoji:"⚔️",moderated:false }, { name:"Event",emoji:"🎉",moderated:true },
    { name:"Ouvert",emoji:"🌍",moderated:false }, { name:"Sur Invitation",emoji:"📜",moderated:false },
    { name:"Privé",emoji:"🔒",moderated:false },  { name:"En Cours",emoji:"🟢",moderated:false },
    { name:"Pause",emoji:"⏸️",moderated:false },  { name:"Terminé",emoji:"✅",moderated:false },
];

async function recreateForums(guild) {
    const results = [];
    for (const channelId of config.textChannelsToConvert) {
        try {
            const channel = await guild.channels.fetch(channelId);
            if (!channel) { results.push(`⚠️ Salon \`${channelId}\` introuvable.`); continue; }
            const { name:oldName, topic:oldTopic, parentId:oldCategory } = channel;
            const oldPerms = channel.permissionOverwrites.cache.map(p => ({ id:p.id, allow:p.allow.bitfield, deny:p.deny.bitfield }));
            await channel.delete();
            const forum = await guild.channels.create({ name:oldName, type:ChannelType.GuildForum, topic:oldTopic||null, permissionOverwrites:oldPerms, parent:oldCategory||null, defaultThreadAppliedTagsRequired:true });
            await forum.setAvailableTags(forumTags.map(t => ({ name:t.name, emoji:{id:null,name:t.emoji}, moderated:t.moderated })));
            results.push(`✅ \`${oldName}\` → forum recréé`);
        } catch (err) { results.push(`❌ Erreur sur \`${channelId}\` : ${err.message}`); }
    }
    return results;
}

// ─── Builders — panels tickets ────────────────────────────────────────────────

function buildTicketEmbed(catKey) {
    const cat = config.ticketCategories[catKey];
    return new EmbedBuilder()
        .setTitle(cat.title).setDescription(cat.description)
        .setColor(colorInt(cat.color)).setFooter({ text: 'Eldoria — Système de tickets' });
}

function buildTicketPanelRow(catKey) {
    const cat = config.ticketCategories[catKey];
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`ticket_create:${catKey}`)
            .setLabel(cat.buttonLabel)
            .setEmoji('🎫')
            .setStyle(ButtonStyle.Primary)
    );
}

function buildTicketControlRow(claimed = false, claimerTag = null) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_close').setLabel('Fermer').setEmoji('🔒').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('ticket_claim')
            .setLabel(claimed ? `Claim : ${claimerTag}` : 'Claim')
            .setEmoji(claimed ? '✅' : '🙋')
            .setStyle(claimed ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setDisabled(claimed),
    );
}

// ─── Panel de configuration Components V2 (dynamique) ────────────────────────

function buildConfigPanel() {
    const cats       = config.ticketCategories;
    const catKeys    = Object.keys(cats);
    const transcript = config.ticketTranscriptChannelId
        ? `<#${config.ticketTranscriptChannelId}>`
        : '`Non configuré`';

    const container = new ContainerBuilder()
        .setAccentColor(0xd4a853)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `# ⚙️ Configuration — Tickets\n` +
                `-# ${catKeys.length} catégorie${catKeys.length > 1 ? 's' : ''}  ·  Transcripts : ${transcript}`
            )
        );

    if (catKeys.length === 0) {
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('-# Aucune catégorie configurée. Crée-en une ci-dessous.')
        );
    }

    for (const catKey of catKeys) {
        const c        = cats[catKey];
        const colorHex = typeof c.color === 'number' ? intToHex(c.color) : (c.color ?? '#5865f2');
        const catId    = c.categoryId ? `<#${c.categoryId}>` : '`Non définie`';

        container
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**${c.label}**  \`${catKey}\`\n` +
                    `Titre : *${c.title}*\n` +
                    `Couleur : \`${colorHex}\`  ·  Catégorie Discord : ${catId}\n` +
                    `Bouton : *${c.buttonLabel}*`
                )
            )
            .addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`cfg_edit:${catKey}`).setLabel('Modifier').setEmoji('✏️').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`cfg_setcat:${catKey}`).setLabel('Catégorie Discord').setEmoji('📁').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`cfg_send:${catKey}`).setLabel('Envoyer le panel').setEmoji('📤').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId(`cfg_delete:${catKey}`).setLabel('Supprimer').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
                )
            );
    }

    container
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Paramètres globaux'))
        .addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('cfg_create').setLabel('Nouvelle catégorie').setEmoji('➕').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('cfg_transcript').setLabel('Salon transcripts').setEmoji('📋').setStyle(ButtonStyle.Secondary),
            )
        );

    return container;
}

// ─── Transcript HTML ──────────────────────────────────────────────────────────

async function generateTranscript(channel, ticketInfo) {
    const messages = [];
    let lastId;
    while (true) {
        const opts = { limit: 100 };
        if (lastId) opts.before = lastId;
        const fetched = await channel.messages.fetch(opts);
        if (!fetched.size) break;
        messages.push(...fetched.values());
        lastId = fetched.last().id;
        if (fetched.size < 100) break;
    }
    messages.reverse();

    const catLabel = config.ticketCategories[ticketInfo.catKey]?.label ?? ticketInfo.catKey;
    const openedAt = new Date(ticketInfo.openedAt).toLocaleString('fr-FR');
    const closedAt = new Date().toLocaleString('fr-FR');
    const claimed  = ticketInfo.claimedBy ? `<b>${ticketInfo.claimedBy}</b>` : '<em>Non claim</em>';

    const rows = messages.map(m => {
        const time    = new Date(m.createdTimestamp).toLocaleString('fr-FR');
        const avatar  = m.author.displayAvatarURL({ size:32, extension:'png' });
        const content = m.content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>') || '<em style="opacity:.4">— pas de texte —</em>';
        const files   = [...m.attachments.values()].map(a => `<a href="${a.url}" target="_blank">[📎 ${a.name}]</a>`).join(' ');
        return `<div class="msg"><img class="av" src="${avatar}" alt=""><div class="b"><span class="au">${m.author.username}</span><span class="ti">${time}</span><div class="co">${content} ${files}</div></div></div>`;
    }).join('');

    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Transcript — ${channel.name}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#1e1f22;color:#dcddde;font-family:'Segoe UI',sans-serif;font-size:14px}
header{background:#2b2d31;border-bottom:1px solid #111;padding:20px 32px}h1{font-size:18px;font-weight:600;color:#fff;display:flex;align-items:center;gap:8px}
.meta{font-size:12px;color:#949ba4;margin-top:4px}.badge{font-size:11px;font-weight:700;padding:2px 10px;border-radius:99px}
.b1{background:#d4a853;color:#1e1f22}.b2{background:#5865f2;color:#fff}
.msgs{padding:24px 32px;display:flex;flex-direction:column;gap:2px}
.msg{display:flex;gap:12px;padding:4px 8px;border-radius:4px}.msg:hover{background:rgba(255,255,255,.03)}
.av{width:36px;height:36px;border-radius:50%;flex-shrink:0;margin-top:2px}.b{flex:1;min-width:0}
.au{font-weight:600;color:#fff;margin-right:8px}.ti{font-size:11px;color:#6d6f78}
.co{color:#dcddde;line-height:1.5;margin-top:2px;word-break:break-word}.co a{color:#00aff4}
footer{padding:16px 32px;border-top:1px solid #2b2d31;font-size:12px;color:#6d6f78;text-align:center}</style>
</head><body>
<header>
  <h1>#${channel.name}<span class="badge b1">Ticket #${String(ticketInfo.ticketNumber).padStart(4,'0')}</span><span class="badge b2">${catLabel}</span></h1>
  <div class="meta">Ouvert par <b>${ticketInfo.username}</b> le ${openedAt} · Fermé le ${closedAt} · Claim : ${claimed}</div>
</header>
<div class="msgs">${rows}</div>
<footer>Eldoria Bot — ${messages.length} message${messages.length>1?'s':''}</footer>
</body></html>`;
}

// ─── Ready ────────────────────────────────────────────────────────────────────

client.once(Events.ClientReady, () => {
    loadTickets();
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// ─── Interactions ─────────────────────────────────────────────────────────────

client.on(Events.InteractionCreate, async interaction => {

    // ══ Autocomplete ══════════════════════════════════════════════════════════
    if (interaction.isAutocomplete()) {
        if (interaction.commandName === 'ticket-panel') {
            const focused = interaction.options.getFocused().toLowerCase();
            const choices = Object.entries(config.ticketCategories)
                .filter(([key, cat]) => key.includes(focused) || cat.label.toLowerCase().includes(focused))
                .slice(0, 25)
                .map(([key, cat]) => ({ name: cat.label, value: key }));
            return interaction.respond(choices);
        }
    }

    // ══ Slash commands ════════════════════════════════════════════════════════
    else if (interaction.isChatInputCommand()) {

        if (interaction.commandName === 'recreate_forums') {
            if (!config.textChannelsToConvert?.length) return interaction.reply({ content:'⚠️ Aucun salon configuré.', ephemeral:true });
            await interaction.deferReply();
            await interaction.editReply(`**Recréation terminée :**\n${(await recreateForums(interaction.guild)).join('\n')}`);
        }

        else if (interaction.commandName === 'list_channels') {
            if (!config.textChannelsToConvert?.length) return interaction.reply({ content:'Aucun salon configuré.', ephemeral:true });
            await interaction.reply({ content:`**Salons configurés :**\n${config.textChannelsToConvert.map(id=>`• <#${id}> (\`${id}\`)`).join('\n')}`, ephemeral:true });
        }

        else if (interaction.commandName === 'add_channel') {
            const channelId = interaction.options.getString('channel_id');
            if (config.textChannelsToConvert.includes(channelId)) return interaction.reply({ content:'⚠️ Déjà dans la liste.', ephemeral:true });
            try { await interaction.guild.channels.fetch(channelId); } catch { return interaction.reply({ content:'❌ Salon introuvable.', ephemeral:true }); }
            config.textChannelsToConvert.push(channelId); saveConfig();
            await interaction.reply({ content:`✅ Salon <#${channelId}> ajouté.`, ephemeral:true });
        }

        else if (interaction.commandName === 'serverinfo') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const guild = interaction.guild; await guild.fetch();
            const owner  = await guild.fetchOwner();
            const ch     = guild.channels.cache;
            const iconURL = guild.iconURL({ size:256, extension:'png' }) ?? 'https://cdn.discordapp.com/embed/avatars/0.png';
            const verLabels = {0:'Aucune',1:'Faible',2:'Moyenne',3:'Élevée',4:'Très élevée'};
            const bstLabels = {0:'Aucun',1:'Niveau 1',2:'Niveau 2',3:'Niveau 3'};

            const container = new ContainerBuilder().setAccentColor(0xd4a853)
                .addSectionComponents(new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${guild.name}\n-# ID : \`${guild.id}\``))
                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(iconURL)))
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent([
                    `👑  **Propriétaire** : ${owner.user.username} (\`${owner.id}\`)`,
                    `👥  **Membres** : ${guild.memberCount.toLocaleString('fr-FR')}`,
                    `🎭  **Rôles** : ${guild.roles.cache.size - 1}`,
                    `📅  **Créé le** : <t:${Math.floor(guild.createdTimestamp/1000)}:D>`,
                    `🔐  **Vérification** : ${verLabels[guild.verificationLevel]??'Inconnue'}`,
                ].join('\n')))
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent([
                    `**Salons**`,
                    `💬  Texte : **${ch.filter(c=>c.type===ChannelType.GuildText).size}**`,
                    `🔊  Vocal : **${ch.filter(c=>c.type===ChannelType.GuildVoice).size}**`,
                    `📋  Forum : **${ch.filter(c=>c.type===ChannelType.GuildForum).size}**`,
                    `📁  Catégorie : **${ch.filter(c=>c.type===ChannelType.GuildCategory).size}**`,
                ].join('\n')))
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent([
                    `**Boosts**`,
                    `✨  Niveau : **${bstLabels[guild.premiumTier]??'Inconnu'}**`,
                    `🚀  Nombre : **${guild.premiumSubscriptionCount??0}**`,
                ].join('\n')));

            await interaction.editReply({ components:[container], flags:MessageFlags.IsComponentsV2 });
        }

        // /ticket-config
        else if (interaction.commandName === 'ticket-config') {
            await interaction.reply({
                components: [buildConfigPanel()],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            });
        }

        // /ticket-panel <categorie> <salon>
        else if (interaction.commandName === 'ticket-panel') {
            const catKey  = interaction.options.getString('categorie');
            const channel = interaction.options.getChannel('salon');

            if (!config.ticketCategories[catKey])
                return interaction.reply({ content:`❌ Catégorie \`${catKey}\` introuvable. Utilise \`/ticket-config\` pour voir les catégories disponibles.`, ephemeral:true });

            await channel.send({ embeds:[buildTicketEmbed(catKey)], components:[buildTicketPanelRow(catKey)] });
            await interaction.reply({ content:`✅ Panel **${config.ticketCategories[catKey].label}** envoyé dans <#${channel.id}>.`, ephemeral:true });
        }
    }

    // ══ Modals ════════════════════════════════════════════════════════════════
    else if (interaction.isModalSubmit()) {

        // Créer une nouvelle catégorie
        if (interaction.customId === 'cfg_modal_create') {
            const label       = interaction.fields.getTextInputValue('label').trim();
            const title       = interaction.fields.getTextInputValue('title').trim();
            const description = interaction.fields.getTextInputValue('description').trim();
            const colorRaw    = interaction.fields.getTextInputValue('color').trim();
            const buttonLabel = interaction.fields.getTextInputValue('button_label').trim();

            const catKey = uniqueKey(label);

            config.ticketCategories[catKey] = {
                label,
                title,
                description,
                color:       colorRaw ? hexToInt(colorRaw) : 0x5865f2,
                buttonLabel: buttonLabel || `Ouvrir un ticket ${label}`,
                categoryId:  null,
            };
            saveConfig();

            await interaction.reply({
                components: [buildConfigPanel()],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            });
        }

        // Modifier une catégorie existante
        else if (interaction.customId.startsWith('cfg_modal_edit:')) {
            const catKey = interaction.customId.split(':')[1];
            const cat    = config.ticketCategories[catKey];
            if (!cat) return interaction.reply({ content:'❌ Catégorie introuvable.', ephemeral:true });

            cat.title       = interaction.fields.getTextInputValue('title');
            cat.description = interaction.fields.getTextInputValue('description');
            const colorRaw  = interaction.fields.getTextInputValue('color').trim();
            const btnLabel  = interaction.fields.getTextInputValue('button_label').trim();
            if (colorRaw) cat.color = hexToInt(colorRaw);
            if (btnLabel) cat.buttonLabel = btnLabel;
            saveConfig();

            await interaction.reply({
                components: [buildConfigPanel()],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            });
        }

        // Définir la catégorie Discord d'un type de ticket
        else if (interaction.customId.startsWith('cfg_modal_setcat:')) {
            const catKey  = interaction.customId.split(':')[1];
            const inputId = interaction.fields.getTextInputValue('category_id').trim();
            try {
                const discordCat = await interaction.guild.channels.fetch(inputId);
                if (discordCat.type !== ChannelType.GuildCategory)
                    return interaction.reply({ content:'❌ Ce salon n\'est pas une catégorie Discord.', ephemeral:true });
                config.ticketCategories[catKey].categoryId = inputId;
                saveConfig();
                await interaction.reply({ components:[buildConfigPanel()], flags:MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
            } catch { await interaction.reply({ content:'❌ Catégorie Discord introuvable.', ephemeral:true }); }
        }

        // Envoyer un panel depuis le config
        else if (interaction.customId.startsWith('cfg_modal_send:')) {
            const catKey    = interaction.customId.split(':')[1];
            const channelId = interaction.fields.getTextInputValue('send_channel_id').trim();
            try {
                const targetChannel = await interaction.guild.channels.fetch(channelId);
                await targetChannel.send({ embeds:[buildTicketEmbed(catKey)], components:[buildTicketPanelRow(catKey)] });
                await interaction.reply({ content:`✅ Panel **${config.ticketCategories[catKey].label}** envoyé dans <#${channelId}>.`, ephemeral:true });
            } catch { await interaction.reply({ content:'❌ Impossible d\'envoyer dans ce salon.', ephemeral:true }); }
        }

        // Salon transcripts
        else if (interaction.customId === 'cfg_modal_transcript') {
            const channelId = interaction.fields.getTextInputValue('transcript_id').trim();
            try {
                await interaction.guild.channels.fetch(channelId);
                config.ticketTranscriptChannelId = channelId;
                saveConfig();
                await interaction.reply({ components:[buildConfigPanel()], flags:MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
            } catch { await interaction.reply({ content:'❌ Salon introuvable.', ephemeral:true }); }
        }
    }

    // ══ Boutons ═══════════════════════════════════════════════════════════════
    else if (interaction.isButton()) {

        // ── Config panel ──────────────────────────────────────────────────────

        // Créer une nouvelle catégorie
        if (interaction.customId === 'cfg_create') {
            const modal = new ModalBuilder().setCustomId('cfg_modal_create').setTitle('Nouvelle catégorie de tickets');
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('label').setLabel('Nom (affiché dans le panel)').setStyle(TextInputStyle.Short)
                        .setPlaceholder('ex: 🎫 Support VIP').setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('title').setLabel('Titre de l\'embed').setStyle(TextInputStyle.Short)
                        .setPlaceholder('ex: 🎫 Support VIP').setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('description').setLabel('Description de l\'embed').setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('ex: Ouvre un ticket pour un support prioritaire.').setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('color').setLabel('Couleur hex (optionnel)').setStyle(TextInputStyle.Short)
                        .setPlaceholder('#5865f2').setRequired(false)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('button_label').setLabel('Texte du bouton (optionnel)').setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ouvrir un ticket').setRequired(false)
                ),
            );
            await interaction.showModal(modal);
        }

        // Modifier une catégorie
        else if (interaction.customId.startsWith('cfg_edit:')) {
            const catKey = interaction.customId.split(':')[1];
            const cat    = config.ticketCategories[catKey];
            if (!cat) return interaction.reply({ content:'❌ Catégorie introuvable.', ephemeral:true });

            const modal = new ModalBuilder().setCustomId(`cfg_modal_edit:${catKey}`).setTitle(`Modifier — ${cat.label}`);
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Titre').setStyle(TextInputStyle.Short).setValue(cat.title).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setValue(cat.description).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('color').setLabel('Couleur hex').setStyle(TextInputStyle.Short).setValue(typeof cat.color==='number'?intToHex(cat.color):(cat.color??'#5865f2')).setRequired(false)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('button_label').setLabel('Texte du bouton').setStyle(TextInputStyle.Short).setValue(cat.buttonLabel).setRequired(false)),
            );
            await interaction.showModal(modal);
        }

        // Définir la catégorie Discord
        else if (interaction.customId.startsWith('cfg_setcat:')) {
            const catKey = interaction.customId.split(':')[1];
            const cat    = config.ticketCategories[catKey];
            if (!cat) return interaction.reply({ content:'❌ Catégorie introuvable.', ephemeral:true });

            const modal = new ModalBuilder().setCustomId(`cfg_modal_setcat:${catKey}`).setTitle(`Catégorie Discord — ${cat.label}`);
            modal.addComponents(new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('category_id').setLabel('ID de la catégorie Discord').setStyle(TextInputStyle.Short)
                    .setValue(cat.categoryId??'').setPlaceholder('Clic droit sur la catégorie → Copier l\'identifiant').setRequired(true)
            ));
            await interaction.showModal(modal);
        }

        // Envoyer un panel
        else if (interaction.customId.startsWith('cfg_send:')) {
            const catKey = interaction.customId.split(':')[1];
            const cat    = config.ticketCategories[catKey];
            if (!cat) return interaction.reply({ content:'❌ Catégorie introuvable.', ephemeral:true });

            const modal = new ModalBuilder().setCustomId(`cfg_modal_send:${catKey}`).setTitle(`Envoyer — ${cat.label}`);
            modal.addComponents(new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('send_channel_id').setLabel('ID du salon de destination').setStyle(TextInputStyle.Short)
                    .setPlaceholder('Clic droit sur le salon → Copier l\'identifiant').setRequired(true)
            ));
            await interaction.showModal(modal);
        }

        // Supprimer une catégorie
        else if (interaction.customId.startsWith('cfg_delete:')) {
            const catKey = interaction.customId.split(':')[1];
            const cat    = config.ticketCategories[catKey];
            if (!cat) return interaction.reply({ content:'❌ Catégorie introuvable.', ephemeral:true });

            const label = cat.label;
            delete config.ticketCategories[catKey];
            saveConfig();

            await interaction.reply({
                components: [buildConfigPanel()],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            });

            // Message de confirmation rapide (pas de moyen natif de toast dans CV2)
            await interaction.followUp({ content:`🗑️ Catégorie **${label}** supprimée.`, ephemeral:true });
        }

        // Salon transcripts
        else if (interaction.customId === 'cfg_transcript') {
            const modal = new ModalBuilder().setCustomId('cfg_modal_transcript').setTitle('Salon des transcripts');
            modal.addComponents(new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('transcript_id').setLabel('ID du salon transcripts').setStyle(TextInputStyle.Short)
                    .setValue(config.ticketTranscriptChannelId??'').setPlaceholder('Clic droit sur le salon → Copier l\'identifiant').setRequired(true)
            ));
            await interaction.showModal(modal);
        }

        // ── Tickets ───────────────────────────────────────────────────────────

        else if (interaction.customId.startsWith('ticket_create:')) {
            const catKey = interaction.customId.split(':')[1];
            const cat    = config.ticketCategories[catKey];
            if (!cat) return interaction.reply({ content:'❌ Cette catégorie de ticket n\'existe plus.', ephemeral:true });

            const existing = Object.values(openTickets).find(t => t.userId === interaction.user.id);
            if (existing) return interaction.reply({ content:`❌ Tu as déjà un ticket ouvert : <#${existing.channelId}>`, ephemeral:true });

            await interaction.deferReply({ ephemeral:true });

            config.ticketCounter = (config.ticketCounter||0) + 1;
            saveConfig();

            const ticketNumber = config.ticketCounter;
            const channelName  = `ticket-${String(ticketNumber).padStart(4,'0')}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g,'-').slice(0,32);

            const ticketChannel = await interaction.guild.channels.create({
                name: channelName, type: ChannelType.GuildText,
                parent: cat.categoryId || null,
                topic: `Ticket #${String(ticketNumber).padStart(4,'0')} — ${interaction.user.tag} — ${cat.label}`,
                permissionOverwrites: [
                    { id:interaction.guild.roles.everyone, deny:[PermissionFlagsBits.ViewChannel] },
                    { id:interaction.user.id, allow:[PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
                ],
            });

            const ticketInfo = { channelId:ticketChannel.id, userId:interaction.user.id, username:interaction.user.tag, openedAt:Date.now(), claimedBy:null, ticketNumber, catKey };
            openTickets[ticketChannel.id] = ticketInfo;
            saveTickets();

            await ticketChannel.send({
                content: `<@${interaction.user.id}>`,
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`${cat.label} — Ticket #${String(ticketNumber).padStart(4,'0')}`)
                        .setDescription(`Bonjour <@${interaction.user.id}>, bienvenue dans ton ticket.\nDécris ta demande, notre équipe reviendra vers toi rapidement.`)
                        .addFields(
                            { name:'Ouvert par', value:`<@${interaction.user.id}>`, inline:true },
                            { name:'Catégorie',  value:cat.label, inline:true },
                            { name:'Ouvert le',  value:`<t:${Math.floor(Date.now()/1000)}:F>`, inline:false },
                        )
                        .setColor(colorInt(cat.color))
                        .setFooter({ text:'Eldoria — Système de tickets' }),
                ],
                components: [buildTicketControlRow()],
            });

            await interaction.editReply({ content:`✅ Ton ticket a été créé : <#${ticketChannel.id}>` });
        }

        else if (interaction.customId === 'ticket_claim') {
            const ticketInfo = openTickets[interaction.channelId];
            if (!ticketInfo) return interaction.reply({ content:'❌ Ticket introuvable.', ephemeral:true });
            ticketInfo.claimedBy = interaction.user.tag;
            saveTickets();
            await interaction.message.edit({ components:[buildTicketControlRow(true, interaction.user.tag)] });
            await interaction.reply({ content:`🙋 Ticket claim par **${interaction.user.tag}**.` });
        }

        else if (interaction.customId === 'ticket_close') {
            const ticketInfo = openTickets[interaction.channelId];
            if (!ticketInfo) return interaction.reply({ content:'❌ Ticket introuvable.', ephemeral:true });

            await interaction.reply({ content:'🔒 Fermeture en cours, génération du transcript...' });

            try {
                const html    = await generateTranscript(interaction.channel, ticketInfo);
                const fname   = `transcript-${interaction.channel.name}.html`;
                const tmpPath = path.join('/tmp', fname);
                fs.writeFileSync(tmpPath, html, 'utf-8');

                if (config.ticketTranscriptChannelId) {
                    const tsChan = await interaction.guild.channels.fetch(config.ticketTranscriptChannelId);
                    const cat    = config.ticketCategories[ticketInfo.catKey];
                    await tsChan.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(`📋 Transcript — Ticket #${String(ticketInfo.ticketNumber).padStart(4,'0')}`)
                                .addFields(
                                    { name:'Catégorie',   value:cat?.label??ticketInfo.catKey, inline:true },
                                    { name:'Utilisateur', value:`<@${ticketInfo.userId}> (${ticketInfo.username})`, inline:true },
                                    { name:'Fermé par',   value:interaction.user.tag, inline:true },
                                    { name:'Ouvert le',   value:`<t:${Math.floor(ticketInfo.openedAt/1000)}:F>`, inline:false },
                                    { name:'Claim',       value:ticketInfo.claimedBy??'Non claim', inline:true },
                                )
                                .setColor(colorInt(cat?.color??0x5865f2))
                                .setTimestamp(),
                        ],
                        files: [{ attachment:tmpPath, name:fname }],
                    });
                }

                if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
                delete openTickets[interaction.channelId];
                saveTickets();

                await interaction.channel.send('✅ Transcript généré. Suppression dans 5 secondes...');
                setTimeout(() => interaction.channel.delete().catch(()=>{}), 5000);

            } catch (err) {
                console.error('Erreur fermeture ticket :', err);
                await interaction.followUp({ content:`❌ Erreur : ${err.message}`, ephemeral:true });
            }
        }
    }
});

client.login(process.env.TOKEN);