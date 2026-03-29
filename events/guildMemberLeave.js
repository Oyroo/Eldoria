const { Events, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('discord.js');
const { config }             = require('../utils/config');
const { buildCustomMessage } = require('../interactions/buttons_welcome_editor');

const CV2 = 1 << 15;

module.exports = {
    name: Events.GuildMemberRemove,

    async execute(member) {
        const wc = config.welcome;
        if (!wc?.departActive || !wc?.departChannelId) return;

        try {
            const channel = await member.guild.channels.fetch(wc.departChannelId);
            if (!channel) return;

            const c = buildCustomMessage('depart', member);
            await channel.send({ components: [c], flags: CV2 });

        } catch (err) {
            console.error('guildMemberLeave erreur:', err.message);
        }
    },
};