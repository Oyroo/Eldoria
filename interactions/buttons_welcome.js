const {
    ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SectionBuilder, ThumbnailBuilder,
    ButtonBuilder, ButtonStyle,
} = require('discord.js');

const Flags                     = require('../utils/flags');
const { config, saveConfig }    = require('../utils/config');
const { pending }               = require('../utils/pending');
const { generateWelcomeBanner } = require('../utils/welcomeImage');

const CV2           = 1 << 15;
const EPHEMERAL     = 64;
const CV2_EPHEMERAL = CV2 | EPHEMERAL;

// ─── Panel principal ──────────────────────────────────────────────────────────

function buildWelcomePanel(guild) {
    const icon = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;
    const wc   = config.welcome ?? {};

    // Banner
    const active     = wc.active          ?? false;
    const channelStr = wc.channelId        ? `<#${wc.channelId}>` : '*Non défini*';
    const roleStr    = wc.roleId           ? `<@&${wc.roleId}>`   : '*Aucun*';
    const msgStr     = wc.message
        ? `\`${wc.message.slice(0, 60)}${wc.message.length > 60 ? '…' : ''}\``
        : '*Aucun*';

    // Message général d'accueil
    const genActive  = wc.generalActive   ?? false;
    const genChan    = wc.generalChannelId ? `<#${wc.generalChannelId}>` : '*Non défini*';

    // Message de départ
    const depActive  = wc.departActive    ?? false;
    const depChan    = wc.departChannelId  ? `<#${wc.departChannelId}>`  : '*Non défini*';

    const c = new ContainerBuilder().setAccentColor(0xd4a853);

    const section = new SectionBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# 🚪  Arrivées & départs\n` +
            `-# Messages de bienvenue et de départ automatiques.`
        )
    );
    if (icon) section.setThumbnailAccessory(new ThumbnailBuilder().setURL(icon));
    c.addSectionComponents(section);

    // ── Banner bienvenue ──────────────────────────────────────────────────────
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### 🖼️  Banner de bienvenue\n` +
        `${active ? '🟢' : '🔴'}  **Statut** · ${active ? 'Actif' : 'Inactif'}\n` +
        `📢  **Salon** · ${channelStr}\n` +
        `🎭  **Rôle automatique** · ${roleStr}\n` +
        `💬  **Message sous le banner** · ${msgStr}`
     ))
     .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('welcome_toggle').setLabel(active ? 'Désactiver' : 'Activer').setEmoji(active ? '🔴' : '🟢').setStyle(active ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder().setCustomId('welcome_setchannel').setLabel('Salon').setEmoji('📢').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('welcome_setrole').setLabel('Rôle').setEmoji('🎭').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('welcome_setmessage').setLabel('Message').setEmoji('💬').setStyle(ButtonStyle.Secondary),
     ))
     .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('welcome_preview').setLabel('Aperçu banner').setEmoji('👁️').setStyle(ButtonStyle.Secondary),
     ));

    // ── Message d'accueil dans le général ─────────────────────────────────────
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### 💬  Message d'accueil dans le général\n` +
        `${genActive ? '🟢' : '🔴'}  **Statut** · ${genActive ? 'Actif' : 'Inactif'}\n` +
        `📢  **Salon** · ${genChan}`
     ))
     .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('welcome_gen_toggle').setLabel(genActive ? 'Désactiver' : 'Activer').setEmoji(genActive ? '🔴' : '🟢').setStyle(genActive ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder().setCustomId('welcome_gen_setchannel').setLabel('Salon').setEmoji('📢').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('welcome_gen_edit').setLabel('Modifier le message CV2').setEmoji('✏️').setStyle(ButtonStyle.Primary),
     ));

    // ── Message de départ ─────────────────────────────────────────────────────
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### 👋  Message de départ\n` +
        `${depActive ? '🟢' : '🔴'}  **Statut** · ${depActive ? 'Actif' : 'Inactif'}\n` +
        `📢  **Salon** · ${depChan}`
     ))
     .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('welcome_dep_toggle').setLabel(depActive ? 'Désactiver' : 'Activer').setEmoji(depActive ? '🔴' : '🟢').setStyle(depActive ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder().setCustomId('welcome_dep_setchannel').setLabel('Salon').setEmoji('📢').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('welcome_dep_edit').setLabel('Modifier le message CV2').setEmoji('✏️').setStyle(ButtonStyle.Primary),
     ));

    return c;
}

// ─── Panel d'attente ──────────────────────────────────────────────────────────

function buildAwaitPanel(emoji, title, what, hint) {
    const c = new ContainerBuilder().setAccentColor(0x5865f2)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# ${emoji}  ${title}\n-# En attente de ta réponse…`
        ))
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${what}\n\n${hint}\n\n-# Tape \`annuler\` ou clique ci-dessous.`
        ));
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('welcome_cancel').setLabel('Annuler').setEmoji('✖️').setStyle(ButtonStyle.Secondary)
    );
    return [c, row];
}

// ─── Handler boutons ──────────────────────────────────────────────────────────

