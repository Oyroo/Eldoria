const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('Commande de test qui répond simplement "a"')
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.reply({ content: 'a', ephemeral: true });
  },
};
