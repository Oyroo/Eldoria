const { Events, AttachmentBuilder, EmbedBuilder } = require('discord.js');
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
    name: Events.GuildMemberRemove,

    async execute(member) {
        if (!member.guild) return;

        const channel = (await resolveChannel(member.guild, config.leaveChannelId))
            || member.guild.systemChannel
            || null;
        if (!channel) return;

        const leaveImage = await createWelcomeImage(member, 'leave').catch(() => null);
        const attachment = leaveImage
            ? new AttachmentBuilder(leaveImage, { name: 'goodbye.png' })
            : null;

        const embed = new EmbedBuilder()
            .setColor(0xFF6B6B)
            .setTitle('👋 Au revoir !')
            .setDescription(`**${member.user.tag}** a quitté **${member.guild.name}**.`)
            .setTimestamp();

        if (attachment) {
            embed.setImage('attachment://goodbye.png');
        }

        await channel.send({
            embeds: [embed],
            files: attachment ? [attachment] : [],
        }).catch(() => null);
    },
};
