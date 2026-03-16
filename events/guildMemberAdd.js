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

        const format = (template) => template
            .replace(/\{user\}/g, `${member}`)
            .replace(/\{guild\}/g, member.guild.name);

        const welcomeImage = await createWelcomeImage(member, 'welcome', { message: format(config.welcomeText ?? '') }).catch(() => null);
        const attachment = welcomeImage
            ? new AttachmentBuilder(welcomeImage, { name: 'welcome.png' })
            : null;

        const embed = new EmbedBuilder()
            .setColor(0x5DB3FF)
            .setTitle('🎉 Nouveau membre !')
            .setDescription(format(config.welcomeText ?? `Salut ${member}, bienvenue sur **${member.guild.name}** !`))
            .setTimestamp();

        if (attachment) {
            embed.setImage('attachment://welcome.png');
        }

        const components = [];

        await channel.send({
            embeds: [embed],
            files: attachment ? [attachment] : [],
            components: components,
        }).catch(() => null);
    },
};
