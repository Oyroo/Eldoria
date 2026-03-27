const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getPartners } = require('../utils/inviteTracker');

const EPHEMERAL = 64;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite-list')
        .setDescription('Liste toutes les invitations partenaires')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: EPHEMERAL });

        const partners = getPartners();
        const list     = Object.values(partners);

        if (!list.length) {
            return interaction.editReply({ content: 'Aucune invitation partenaire configurée.' });
        }

        const lines = list.map(p =>
            `🤝 **${p.name}** · \`${p.code}\`\n` +
            `-# ${p.description || 'Aucune description'} · ${p.url}`
        ).join('\n\n');

        return interaction.editReply({ content: lines });
    },
};