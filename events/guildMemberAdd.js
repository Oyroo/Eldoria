const { Events, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('discord.js');
const { config }                = require('../utils/config');
const { generateWelcomeBanner } = require('../utils/welcomeImage');
const Flags                     = require('../utils/flags');

module.exports = {
    name: Events.GuildMemberAdd,

    async execute(member) {
        const welcome = config.welcome;
        if (!welcome?.active || !welcome?.channelId) return;

        try {
            const channel = await member.guild.channels.fetch(welcome.channelId);
            if (!channel) return;

            // Générer le banner
            const bannerBuffer = await generateWelcomeBanner(member);
            const attachment   = { attachment: bannerBuffer, name: 'welcome.png' };

            // Rôle automatique
            if (welcome.roleId) {
                try { await member.roles.add(welcome.roleId); } catch {}
            }

            // Message CV2
            const memberCount = member.guild.memberCount;
            const c = new ContainerBuilder()
                .setAccentColor(0xd4a853)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `# Bienvenue, <@${member.id}> ! 🎉\n` +
                        `-# Tu es le **${memberCount}**${memberCount === 1 ? 'er' : 'ème'} membre à rejoindre Eldoria.`
                    )
                );

            if (welcome.message) {
                c.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1))
                 .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(welcome.message)
                 );
            }

            c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
             .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `-# Prends le temps de lire les règles et de te présenter avant de te lancer dans l'aventure.`
                )
             );

            await channel.send({
                files:      [attachment],
                components: [c],
                flags:      Flags.CV2,
            });

        } catch (err) {
            console.error('Erreur welcome :', err.message);
        }
    },
};