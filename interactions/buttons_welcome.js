const {
    ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ButtonBuilder, ButtonStyle,
    MediaGalleryBuilder, MediaGalleryItemBuilder,
} = require('discord.js');

const { config, saveConfig }    = require('../utils/config');
const { pending }               = require('../utils/pending');
const { generateWelcomeBanner } = require('../utils/welcomeImage');

const CV2          = 1 << 15;
const EPHEMERAL    = 64;
const CV2_EPHEMERAL = CV2 | EPHEMERAL;

// ─── Builder du panel welcome (retourne { components }) ───────────────────────

function buildWelcomePanel(guild) {
    const icon = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const wc   = config.welcome ?? {};

    const active     = wc.active    ?? false;
    const channelStr = wc.channelId ? `<#${wc.channelId}>` : '*Non défini*';
    const roleStr    = wc.roleId    ? `<@&${wc.roleId}>`   : '*Aucun*';
    const msgStr     = wc.message
        ? `\`${wc.message.slice(0, 60)}${wc.message.length > 60 ? '…' : ''}\``
        : '*Aucun*';

    const {
        ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
        SectionBuilder, ThumbnailBuilder,
        ActionRowBuilder, ButtonBuilder, ButtonStyle,
    } = require('discord.js');

    const c = new ContainerBuilder().setAccentColor(0xd4a853);

    const section = new (require('discord.js').SectionBuilder)()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `# 🚪  Arrivées & départs\n` +
                `-# Message de bienvenue automatique avec banner personnalisé.`
            )
        );
    if (icon) section.setThumbnailAccessory(new (require('discord.js').ThumbnailBuilder)().setURL(icon));
    c.addSectionComponents(section);

    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### Configuration\n` +
        `${active ? '🟢' : '🔴'}  **Statut** · ${active ? 'Actif' : 'Inactif'}\n` +
        `📢  **Salon de bienvenue** · ${channelStr}\n` +
        `🎭  **Rôle automatique** · ${roleStr}\n` +
        `💬  **Message** · ${msgStr}`
     ))
     .addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('welcome_toggle')
                .setLabel(active ? 'Désactiver' : 'Activer')
                .setEmoji(active ? '🔴' : '🟢')
                .setStyle(active ? ButtonStyle.Danger : ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('welcome_setchannel')
                .setLabel('Salon')
                .setEmoji('📢')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('welcome_setrole')
                .setLabel('Rôle auto')
                .setEmoji('🎭')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('welcome_setmessage')
                .setLabel('Message')
                .setEmoji('💬')
                .setStyle(ButtonStyle.Secondary),
        )
     )
     .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
     .addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('welcome_preview')
                .setLabel('Aperçu')
                .setEmoji('👁️')
                .setStyle(ButtonStyle.Secondary),
        )
     );

    return c;
}

// ─── Panel d'attente de saisie ────────────────────────────────────────────────

function buildAwaitPanel(emoji, title, what, hint) {
    const c = new ContainerBuilder()
        .setAccentColor(0x5865f2)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# ${emoji}  ${title}\n-# En attente de ta réponse…`
        ))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${what}\n\n${hint}\n\n-# Tape \`annuler\` ou clique ci-dessous.`
        ));

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('welcome_cancel')
            .setLabel('Annuler')
            .setEmoji('✖️')
            .setStyle(ButtonStyle.Secondary)
    );

    return [c, row];
}

// ─── Handler boutons ──────────────────────────────────────────────────────────

