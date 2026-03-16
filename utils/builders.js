const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SectionBuilder, ThumbnailBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    EmbedBuilder,
} = require('discord.js');

const { config }             = require('./config');
const { colorInt, intToHex } = require('./helpers');

const GOLD = 0xd4a853;
const BLUE = 0x5865f2;
const RED  = 0xed4245;

function ok(val) { return val ? '🟢' : '🔴'; }
function sep()   { return new SeparatorBuilder().setDivider(true).setSpacing(2); }

// ─── Ticket public ────────────────────────────────────────────────────────────

function ticketEmbed(catKey) {
    const c = config.ticketCategories[catKey];
    return new EmbedBuilder()
        .setTitle(c.title).setDescription(c.description)
        .setColor(colorInt(c.color))
        .setFooter({ text: 'Eldoria — Système de tickets' });
}

function ticketOpenRow(catKey) {
    const c = config.ticketCategories[catKey];
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`ticket_open:${catKey}`)
            .setLabel(c.buttonLabel).setEmoji('🎫').setStyle(ButtonStyle.Primary)
    );
}

function ticketControlRow(claimed = false, claimer = null) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_close').setLabel('Fermer').setEmoji('🔒').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('ticket_claim')
            .setLabel(claimed ? `Claim : ${claimer}` : 'Claim')
            .setEmoji(claimed ? '✅' : '🙋')
            .setStyle(claimed ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setDisabled(claimed),
    );
}

// ─── Menu principal ───────────────────────────────────────────────────────────

function mainPanel(iconURL = null) {
    const cats  = config.ticketCategories;
    const keys  = Object.keys(cats);
    const total = keys.length;

    const c = new ContainerBuilder().setAccentColor(GOLD);

    const header = `# 🎫  Gestion des tickets\n-# ${total === 0 ? 'Aucun embed configuré' : `${total} embed${total > 1 ? 's' : ''} configuré${total > 1 ? 's' : ''}`}`;

    if (iconURL) {
        c.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(header))
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(iconURL))
        );
    } else {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(header));
    }

    if (total === 0) {
        c.addSeparatorComponents(sep())
         .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `Crée ton premier embed de tickets ci-dessous.\n` +
            `-# Chaque embed possède son propre affichage, ses permissions et son salon de transcripts.`
         ));
    }

    for (const key of keys) {
        const e      = cats[key];
        const hex    = typeof e.color === 'number' ? intToHex(e.color) : (e.color ?? '#5865f2');
        const catRef = e.categoryId          ? `<#${e.categoryId}>`          : '—';
        const tsRef  = e.transcriptChannelId ? `<#${e.transcriptChannelId}>` : '—';

        c.addSeparatorComponents(sep())
         .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `### ${e.label}\n` +
            `${ok(e.categoryId)}  Catégorie Discord · ${catRef}\n` +
            `${ok(e.transcriptChannelId)}  Transcripts · ${tsRef}\n` +
            `-# 🎨 \`${hex}\`  ·  🎫 *${e.buttonLabel}*`
         ))
         .addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`cfg_open:${key}`)
                .setLabel(`Modifier`).setEmoji('✏️').setStyle(ButtonStyle.Secondary)
         ));
    }

    c.addSeparatorComponents(sep())
     .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cfg_create')
            .setLabel('Nouvel embed').setEmoji('➕').setStyle(ButtonStyle.Success),
     ));

    const outerRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cfg_back_to_config')
            .setLabel('Retour').setEmoji('↩️').setStyle(ButtonStyle.Secondary),
    );

    return [c, outerRow];
}

// ─── Page embed ───────────────────────────────────────────────────────────────

