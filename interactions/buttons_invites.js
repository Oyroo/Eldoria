const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SectionBuilder, ThumbnailBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');

const { config, saveConfig } = require('../utils/config');
const { pending } = require('../utils/pending');

function sep() { return new SeparatorBuilder().setDivider(true).setSpacing(2); }
function thinSep() { return new SeparatorBuilder().setDivider(false).setSpacing(1); }

function buildInvitesPanel(guild) {
    const icon = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const tracker = config.inviteTracker ?? {};
    const partners = Object.values(config.invitePartners ?? {});

    const forumStr = tracker.forumChannelId ? `<#${tracker.forumChannelId}>` : '*Non défini*';
    const aowynStr = tracker.aowynCode ? `\`${tracker.aowynCode}\`` : '*Non défini*';
    const disStr = tracker.disboardCode ? `\`${tracker.disboardCode}\`` : '*Non défini*';

    const c = new ContainerBuilder().setAccentColor(0xd4a853);
    const section = new SectionBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# 🔗  Invite Logger\n-# Suivi des invitations et sources de recrutement.`
        )
    );
    if (icon) section.setThumbnailAccessory(new ThumbnailBuilder().setURL(icon));
    c.addSectionComponents(section);

    c.addSeparatorComponents(sep())
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `### Configuration\n` +
            `📂  **Salon forum** · ${forumStr}\n` +
            `🌐  **Invitation Aowyn** · ${aowynStr}\n` +
            `📋  **Invitation Disboard** · ${disStr}`
        ))
        .addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('inv_setforum').setLabel('Salon forum').setEmoji('📂').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('inv_setaowyn').setLabel('Aowyn').setEmoji('🌐').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('inv_setdisboard').setLabel('Disboard').setEmoji('📋').setStyle(ButtonStyle.Secondary),
        ))
        .addSeparatorComponents(sep())
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Partenaires (${partners.length})`));

    if (partners.length === 0) {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `> *Aucun partenaire. Clique sur **Ajouter** pour en créer un.*`
        ));
    } else {
        for (const p of partners) {
            c.addSeparatorComponents(thinSep())
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `🤝  **${p.name}** · \`${p.code}\`\n-# ${p.description || 'Aucune description'}`
                ))
                .addActionRowComponents(new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`inv_delete:${p.id}`).setLabel('Supprimer').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
                ));
        }
    }

    c.addSeparatorComponents(sep())
        .addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('inv_add').setLabel('Ajouter un partenaire').setEmoji('➕').setStyle(ButtonStyle.Success),
        ));

    return c;
}

function buildDeleteConfirm(partner) {
    return new ContainerBuilder().setAccentColor(0xed4245)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# 🗑️  Supprimer ce partenaire ?\n-# L'invitation Discord associée sera également supprimée.`
        ))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `**${partner.name}** · \`${partner.code}\`\n-# ${partner.description || 'Aucune description'}`
        ))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
        .addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`inv_delete_confirm:${partner.id}`).setLabel('Supprimer définitivement').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('inv_cancel').setLabel('Annuler').setEmoji('✖️').setStyle(ButtonStyle.Secondary),
        ));
}

async function handleButtonInvites(interaction) {
    const id = interaction.customId;

    if (id === 'inv_add') {
        const modal = new ModalBuilder().setCustomId('inv_modal_add').setTitle('Nouveau partenaire');
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('name').setLabel('Nom du serveur partenaire').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('description').setLabel('Description (optionnelle)').setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(200)
            ),
        );
        return interaction.showModal(modal);
    }

    const awaitPanel = async (type, emoji, title, hint) => {
        pending[interaction.user.id] = { type, token: interaction.token, appId: interaction.client.application.id, guildId: interaction.guildId };
        const c = new ContainerBuilder().setAccentColor(0x5865f2)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${emoji}  ${title}\n-# En attente de ta réponse…`))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${hint}\n\n-# Tape \`annuler\` ou clique ci-dessous.`));
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('inv_cancel').setLabel('Annuler').setEmoji('✖️').setStyle(ButtonStyle.Secondary)
        );
        return interaction.update({ components: [c, row] });
    };

    if (id === 'inv_setforum') return awaitPanel('inv_forum', '📂', 'Salon forum', 'Envoie le **#salon forum** ou son **ID**.');
    if (id === 'inv_setaowyn') return awaitPanel('inv_aowyn', '🌐', 'Code Aowyn', 'Envoie le **code** de l\'invitation Aowyn (ex: `abc123`).');
    if (id === 'inv_setdisboard') return awaitPanel('inv_disboard', '📋', 'Code Disboard', 'Envoie le **code** de l\'invitation Disboard (ex: `xyz789`).');

    if (id.startsWith('inv_delete:')) {
        const partner = config.invitePartners?.[id.split(':')[1]];
        if (!partner) return interaction.update({ components: [buildInvitesPanel(interaction.guild)] });
        return interaction.update({ components: [buildDeleteConfirm(partner)] });
    }

    if (id.startsWith('inv_delete_confirm:')) {
        const pid = id.split(':')[1];
        const partner = config.invitePartners?.[pid];
        if (partner) {
            try { await interaction.guild.invites.delete(partner.code); } catch {}
            delete config.invitePartners[pid];
            saveConfig();
        }
        return interaction.update({ components: [buildInvitesPanel(interaction.guild)] });
    }

    if (id === 'inv_cancel') {
        delete pending[interaction.user.id];
        return interaction.update({ components: [buildInvitesPanel(interaction.guild)] });
    }
}

async function handleModalInvites(interaction) {
    if (interaction.customId === 'inv_modal_add') {
        const nom = interaction.fields.getTextInputValue('name').trim();
        const description = interaction.fields.getTextInputValue('description')?.trim() ?? '';
        try {
            const invite = await interaction.channel.createInvite({ maxAge: 0, maxUses: 0, unique: true, reason: `Partenaire — ${nom}` });
            const pid = `partner_${Date.now()}`;
            if (!config.invitePartners) config.invitePartners = {};
            config.invitePartners[pid] = { id: pid, name: nom, description, code: invite.code, url: invite.url, channelId: interaction.channelId, createdAt: Date.now(), uses: 0 };
            saveConfig();
        } catch (err) { console.error('inv_modal_add:', err.message); }
        return interaction.update({ components: [buildInvitesPanel(interaction.guild)] });
    }
}

module.exports = { handleButtonInvites, handleModalInvites, buildInvitesPanel };