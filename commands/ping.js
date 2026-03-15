const {
  SlashCommandBuilder,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');

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

function buildPingContainer(interaction) {
  const now = Date.now();
  const msgLatency = now - interaction.createdTimestamp;
  const apiLatency = Math.round(interaction.client.ws.ping);
  const uptime = formatDuration(interaction.client.uptime ?? 0);

  const container = new ContainerBuilder().setAccentColor(0x5865f2);

  container
    .addSectionComponents(
      new SectionBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# 🏓 Ping — Statut du bot\n` +
            `-# Temps : **${new Date().toLocaleString('fr-FR')}**\n` +
            `\n` +
            `> ⏱️ **Latence** : ${msgLatency}ms (message) / ${apiLatency}ms (API)\n` +
            `> 📡 **Uptime** : ${uptime}\n` +
            `> 🧩 **Versions** : discord.js ${require('discord.js').version} • Node ${process.versions.node}`
        )
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2));

  return container;
}

function buildPingActions() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ping_refresh')
      .setLabel('Rafraîchir')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Secondary)
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Affiche la latence du bot et l’état de connexion Discord.')
    .setDMPermission(false),

  async execute(interaction) {
    const container = buildPingContainer(interaction);

    await interaction.reply({
      components: [container, buildPingActions()],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },

  buildPingContainer,
  buildPingActions,
};
