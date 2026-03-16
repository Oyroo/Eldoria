const { SlashCommandBuilder, ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, ThumbnailBuilder } = require('discord.js');

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

    const container = new ContainerBuilder()
      .setAccentColor(0x5865f2)
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `# 🏓 Ping\n` +
              `-# Ce panneau utilise **Components V2**.`
            )
          )
          .setThumbnailAccessory(new ThumbnailBuilder().setURL(interaction.client.user.displayAvatarURL({ size: 256 })))
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### Latence\n` +
          `• Message : **${msgLatency}ms**\n` +
          `• API : **${apiLatency}ms**\n\n` +
          `### Uptime\n` +
          `• **${uptime}**\n\n` +
          `### Versions\n` +
          `• discord.js : **${require('discord.js').version}**\n` +
          `• Node.js : **${process.versions.node}**`
        )
      );

    await interaction.reply({ components: [container], ephemeral: true });
  },
};
