const { SlashCommandBuilder, ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, ThumbnailBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Affiche les informations du serveur.'),

  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) {
      return interaction.reply({ content: "Cette commande doit être utilisée dans un serveur.", ephemeral: true });
    }

    await guild.fetch();
    const owner = await guild.fetchOwner();
    const icon = guild.iconURL({ size: 256 }) ?? null;

    const verLabels = { 0: 'Aucune', 1: 'Faible', 2: 'Moyenne', 3: 'Élevée', 4: 'Très élevée' };

    const container = new ContainerBuilder()
      .setAccentColor(0x5865f2)
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `# 🌐 ${guild.name}\n` +
              `-# Identifiant : \`${guild.id}\``
            )
          )
          .setThumbnailAccessory(new ThumbnailBuilder().setURL(icon))
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**👑 Propriétaire** : ${owner.user.tag} (${owner.id})\n` +
          `**👥 Membres** : ${guild.memberCount.toLocaleString('fr-FR')}\n` +
          `**🎭 Rôles** : ${guild.roles.cache.size - 1}\n` +
          `**📅 Création** : <t:${Math.floor(guild.createdTimestamp / 1000)}:D>\n` +
          `**🔐 Vérification** : ${verLabels[guild.verificationLevel] ?? 'Inconnue'}`
        )
      );

    await interaction.reply({ components: [container], ephemeral: true });
  },
};
