const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SectionBuilder, ThumbnailBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');

const Flags                  = require('../utils/flags');
const { config, saveConfig } = require('../utils/config');
const { pending }            = require('../utils/pending');

function sep() { return new SeparatorBuilder().setDivider(true).setSpacing(2); }

function buildBumpPanel(guild) {
    const icon = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const bump = config.bumpReminders?.bump ?? {};
    const vote = config.bumpReminders?.vote ?? {};

    const bumpChanStr  = bump.channelId ? `<#${bump.channelId}>` : '*Non défini*';
    const bumpRoleStr  = bump.roleId    ? `<@&${bump.roleId}>`   : '*Aucun*';
    const voteChanStr  = vote.channelId ? `<#${vote.channelId}>` : '*Non défini*';
    const voteRoleStr  = vote.roleId    ? `<@&${vote.roleId}>`   : '*Aucun*';

    const bumpLast = bump.lastAction
        ? `<t:${Math.floor(bump.lastAction / 1000)}:R>`
        : '*Jamais*';

    const c = new ContainerBuilder().setAccentColor(0xd4a853);
    const section = new SectionBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# 📣  Bump & Reminders\n` +
            `-# Rappels automatiques pour /bump Disboard et les votes.`
        )
    );
    if (icon) section.setThumbnailAccessory(new ThumbnailBuilder().setURL(icon));
    c.addSectionComponents(section);

    // Bump Disboard
    c.addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### 📣  Bump Disboard\n` +
        `📢  **Salon** · ${bumpChanStr}\n` +
        `🏷️  **Rôle mentionné** · ${bumpRoleStr}\n` +
        `-# Dernier bump : ${bumpLast} · Reminder 2h après`
     ))
     .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('bump_setchan:bump').setLabel('Salon').setEmoji('📢').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('bump_setrole:bump').setLabel('Rôle').setEmoji('🏷️').setStyle(ButtonStyle.Secondary),
     ));

    // Vote
    c.addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### 🗳️  Vote\n` +
        `📢  **Salon** · ${voteChanStr}\n` +
        `🏷️  **Rôle mentionné** · ${voteRoleStr}\n` +
        `-# Reminder 12h après le vote`
     ))
     .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('bump_setchan:vote').setLabel('Salon').setEmoji('📢').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('bump_setrole:vote').setLabel('Rôle').setEmoji('🏷️').setStyle(ButtonStyle.Secondary),
     ))
     .addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `-# Les membres peuvent désactiver les mentions avec \`/reminder désactiver\`.`
     ));

    return c;
}

async function handleButtonBump(interaction) {
    const id = interaction.customId;

    const awaitInput = async (type, field, emoji, title, hint) => {
        await interaction.deferUpdate();
        pending[interaction.user.id] = { type: `bump_${field}:${type}`, token: interaction.token, appId: interaction.client.application.id, guildId: interaction.guildId };
        const c = new ContainerBuilder().setAccentColor(0x5865f2)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${emoji}  ${title}\n-# En attente de ta réponse…`))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${hint}\n\n-# Tape \`annuler\` pour annuler.`));
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('bump_cancel').setLabel('Annuler').setEmoji('✖️').setStyle(ButtonStyle.Secondary)
        );
        return interaction.editReply({ components: [c, row] });
    };

    if (id.startsWith('bump_setchan:')) {
        const type = id.split(':')[1];
        const label = type === 'bump' ? 'Bump Disboard' : 'Vote';
        return awaitInput(type, 'chan', '📢', `Salon — ${label}`, 'Envoie le **#salon** ou son **ID**.');
    }

    if (id.startsWith('bump_setrole:')) {
        const type = id.split(':')[1];
        const label = type === 'bump' ? 'Bump Disboard' : 'Vote';
        return awaitInput(type, 'role', '🏷️', `Rôle mentionné — ${label}`, 'Envoie le **@rôle** ou son **ID**.\n\nTape `aucun` pour supprimer le rôle.');
    }

    if (id === 'bump_cancel') {
        await interaction.deferUpdate();
        delete pending[interaction.user.id];
        return interaction.editReply({ components: [buildBumpPanel(interaction.guild)] });
    }
}

module.exports = { handleButtonBump, buildBumpPanel };