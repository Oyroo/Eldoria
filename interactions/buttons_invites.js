const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SectionBuilder, ThumbnailBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');

const Flags                  = require('../utils/flags');
const { config, saveConfig } = require('../utils/config');
const { pending }            = require('../utils/pending');
const { getPartners }        = require('../utils/inviteTracker');

// ─── Panel ────────────────────────────────────────────────────────────────────

function buildInvitesPanel(guild) {
    const icon    = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const tracker = config.inviteTracker ?? {};
    const partners = Object.values(getPartners());

    const forumStr   = tracker.forumChannelId ? `<#${tracker.forumChannelId}>` : '*Non défini*';
    const aowynStr   = tracker.aowynCode      ? `\`${tracker.aowynCode}\``     : '*Non défini*';
    const disStr     = tracker.disboardCode   ? `\`${tracker.disboardCode}\``  : '*Non défini*';

    const c = new ContainerBuilder().setAccentColor(0xd4a853);

    const section = new SectionBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# 🔗  Invite Logger\n` +
            `-# Suivi des invitations et des sources de recrutement.`
        )
    );
    if (icon) section.setThumbnailAccessory(new ThumbnailBuilder().setURL(icon));
    c.addSectionComponents(section);

    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### Configuration\n` +
        `📂  **Salon forum** · ${forumStr}\n` +
        `🌐  **Code invitation Aowyn** · ${aowynStr}\n` +
        `📋  **Code invitation Disboard** · ${disStr}`
     ))
     .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('inv_setforum').setLabel('Salon forum').setEmoji('📂').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('inv_setaowyn').setLabel('Code Aowyn').setEmoji('🌐').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('inv_setdisboard').setLabel('Code Disboard').setEmoji('📋').setStyle(ButtonStyle.Secondary),
     ));

    // Liste des partenaires
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2));

    if (partners.length > 0) {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Partenaires (${partners.length})`));
        for (const p of partners) {
            c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `🤝  **${p.name}** · \`${p.code}\`\n` +
                `-# ${p.description || 'Aucune description'}`
            ));
        }
    } else {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `### Partenaires\n> *Aucun partenaire configuré. Utilise \`/invite-create\` pour en ajouter.*`
        ));
    }

    return c;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

async function handleButtonInvites(interaction) {
    const id = interaction.customId;

    const awaitChan = async (type, emoji, title) => {
        await interaction.deferUpdate();
        pending[interaction.user.id] = {
            type, token: interaction.token,
            appId: interaction.client.application.id, guildId: interaction.guildId,
        };
        const c = new ContainerBuilder().setAccentColor(0x5865f2)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `# ${emoji}  ${title}\n-# En attente de ta réponse…`
            ))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `Envoie le **#salon** ou son **ID**.\n\n-# Tape \`annuler\` pour annuler.`
            ));
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('inv_cancel').setLabel('Annuler').setEmoji('✖️').setStyle(ButtonStyle.Secondary)
        );
        return interaction.editReply({ components: [c, row] });
    };

    const awaitCode = async (type, emoji, title, hint) => {
        await interaction.deferUpdate();
        pending[interaction.user.id] = {
            type, token: interaction.token,
            appId: interaction.client.application.id, guildId: interaction.guildId,
        };
        const c = new ContainerBuilder().setAccentColor(0x5865f2)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `# ${emoji}  ${title}\n-# En attente de ta réponse…`
            ))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `${hint}\n\n-# Tape \`annuler\` pour annuler.`
            ));
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('inv_cancel').setLabel('Annuler').setEmoji('✖️').setStyle(ButtonStyle.Secondary)
        );
        return interaction.editReply({ components: [c, row] });
    };

    if (id === 'inv_setforum')    return awaitChan('inv_forum',    '📂', 'Salon forum des invitations');
    if (id === 'inv_setaowyn')    return awaitCode('inv_aowyn',    '🌐', 'Code invitation Aowyn',    'Envoie le **code** de l\'invitation Aowyn (ex: `abc123`).');
    if (id === 'inv_setdisboard') return awaitCode('inv_disboard', '📋', 'Code invitation Disboard', 'Envoie le **code** de l\'invitation Disboard (ex: `xyz789`).');

    if (id === 'inv_cancel') {
        await interaction.deferUpdate();
        delete pending[interaction.user.id];
        return interaction.editReply({ components: [buildInvitesPanel(interaction.guild)] });
    }
}

module.exports = { handleButtonInvites, buildInvitesPanel };