const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { addPartner } = require('../utils/inviteTracker');

const EPHEMERAL = 64;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite-create')
        .setDescription('Crée une invitation partenaire permanente et illimitée')
        .addStringOption(opt =>
            opt.setName('nom')
                .setDescription('Nom du serveur partenaire')
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('description')
                .setDescription('Description courte du partenariat')
                .setRequired(false)
        )
        .addChannelOption(opt =>
            opt.setName('salon')
                .setDescription('Salon source de l\'invitation (défaut : salon actuel)')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: EPHEMERAL });

        const nom         = interaction.options.getString('nom');
        const description = interaction.options.getString('description') ?? '';
        const channel     = interaction.options.getChannel('salon') ?? interaction.channel;

        try {
            const invite = await channel.createInvite({
                maxAge:   0,  // Ne jamais expirer
                maxUses:  0,  // Utilisations illimitées
                unique:   true,
                reason:   `Invitation partenaire — ${nom}`,
            });

            const id = `partner_${Date.now()}`;
            addPartner(id, {
                id,
                name:        nom,
                description,
                code:        invite.code,
                url:         invite.url,
                channelId:   channel.id,
                createdAt:   Date.now(),
                uses:        0,
            });

            return interaction.editReply({
                content:
                    `✅ **Invitation partenaire créée pour ${nom}**\n\n` +
                    `🔗 **Lien** : ${invite.url}\n` +
                    `📌 **Code** : \`${invite.code}\`\n` +
                    `♾️ **Durée** : Permanente\n` +
                    `♾️ **Utilisations** : Illimitées\n\n` +
                    `-# Les joins via cette invitation seront tracés dans le salon forum configuré.`,
            });

        } catch (err) {
            return interaction.editReply({ content: `❌ Erreur : \`${err.message}\`` });
        }
    },
};