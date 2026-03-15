const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (days) parts.push(`${days}j`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Affiche la latence du bot et l’état de connexion Discord.'),

  async execute(interaction) {
    const now = Date.now();
    const msgLatency = now - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);
    const uptime = formatDuration(interaction.client.uptime ?? 0);

    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong !')
      .setColor(0x5865f2)
      .addFields(
        { name: '⏱️ Latence', value: `Message : **${msgLatency}ms**\nAPI : **${apiLatency}ms**`, inline: true },
        { name: '📡 Uptime', value: `
**${uptime}**`, inline: true },
        { name: '🧩 Versions', value: `discord.js : **${require('discord.js').version}**\nNode.js : **${process.versions.node}**` }
      )
      .setFooter({ text: 'Eldoria Bot • Ping' });

    await interaction.reply({ embeds: [embed] });
  },
};
