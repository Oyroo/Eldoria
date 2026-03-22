const { log } = require('./logger');

// Commande utilisée
async function logCommand(guild, user, commandName) {
    await log(guild, 'bot', {
        title:  `⌨️  Commande utilisée`,
        fields: [
            { name: 'Commande', value: `\`/${commandName}\``, inline: true },
            { name: 'Par',      value: `<@${user.id}>`,       inline: true },
        ],
        thumbnail: user.displayAvatarURL({ size: 64 }),
    });
}

// Ticket ouvert
async function logTicketOpen(guild, user, ticketChannel, embedLabel) {
    await log(guild, 'bot', {
        title:  `🎫  Ticket ouvert`,
        fields: [
            { name: 'Salon',  value: `<#${ticketChannel.id}>`, inline: true },
            { name: 'Par',    value: `<@${user.id}>`,          inline: true },
            { name: 'Embed',  value: embedLabel,               inline: true },
        ],
        thumbnail: user.displayAvatarURL({ size: 64 }),
    });
}

// Ticket fermé
async function logTicketClose(guild, closedBy, ticketInfo) {
    await log(guild, 'bot', {
        title:  `🔒  Ticket fermé`,
        fields: [
            { name: 'Ticket',    value: `#${String(ticketInfo.ticketNumber).padStart(4,'0')}`, inline: true },
            { name: 'Fermé par', value: `<@${closedBy.id}>`,  inline: true },
            { name: 'Ouvert par',value: `<@${ticketInfo.userId}>`, inline: true },
        ],
        thumbnail: closedBy.displayAvatarURL({ size: 64 }),
    });
}

// Météo envoyée
async function logMeteo(guild, meteoLabel, channel) {
    await log(guild, 'bot', {
        title:  `🌦️  Météo envoyée`,
        fields: [
            { name: 'Météo',    value: meteoLabel,             inline: true },
            { name: 'Dans',     value: `<#${channel.id}>`,     inline: true },
        ],
    });
}

// Welcome envoyé
async function logWelcome(guild, member) {
    await log(guild, 'bot', {
        title:  `👋  Message de bienvenue envoyé`,
        fields: [
            { name: 'Membre', value: `<@${member.id}> (${member.user.tag})`, inline: true },
        ],
        thumbnail: member.user.displayAvatarURL({ size: 64 }),
    });
}

// Erreur bot
async function logError(guild, context, error) {
    await log(guild, 'bot', {
        title:       `❌  Erreur bot`,
        description: `\`${error.message}\``,
        fields: [{ name: 'Contexte', value: context }],
    });
}

module.exports = { logCommand, logTicketOpen, logTicketClose, logMeteo, logWelcome, logError };