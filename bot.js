const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot Eldoria running");
});

app.listen(3000, () => {
  console.log("Web server ready");
});

const { Client, GatewayIntentBits, ChannelType, Events } = require('discord.js');
const config = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Liste des tags avec emojis et modération
const forumTags = [
    { name: "Social", emoji: "💬", moderated: false },
    { name: "Exploration", emoji: "🧭", moderated: false },
    { name: "Combat", emoji: "⚔️", moderated: false },
    { name: "Event", emoji: "🎉", moderated: true },
    { name: "Ouvert", emoji: "🌍", moderated: false },
    { name: "Sur Invitation", emoji: "📜", moderated: false },
    { name: "Privé", emoji: "🔒", moderated: false },
    { name: "En Cours", emoji: "🟢", moderated: false },
    { name: "Pause", emoji: "⏸️", moderated: false },
    { name: "Terminé", emoji: "✅", moderated: false }
];

// Fonction pour recréer les salons forums (à appeler manuellement)
async function recreateForums() {
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
            const oldCategory = channel.parentId || null;

            await channel.delete();
            console.log(`🗑️ Salon supprimé : ${oldName}`);

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

            console.log(`✅ Forum recréé : ${forum.name}`);

        } catch (err) {
            console.error(`❌ Erreur pour le salon ${channelId}:`, err);
        }
    }

    console.log("✅ Tous les salons ont été recréés et configurés !");
}

// Quand le bot est prêt
client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag}!`);
});

// Exemple : on peut déclencher la recréation via une commande slash (optionnel)
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'recreate_forums') {
        await interaction.reply("🔄 Recréation des forums en cours...");
        await recreateForums();
        await interaction.followUp("✅ Tous les forums ont été recréés !");
    }
});

client.login(process.env.TOKEN);