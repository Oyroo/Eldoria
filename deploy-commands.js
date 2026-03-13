const { REST, Routes, SlashCommandBuilder, ChannelType } = require('discord.js');
const config = require('./config.json');

const commands = [
    new SlashCommandBuilder()
        .setName('recreate_forums')
        .setDescription('Recrée les salons texte en salons forums avec les tags configurés')
        .setDefaultMemberPermissions('8'),

    new SlashCommandBuilder()
        .setName('list_channels')
        .setDescription('Liste les salons configurés pour la conversion'),

    new SlashCommandBuilder()
        .setName('add_channel')
        .setDescription('Ajoute un salon à convertir en forum')
        .addStringOption(option =>
            option.setName('channel_id').setDescription("L'ID du salon texte à convertir").setRequired(true)
        )
        .setDefaultMemberPermissions('8'),

    new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Affiche les informations du serveur'),

    new SlashCommandBuilder()
        .setName('ticket-panel')
        .setDescription('Gestion du système de tickets')
        .setDefaultMemberPermissions('8')
        .addSubcommand(sub =>
            sub
                .setName('send')
                .setDescription('Personnalise et envoie le panel de tickets dans un salon')
                .addChannelOption(option =>
                    option
                        .setName('salon')
                        .setDescription('Salon où envoyer le panel')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('config')
                .setDescription('Configure le salon des transcripts et la catégorie des tickets')
                .addChannelOption(option =>
                    option
                        .setName('transcript')
                        .setDescription('Salon où envoyer les transcripts')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
                .addChannelOption(option =>
                    option
                        .setName('categorie')
                        .setDescription('Catégorie où créer les tickets')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(false)
                )
        ),

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