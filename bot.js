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
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// Liste des tags avec emojis et modération
const forumTags = [
    { name: "Social",        emoji: "💬", moderated: false },
    { name: "Exploration",   emoji: "🧭", moderated: false },
    { name: "Combat",        emoji: "⚔️", moderated: false },
    { name: "Event",         emoji: "🎉", moderated: true  },
    { name: "Ouvert",        emoji: "🌍", moderated: false },
    { name: "Sur Invitation",emoji: "📜", moderated: false },
    { name: "Privé",         emoji: "🔒", moderated: false },
    { name: "En Cours",      emoji: "🟢", moderated: false },
    { name: "Pause",         emoji: "⏸️", moderated: false },
    { name: "Terminé",       emoji: "✅", moderated: false }
];

// Sauvegarde la config (pour persister les ajouts de salons)
function saveConfig() {
    fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(config, null, 4));
}

// Recrée les salons texte en forums
async function recreateForums(guild) {
    const results = [];

    for (const channelId of config.textChannelsToConvert) {
        try {
            const channel = await guild.channels.fetch(channelId);

            if (!channel) {
                results.push(`⚠️ Salon \`${channelId}\` introuvable.`);
                continue;
            }

            const oldName = channel.name;
            const oldTopic = channel.topic || null;
            const oldPermissions = channel.permissionOverwrites.cache.map(p => ({
                id: p.id,
                allow: p.allow.bitfield,
                deny: p.deny.bitfield
            }));
            const oldCategory = channel.parentId || null;

            await channel.delete();

            const forum = await guild.channels.create({
                name: oldName,
                type: ChannelType.GuildForum,
                topic: oldTopic,
                permissionOverwrites: oldPermissions,
                parent: oldCategory,
                defaultThreadAppliedTagsRequired: true,
            });

            const newTags = forumTags.map(tag => ({
                name: tag.name,
                emoji: { id: null, name: tag.emoji },
                moderated: tag.moderated
            }));
            await forum.setAvailableTags(newTags);

            results.push(`✅ \`${oldName}\` → forum recréé`);

        } catch (err) {
            console.error(`Erreur pour le salon ${channelId}:`, err);
            results.push(`❌ Erreur sur \`${channelId}\` : ${err.message}`);
        }
    }

    return results;
}

// Quand le bot est prêt
client.once(Events.ClientReady, () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// Gestion des slash commands
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // /recreate_forums
    if (interaction.commandName === 'recreate_forums') {
        if (!config.textChannelsToConvert.length) {
            return interaction.reply({
                content: '⚠️ Aucun salon configuré. Utilise `/add_channel` d\'abord.',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        const guild = interaction.guild;
        const results = await recreateForums(guild);

        await interaction.editReply(
            `**Recréation terminée :**\n${results.join('\n')}`
        );
    }

    // /list_channels
    else if (interaction.commandName === 'list_channels') {
        if (!config.textChannelsToConvert.length) {
            return interaction.reply({
                content: 'Aucun salon configuré pour la conversion.',
                ephemeral: true
            });
        }

        const list = config.textChannelsToConvert
            .map(id => `• <#${id}> (\`${id}\`)`)
            .join('\n');

        await interaction.reply({
            content: `**Salons configurés pour la conversion :**\n${list}`,
            ephemeral: true
        });
    }

    // /add_channel
    else if (interaction.commandName === 'add_channel') {
        const channelId = interaction.options.getString('channel_id');

        if (config.textChannelsToConvert.includes(channelId)) {
            return interaction.reply({
                content: `⚠️ Le salon \`${channelId}\` est déjà dans la liste.`,
                ephemeral: true
            });
        }

        // Vérifie que le salon existe bien
        try {
            await interaction.guild.channels.fetch(channelId);
        } catch {
            return interaction.reply({
                content: `❌ Salon \`${channelId}\` introuvable sur ce serveur.`,
                ephemeral: true
            });
        }

        config.textChannelsToConvert.push(channelId);
        saveConfig();

        await interaction.reply({
            content: `✅ Salon <#${channelId}> ajouté à la liste de conversion.`,
            ephemeral: true
        });
    }

    // /serverinfo
    else if (interaction.commandName === 'serverinfo') {
        const guild = interaction.guild;
        await guild.fetch();

        const owner = await guild.fetchOwner();
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

        const iconURL = guild.iconURL({ size: 256, extension: 'png' })
            ?? 'https://cdn.discordapp.com/embed/avatars/0.png';

        const container = new ContainerBuilder()
            .setAccentColor(0xd4a853)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent(`# ${guild.name}\n-# ID : \`${guild.id}\``)
                    )
                    .setThumbnailAccessory(
                        new ThumbnailBuilder().setURL(iconURL)
                    )
            )
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    [
                        `👑  **Propriétaire** : ${owner.user.username} (\`${owner.id}\`)`,
                        `👥  **Membres** : ${guild.memberCount.toLocaleString('fr-FR')}`,
                        `🎭  **Rôles** : ${roleCount}`,
                        `📅  **Créé le** : ${createdAt}`,
                        `🔐  **Vérification** : ${verification}`,
                    ].join('\n')
                )
            )
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    [
                        `**Salons**`,
                        `💬  Texte : **${textCount}**`,
                        `🔊  Vocal : **${voiceCount}**`,
                        `📋  Forum : **${forumCount}**`,
                        `📁  Catégorie : **${catCount}**`,
                    ].join('\n')
                )
            )
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    [
                        `**Boosts**`,
                        `✨  Niveau : **${boostTier}**`,
                        `🚀  Nombre : **${guild.premiumSubscriptionCount ?? 0}**`,
                    ].join('\n')
                )
            );

        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    }
});

client.login(process.env.TOKEN);