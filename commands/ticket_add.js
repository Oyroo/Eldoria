const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { get: getTickets } = require('../utils/tickets');

const EPHEMERAL = 64;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-add')
        .setDescription('Ajoute un membre au ticket actuel')
        .addUserOption(opt =>
            opt.setName('membre')
                .setDescription('Le membre à ajouter au ticket')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: EPHEMERAL });

        const tickets = getTickets();
        const info    = tickets[interaction.channelId];

        if (!info) {
            return interaction.editReply({ content: '❌ Cette commande doit être utilisée dans un salon de ticket.' });
        }

        const member = interaction.options.getMember('membre');
        if (!member) {
            return interaction.editReply({ content: '❌ Membre introuvable.' });
        }

        if (member.id === info.userId) {
            return interaction.editReply({ content: '❌ Ce membre est déjà dans le ticket.' });
        }

        try {
            await interaction.channel.permissionOverwrites.edit(member.id, {
                ViewChannel:    true,
                SendMessages:   true,
                ReadMessageHistory: true,
            });

            await interaction.editReply({
                content: `✅ <@${member.id}> a été ajouté au ticket.`,
            });

            await interaction.channel.send({
                content: `👋 <@${member.id}> a été ajouté au ticket par <@${interaction.user.id}>.`,
            });

        } catch (err) {
            return interaction.editReply({ content: `❌ Erreur : \`${err.message}\`` });
        }
    },
};