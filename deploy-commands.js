const { REST, Routes } = require('discord.js');
const fs   = require('fs');
const path = require('path');

// guildId depuis la variable d'environnement (config.json n'existe pas encore au build)
const guildId = process.env.GUILD_ID;
if (!guildId) {
    console.error('❌ Variable d\'environnement GUILD_ID manquante.');
    process.exit(1);
}

const commands = [];

const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        commands.push(command.data.toJSON());
        console.log(`📦 Commande lue : ${command.data.name}`);
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`🔄 Enregistrement de ${commands.length} commande(s)...`);
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
            { body: commands }
        );
        console.log('✅ Toutes les slash commands ont été enregistrées.');
    } catch (err) {
        console.error('❌ Erreur lors de l\'enregistrement :', err);
    }
})();