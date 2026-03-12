const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot Eldoria running");
});

app.listen(3000, () => {
  console.log("Web server ready");
});


const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const config = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Liste des tags avec emojis et modération
const forumTags = [
    { name: "Social", emoji: "💬", moderated: false },
    { name: "Exploration", emoji: "🧭", moderated: false },
    { name: "Combat", emoji: "⚔️", moderated: false },
    { name: "Event", emoji: "🎉", moderated: true }, // Modérateurs seulement
    { name: "Ouvert", emoji: "🌍", moderated: false },
    { name: "Sur Invitation", emoji: "📜", moderated: false },
    { name: "Privé", emoji: "🔒", moderated: false },
    { name: "En Cours", emoji: "🟢", moderated: false },
    { name: "Pause", emoji: "⏸️", moderated: false },
    { name: "Terminé", emoji: "✅", moderated: false }
];

client.once('ready', async () => {
    console.log(`Connecté en tant que ${client.user.tag}!`);

    const guild = await client.guilds.fetch(config.guildId);

    for (const channelId of config.textChannelsToConvert) {
        try {
            const channel = await guild.channels.fetch(channelId);

            if (!channel) {
                console.log(`⚠️ Le salon ${channelId} est introuvable.`);
                continue;
            }

            const oldName = channel.name;
            const oldTopic = channel.topic || null;
            const oldPermissions = channel.permissionOverwrites.cache.map(p => ({
                id: p.id,
                allow: p.allow.bitfield,
                deny: p.deny.bitfield
            }));
            const oldCategory = channel.parentId || null; // ✅ catégorie d'origine

            // Supprimer l'ancien salon (forum ou textuel)
            await channel.delete();
            console.log(`🗑️ Salon supprimé : ${oldName}`);

            // Créer le forum avec les tags et “Require tag” activé
            const forum = await guild.channels.create({
                name: oldName,
                type: ChannelType.GuildForum,
                topic: oldTopic,
                permissionOverwrites: oldPermissions,
                parent: oldCategory, // ✅ remettre dans la catégorie d'origine
                defaultThreadAppliedTagsRequired: true, // ✅ coche la case
            });

            // Ajouter les tags
            const newTags = forumTags.map(tag => ({
                name: tag.name,
                emoji: { id: null, name: tag.emoji },
                moderated: tag.moderated
            }));
            await forum.setAvailableTags(newTags);

            console.log(`✅ Forum recréé dans la catégorie d'origine avec tags et option "require tags" activée : ${forum.name}`);

        } catch (err) {
            console.error(`❌ Erreur pour le salon ${channelId}:`, err);
        }
    }

    console.log("✅ Tous les salons ont été recréés et configurés !");
    process.exit();
});

client.login(config.token);