async function handleButtonWelcome(interaction) {
    const id = interaction.customId;

    // Activer / Désactiver
    if (id === 'welcome_toggle') {
        await interaction.deferUpdate();
        if (!config.welcome) config.welcome = {};
        config.welcome.active = !config.welcome.active;
        saveConfig();
        return interaction.editReply({
            components: [buildWelcomePanel(interaction.guild)],
        });
    }

    // Définir le salon → saisie par message
    if (id === 'welcome_setchannel') {
        await interaction.deferUpdate();
        pending[interaction.user.id] = {
            type:    'welcome_channel',
            token:   interaction.token,
            appId:   interaction.client.application.id,
            guildId: interaction.guildId,
        };
        const [c, row] = buildAwaitPanel(
            '📢', 'Salon de bienvenue',
            'Envoie le **#salon** ou son **ID**.',
            'Les messages de bienvenue y seront envoyés automatiquement.'
        );
        return interaction.editReply({ components: [c, row] });
    }

    // Définir le rôle → saisie par message
    if (id === 'welcome_setrole') {
        await interaction.deferUpdate();
        pending[interaction.user.id] = {
            type:    'welcome_role',
            token:   interaction.token,
            appId:   interaction.client.application.id,
            guildId: interaction.guildId,
        };
        const [c, row] = buildAwaitPanel(
            '🎭', 'Rôle automatique',
            'Envoie le **@rôle** ou son **ID**.',
            'Ce rôle sera attribué automatiquement à chaque nouveau membre.'
        );
        return interaction.editReply({ components: [c, row] });
    }

    // Message → modal
    if (id === 'welcome_setmessage') {
        const modal = new ModalBuilder()
            .setCustomId('welcome_modal_message')
            .setTitle('Message de bienvenue');
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('message')
                    .setLabel('Message ({user} et {server} disponibles)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(config.welcome?.message ?? '')
                    .setPlaceholder('Bienvenue sur {server}, {user} !')
                    .setRequired(false)
                    .setMaxLength(500)
            )
        );
        return interaction.showModal(modal);
    }

    // Annuler la saisie
    if (id === 'welcome_cancel') {
        await interaction.deferUpdate();
        delete pending[interaction.user.id];
        return interaction.editReply({
            components: [buildWelcomePanel(interaction.guild)],
        });
    }

    // Aperçu — image dans le container via MediaGallery + attachment://
    if (id === 'welcome_preview') {
        await interaction.deferReply({ flags: CV2_EPHEMERAL });
        try {
            const buffer    = await generateWelcomeBanner(interaction.member);
            const customMsg = config.welcome?.message
                ?.replace(/\{user\}/g,   `<@${interaction.user.id}>`)
                ?.replace(/\{server\}/g, interaction.guild.name);

            const c = new ContainerBuilder()
                .setAccentColor(0xd4a853)
                // Image dans le container via référence à l'attachment
                .addMediaGalleryComponents(
                    new MediaGalleryBuilder().addItems(
                        new MediaGalleryItemBuilder().setURL('attachment://welcome.png')
                    )
                )
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `# Bienvenue, <@${interaction.user.id}> ! 🎉\n` +
                    `-# Tu es le **${interaction.guild.memberCount}**ème membre à rejoindre ${interaction.guild.name}.`
                ));

            if (customMsg) {
                c.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1))
                 .addTextDisplayComponents(new TextDisplayBuilder().setContent(customMsg));
            }

            c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
             .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `-# Prends le temps de lire les règles avant de te lancer dans l'aventure.`
             ));

            return interaction.editReply({
                files:      [{ attachment: buffer, name: 'welcome.png' }],
                components: [c],
            });

        } catch (err) {
            console.error('welcome_preview:', err.message);
            return interaction.editReply({ content: `❌ Erreur : \`${err.message}\`` });
        }
    }
}

// ─── Handler modal ────────────────────────────────────────────────────────────

async function handleModalWelcome(interaction) {
    if (interaction.customId === 'welcome_modal_message') {
        await interaction.deferUpdate();
        const msg = interaction.fields.getTextInputValue('message').trim();
        if (!config.welcome) config.welcome = {};
        config.welcome.message = msg || null;
        saveConfig();
        return interaction.editReply({
            components: [buildWelcomePanel(interaction.guild)],
        });
    }
}

module.exports = { handleButtonWelcome, handleModalWelcome, buildWelcomePanel };