const { Events, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('discord.js');
const { config }                = require('../utils/config');
const { generateWelcomeBanner } = require('../utils/welcomeImage');

const CV2 = 1 << 15; // 32768

module.exports = {
    name: Events.GuildMemberAdd,

    async execute(member) {
        const wc = config.welcome;
        if (!wc?.active || !wc?.channelId) return;

        try {
            const channel = await member.guild.channels.fetch(wc.channelId);
            if (!channel) return;

            // Rôle automatique
            if (wc.roleId) {
                try { await member.roles.add(wc.roleId); } catch (e) {
                    console.error('Rôle auto erreur:', e.message);
                }
            }

            // Générer le banner
            const buffer = await generateWelcomeBanner(member);

            // Message personnalisé
            const customMsg = wc.message
                ?.replace(/\{user\}/g,   `<@${member.id}>`)
                ?.replace(/\{server\}/g, member.guild.name);

            // Container CV2
            const c = new ContainerBuilder()
                .setAccentColor(0xd4a853)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `# Bienvenue, <@${member.id}> ! 🎉\n` +
                        `-# Tu es le **${member.guild.memberCount}**${member.guild.memberCount === 1 ? 'er' : 'ème'} membre à rejoindre ${member.guild.name}.`
                    )
                );

            if (customMsg) {
                c.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1))
                 .addTextDisplayComponents(new TextDisplayBuilder().setContent(customMsg));
            }

            c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
             .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `-# Prends le temps de lire les règles avant de te lancer dans l'aventure.`
                )
            );

            await channel.send({
                files:      [{ attachment: buffer, name: 'welcome.png' }],
                components: [c],
                flags:      CV2,
            });

        } catch (err) {
            console.error('guildMemberAdd erreur:', err.message);
        }
    },
};