function categoryPanel(key, error = null, iconURL = null) {
    const e   = config.ticketCategories[key];
    const hex = typeof e.color === 'number' ? intToHex(e.color) : (e.color ?? '#5865f2');

    const descLines  = (e.description ?? '').split('\n').map(l => `> ${l}`).join('\n');
    const preview    = `> ### ${e.title}\n${descLines}\n> \n> 🎫  *${e.buttonLabel}*`;

    const c = new ContainerBuilder().setAccentColor(colorInt(e.color));

    if (error) {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`> ❌  **Erreur** — ${error}`))
         .addSeparatorComponents(sep());
    }

    const header = `# ${e.label}\n-# Clé : \`${key}\``;
    if (iconURL) {
        c.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(header))
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(iconURL))
        );
    } else {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(header));
    }

    const catRef = e.categoryId          ? `<#${e.categoryId}>`          : '*Non définie*';
    const tsRef  = e.transcriptChannelId ? `<#${e.transcriptChannelId}>` : '*Non défini*';

    c.addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### Configuration\n` +
        `${ok(e.categoryId)}  **Catégorie Discord** · ${catRef}\n` +
        `${ok(e.transcriptChannelId)}  **Transcripts** · ${tsRef}\n` +
        `🎨  **Couleur** · \`${hex}\``
     ))
     .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`cfg_setcat:${key}`).setLabel('Catégorie Discord').setEmoji('📁').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`cfg_transcript:${key}`).setLabel('Transcripts').setEmoji('📋').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`cfg_color:${key}`).setLabel('Couleur').setEmoji('🎨').setStyle(ButtonStyle.Secondary),
     ))
     .addSeparatorComponents(sep())
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Aperçu de l'embed public\n${preview}`))
     .addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1))
     .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`cfg_edit:${key}`).setLabel('Modifier l\'embed').setEmoji('✏️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`cfg_send:${key}`).setLabel('Envoyer dans un salon').setEmoji('📤').setStyle(ButtonStyle.Primary),
     ));

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cfg_back').setLabel('Retour').setEmoji('↩️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`cfg_save:${key}`).setLabel('Sauvegarder').setEmoji('💾').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`cfg_preview:${key}`).setLabel('Aperçu').setEmoji('👁️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`cfg_delete_ask:${key}`).setLabel('Supprimer').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
    );

    return [c, row];
}

// ─── Confirmation suppression ─────────────────────────────────────────────────

function deletePanel(key) {
    const e = config.ticketCategories[key];

    const c = new ContainerBuilder().setAccentColor(RED)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# 🗑️  Supprimer un embed\n-# Cette action est irréversible`
        ))
        .addSeparatorComponents(sep())
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `Tu es sur le point de supprimer l'embed **${e.label}**.\n\n` +
            `Les tickets déjà ouverts ne seront pas affectés, mais il ne sera plus possible d'en ouvrir de nouveaux.\n\n` +
            `-# La configuration sera définitivement supprimée.`
        ));

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`cfg_back_cat:${key}`).setLabel('Annuler').setEmoji('✖️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`cfg_delete_yes:${key}`).setLabel('Supprimer définitivement').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
    );

    return [c, row];
}

// ─── Attente saisie par message ───────────────────────────────────────────────

function awaitPanel(type, key) {
    const e = config.ticketCategories[key] ?? { label: key };

    const infos = {
        setcat:     { emoji: '📁', title: 'Catégorie Discord',   what: 'Envoie l\'**ID de la catégorie Discord**',    hint: 'Clic droit sur la catégorie → *Copier l\'identifiant*\n-# Active le mode développeur : Paramètres → Avancés → Mode développeur.' },
        transcript: { emoji: '📋', title: 'Salon des transcripts', what: 'Envoie le **#salon** ou son **ID**',         hint: 'Exemple : `#transcripts` ou l\'ID numérique.' },
        sendchan:   { emoji: '📤', title: 'Envoyer le panel',      what: 'Envoie le **#salon** ou son **ID**',         hint: 'L\'embed et le bouton d\'ouverture seront envoyés dans ce salon.' },
    };

    const i = infos[type] ?? { emoji: '⌨️', title: 'Saisie', what: 'Envoie ta réponse.', hint: '' };

    const c = new ContainerBuilder().setAccentColor(BLUE)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# ${i.emoji}  ${i.title}\n-# Embed : **${e.label}**`
        ))
        .addSeparatorComponents(sep())
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${i.what} dans ce salon.\n\n${i.hint}\n\n-# Tape \`annuler\` ou clique ci-dessous pour annuler.`
        ));

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cfg_cancel').setLabel('Annuler').setEmoji('✖️').setStyle(ButtonStyle.Secondary)
    );

    return [c, row];
}

module.exports = {
    ticketEmbed, ticketOpenRow, ticketControlRow,
    mainPanel, categoryPanel, deletePanel, awaitPanel,
};