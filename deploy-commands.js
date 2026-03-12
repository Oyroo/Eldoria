const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config.json');

const commands = [
    new SlashCommandBuilder()
        .setName('recreate_forums')
        .setDescription('Recrée les salons texte en salons forums avec les tags configurés')
        .setDefaultMemberPermissions('8'), // Administrateur uniquement

    new SlashCommandBuilder()
        .setName('list_channels')
        .setDescription('Liste les salons configurés pour la conversion'),

    new SlashCommandBuilder()
        .setName('add_channel')
        .setDescription('Ajoute un salon à convertir en forum')
        .addStringOption(option =>
            option
                .setName('channel_id')
                .setDescription("L'ID du salon texte à convertir")
                .setRequired(true)
        )
        .setDefaultMemberPermissions('8'),

    new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Affiche les informations du serveur'),

].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('🔄 Enregistrement des slash commands...');

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, config.guildId),
            { body: commands }
        );

        console.log('✅ Slash commands enregistrées avec succès !');
    } catch (err) {
        console.error('❌ Erreur lors de l\'enregistrement :', err);
    }
})();