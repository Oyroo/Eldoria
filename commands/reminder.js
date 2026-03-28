const { SlashCommandBuilder } = require('discord.js');
const { userOptOut, userOptIn, hasOptedOut } = require('../utils/bumpReminder');

const EPHEMERAL = 64;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reminder')
        .setDescription('Gérer les rappels de bump et de vote')
        .addSubcommand(sub =>
            sub.setName('status')
                .setDescription('Voir l\'état de tes rappels')
        )
        .addSubcommand(sub =>
            sub.setName('activer')
                .setDescription('Activer les rappels')
                .addStringOption(opt =>
                    opt.setName('type')
                        .setDescription('Type de rappel')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Bump Disboard', value: 'bump' },
                            { name: 'Vote',          value: 'vote' },
                            { name: 'Les deux',      value: 'both' },
                        )
                )
        )
        .addSubcommand(sub =>
            sub.setName('désactiver')
                .setDescription('Désactiver les rappels')
                .addStringOption(opt =>
                    opt.setName('type')
                        .setDescription('Type de rappel')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Bump Disboard', value: 'bump' },
                            { name: 'Vote',          value: 'vote' },
                            { name: 'Les deux',      value: 'both' },
                        )
                )
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: EPHEMERAL });
        const sub    = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        if (sub === 'status') {
            const bumpOff = hasOptedOut(userId, 'bump');
            const voteOff = hasOptedOut(userId, 'vote');
            return interaction.editReply({
                content:
                    `### 🔔 État de tes rappels\n` +
                    `📣 **Bump Disboard** · ${bumpOff ? '🔴 Désactivé' : '🟢 Activé'}\n` +
                    `🗳️ **Vote** · ${voteOff ? '🔴 Désactivé' : '🟢 Activé'}`,
            });
        }

        const type  = interaction.options.getString('type');
        const types = type === 'both' ? ['bump', 'vote'] : [type];

        if (sub === 'désactiver') {
            types.forEach(t => userOptOut(userId, t));
            return interaction.editReply({
                content: `🔕 Rappels **${type === 'both' ? 'bump et vote' : type}** désactivés. Tu ne recevras plus les mentions.`,
            });
        }

        if (sub === 'activer') {
            types.forEach(t => userOptIn(userId, t));
            return interaction.editReply({
                content: `🔔 Rappels **${type === 'both' ? 'bump et vote' : type}** activés.`,
            });
        }
    },
};