const {
    SlashCommandBuilder, ChannelType,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SectionBuilder, ThumbnailBuilder,
} = require('discord.js');
const Flags = require('../utils/flags');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Affiche les informations du serveur'),

    async execute(interaction) {
        await interaction.deferReply({ flags: Flags.Ephemeral });

        const guild   = await interaction.guild.fetch();
        const owner   = await guild.fetchOwner();
        const ch      = guild.channels.cache;
        const iconURL = guild.iconURL({ size: 256, extension: 'png' }) ?? 'https://cdn.discordapp.com/embed/avatars/0.png';

        const ver = { 0:'Aucune', 1:'Faible', 2:'Moyenne', 3:'Élevée', 4:'Très élevée' };
        const bst = { 0:'Aucun',  1:'Niveau 1', 2:'Niveau 2', 3:'Niveau 3' };

        const container = new ContainerBuilder()
            .setAccentColor(0xd4a853)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${guild.name}\n-# ID : \`${guild.id}\``))
                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(iconURL))
            )
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent([
                `👑  **Propriétaire** : ${owner.user.username} (\`${owner.id}\`)`,
                `👥  **Membres** : ${guild.memberCount.toLocaleString('fr-FR')}`,
                `🎭  **Rôles** : ${guild.roles.cache.size - 1}`,
                `📅  **Créé le** : <t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,
                `🔐  **Vérification** : ${ver[guild.verificationLevel] ?? '—'}`,
            ].join('\n')))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent([
                `**Salons**`,
                `💬  Texte : **${ch.filter(c => c.type === ChannelType.GuildText).size}**`,
                `🔊  Vocal : **${ch.filter(c => c.type === ChannelType.GuildVoice).size}**`,
                `📋  Forum : **${ch.filter(c => c.type === ChannelType.GuildForum).size}**`,
                `📁  Catégorie : **${ch.filter(c => c.type === ChannelType.GuildCategory).size}**`,
            ].join('\n')))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent([
                `**Boosts**`,
                `✨  Niveau : **${bst[guild.premiumTier] ?? '—'}**`,
                `🚀  Nombre : **${guild.premiumSubscriptionCount ?? 0}**`,
            ].join('\n')));

        await interaction.editReply({ components: [container], flags: Flags.CV2 });
    },
};