async function handleButtonWelcome(interaction) {
    const id = interaction.customId;

    // ── Banner toggle ─────────────────────────────────────────────────────────
    if (id === 'welcome_toggle') {
        await interaction.deferUpdate();
        if (!config.welcome) config.welcome = {};
        config.welcome.active = !config.welcome.active;
        saveConfig();
        return interaction.editReply({ components: [buildWelcomePanel(interaction.guild)] });
    }

    // ── Salon banner ──────────────────────────────────────────────────────────
    if (id === 'welcome_setchannel') {
        await interaction.deferUpdate();
        pending[interaction.user.id] = { type: 'welcome_channel', token: interaction.token, appId: interaction.client.application.id, guildId: interaction.guildId };
        const [c, row] = buildAwaitPanel('📢', 'Salon de bienvenue', 'Envoie le **#salon** ou son **ID**.', 'Les banners de bienvenue y seront envoyés.');
        return interaction.editReply({ components: [c, row] });
    }

    // ── Rôle ──────────────────────────────────────────────────────────────────
    if (id === 'welcome_setrole') {
        await interaction.deferUpdate();
        pending[interaction.user.id] = { type: 'welcome_role', token: interaction.token, appId: interaction.client.application.id, guildId: interaction.guildId };
        const [c, row] = buildAwaitPanel('🎭', 'Rôle automatique', 'Envoie le **@rôle** ou son **ID**.', 'Ce rôle sera attribué automatiquement à chaque nouveau membre.');
        return interaction.editReply({ components: [c, row] });
    }

    // ── Message sous banner → modal ───────────────────────────────────────────
    if (id === 'welcome_setmessage') {
        const modal = new ModalBuilder().setCustomId('welcome_modal_message').setTitle('Message de bienvenue');
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('message').setLabel('Message ({user} et {server} disponibles)').setStyle(TextInputStyle.Paragraph).setValue(config.welcome?.message ?? '').setPlaceholder('Bienvenue sur {server}, {user} !').setRequired(false).setMaxLength(500)
            )
        );
        return interaction.showModal(modal);
    }

    // ── Aperçu banner ─────────────────────────────────────────────────────────
    if (id === 'welcome_preview') {
        await interaction.deferReply({ flags: CV2_EPHEMERAL });
        try {
            const buffer = await generateWelcomeBanner(interaction.member);
            await interaction.editReply({ files: [{ attachment: buffer, name: 'welcome.png' }] });
            const customMsg = config.welcome?.message?.replace(/\{user\}/g, `<@${interaction.user.id}>`).replace(/\{server\}/g, interaction.guild.name);
            const c = new ContainerBuilder().setAccentColor(0xd4a853)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Bienvenue, <@${interaction.user.id}> ! 🎉`))
                .addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1));
            if (customMsg) c.addTextDisplayComponents(new TextDisplayBuilder().setContent(customMsg));
            c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
             .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Prends le temps de lire les règles avant de te lancer dans l'aventure.`));
            return interaction.followUp({ components: [c], flags: CV2_EPHEMERAL });
        } catch (err) {
            return interaction.editReply({ content: `❌ Erreur : \`${err.message}\`` });
        }
    }

    // ── Message général toggle ────────────────────────────────────────────────
    if (id === 'welcome_gen_toggle') {
        await interaction.deferUpdate();
        if (!config.welcome) config.welcome = {};
        config.welcome.generalActive = !config.welcome.generalActive;
        saveConfig();
        return interaction.editReply({ components: [buildWelcomePanel(interaction.guild)] });
    }

    // ── Message général salon ─────────────────────────────────────────────────
    if (id === 'welcome_gen_setchannel') {
        await interaction.deferUpdate();
        pending[interaction.user.id] = { type: 'welcome_gen_channel', token: interaction.token, appId: interaction.client.application.id, guildId: interaction.guildId };
        const [c, row] = buildAwaitPanel('📢', 'Salon général', 'Envoie le **#salon** ou son **ID**.', 'Le message d\'accueil y sera envoyé à chaque arrivée.');
        return interaction.editReply({ components: [c, row] });
    }

    // ── Message général éditeur ───────────────────────────────────────────────
    if (id === 'welcome_gen_edit') {
        await interaction.deferUpdate();
        const { buildGeneralMsgEditor } = require('./buttons_welcome_editor');
        return interaction.editReply({ components: [buildGeneralMsgEditor(interaction.guild, 'general')] });
    }

    // ── Message départ toggle ─────────────────────────────────────────────────
    if (id === 'welcome_dep_toggle') {
        await interaction.deferUpdate();
        if (!config.welcome) config.welcome = {};
        config.welcome.departActive = !config.welcome.departActive;
        saveConfig();
        return interaction.editReply({ components: [buildWelcomePanel(interaction.guild)] });
    }

    // ── Message départ salon ──────────────────────────────────────────────────
    if (id === 'welcome_dep_setchannel') {
        await interaction.deferUpdate();
        pending[interaction.user.id] = { type: 'welcome_dep_channel', token: interaction.token, appId: interaction.client.application.id, guildId: interaction.guildId };
        const [c, row] = buildAwaitPanel('📢', 'Salon de départ', 'Envoie le **#salon** ou son **ID**.', 'Le message de départ y sera envoyé quand un membre quitte.');
        return interaction.editReply({ components: [c, row] });
    }

    // ── Message départ éditeur ────────────────────────────────────────────────
    if (id === 'welcome_dep_edit') {
        await interaction.deferUpdate();
        const { buildGeneralMsgEditor } = require('./buttons_welcome_editor');
        return interaction.editReply({ components: [buildGeneralMsgEditor(interaction.guild, 'depart')] });
    }

    // ── Annuler ───────────────────────────────────────────────────────────────
    if (id === 'welcome_cancel') {
        await interaction.deferUpdate();
        delete pending[interaction.user.id];
        return interaction.editReply({ components: [buildWelcomePanel(interaction.guild)] });
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
        return interaction.editReply({ components: [buildWelcomePanel(interaction.guild)] });
    }
}

module.exports = { handleButtonWelcome, handleModalWelcome, buildWelcomePanel };