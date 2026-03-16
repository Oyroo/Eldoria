const { Events, AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { config } = require('../utils/config');
const { createWelcomeImage } = require('../utils/welcomeImage');

async function resolveChannel(guild, channelId) {
    if (!channelId) return null;
    try {
        return await guild.channels.fetch(channelId);
    } catch {
        return null;
    }
}

module.exports = {
    name: Events.GuildMemberAdd,

    async execute(member) {
        if (!member.guild || member.user.bot) return;

        const channel = (await resolveChannel(member.guild, config.welcomeChannelId))
            || member.guild.systemChannel
            || null;
        if (!channel) return;

        const welcomeImage = await createWelcomeImage(member, 'welcome').catch(() => null);
        const attachment = welcomeImage
            ? new AttachmentBuilder(welcomeImage, { name: 'welcome.png' })
            : null;

        const embed = new EmbedBuilder()
            .setColor(0x5DB3FF)
            .setTitle('🎉 Nouveau membre !')
            .setDescription(`Salut ${member}, bienvenue sur **${member.guild.name}** !`)
            .setTimestamp();

        if (attachment) {
            embed.setImage('attachment://welcome.png');
        }

        const components = [];
        const rulesChannelId = config.rulesChannelId || member.guild.rulesChannelId;
        if (rulesChannelId) {
            const rulesChannel = await resolveChannel(member.guild, rulesChannelId);
            if (rulesChannel) {
                components.push(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel('Voir les règles')
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://discord.com/channels/${member.guild.id}/${rulesChannel.id}`)
                    )
                );
            }
        }

        await channel.send({
            embeds: [embed],
            files: attachment ? [attachment] : [],
            components: components,
        }).catch(() => null);
    },
};
