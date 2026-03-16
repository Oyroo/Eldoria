const { REST, Routes } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const guildId = process.env.GUILD_ID;
if (!guildId) { console.error('❌ GUILD_ID manquant'); process.exit(1); }

const commands = [];
const cmdDir   = path.join(__dirname, 'commands');
if (fs.existsSync(cmdDir)) {
    for (const file of fs.readdirSync(cmdDir).filter(f => f.endsWith('.js'))) {
        commands.push(require(`./commands/${file}`).data.toJSON());
    }
}

new REST({ version: '10' })
    .setToken(process.env.TOKEN)
    .put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId), { body: commands })
    .then(() => console.log(`✅ ${commands.length} commande(s) enregistrée(s)`))
    .catch(console.error);