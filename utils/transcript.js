const { config } = require('./config');

async function generateTranscript(channel, ticketInfo) {
    const messages = [];
    let lastId;

    // Récupère tous les messages par tranches de 100
    while (true) {
        const opts = { limit: 100 };
        if (lastId) opts.before = lastId;
        const fetched = await channel.messages.fetch(opts);
        if (!fetched.size) break;
        messages.push(...fetched.values());
        lastId = fetched.last().id;
        if (fetched.size < 100) break;
    }
    messages.reverse();

    const cat      = config.ticketCategories[ticketInfo.catKey];
    const catLabel = cat?.label ?? ticketInfo.catKey;
    const openedAt = new Date(ticketInfo.openedAt).toLocaleString('fr-FR');
    const closedAt = new Date().toLocaleString('fr-FR');
    const claimed  = ticketInfo.claimedBy
        ? `<b>${ticketInfo.claimedBy}</b>`
        : '<em>Non claim</em>';

    const rows = messages.map(m => {
        const time    = new Date(m.createdTimestamp).toLocaleString('fr-FR');
        const avatar  = m.author.displayAvatarURL({ size: 32, extension: 'png' });
        const content = m.content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            || '<em style="opacity:.4">— pas de texte —</em>';
        const files = [...m.attachments.values()]
            .map(a => `<a href="${a.url}" target="_blank">[📎 ${a.name}]</a>`)
            .join(' ');
        return (
            `<div class="msg">` +
            `<img class="av" src="${avatar}" alt="">` +
            `<div class="b">` +
            `<span class="au">${m.author.username}</span>` +
            `<span class="ti">${time}</span>` +
            `<div class="co">${content} ${files}</div>` +
            `</div></div>`
        );
    }).join('');

    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Transcript — ${channel.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #1e1f22; color: #dcddde; font-family: 'Segoe UI', sans-serif; font-size: 14px; }
  header { background: #2b2d31; border-bottom: 1px solid #111; padding: 20px 32px; }
  h1 { font-size: 18px; font-weight: 600; color: #fff; display: flex; align-items: center; gap: 8px; }
  .meta { font-size: 12px; color: #949ba4; margin-top: 4px; }
  .badge { font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 99px; }
  .b1 { background: #d4a853; color: #1e1f22; }
  .b2 { background: #5865f2; color: #fff; }
  .msgs { padding: 24px 32px; display: flex; flex-direction: column; gap: 2px; }
  .msg { display: flex; gap: 12px; padding: 4px 8px; border-radius: 4px; }
  .msg:hover { background: rgba(255,255,255,.03); }
  .av { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; margin-top: 2px; }
  .b { flex: 1; min-width: 0; }
  .au { font-weight: 600; color: #fff; margin-right: 8px; }
  .ti { font-size: 11px; color: #6d6f78; }
  .co { color: #dcddde; line-height: 1.5; margin-top: 2px; word-break: break-word; }
  .co a { color: #00aff4; }
  footer { padding: 16px 32px; border-top: 1px solid #2b2d31; font-size: 12px; color: #6d6f78; text-align: center; }
</style>
</head>
<body>
<header>
  <h1>
    #${channel.name}
    <span class="badge b1">Ticket #${String(ticketInfo.ticketNumber).padStart(4, '0')}</span>
    <span class="badge b2">${catLabel}</span>
  </h1>
  <div class="meta">
    Ouvert par <b>${ticketInfo.username}</b> le ${openedAt}
    · Fermé le ${closedAt}
    · Claim : ${claimed}
  </div>
</header>
<div class="msgs">${rows}</div>
<footer>Eldoria Bot — ${messages.length} message${messages.length > 1 ? 's' : ''}</footer>
</body>
</html>`;
}

module.exports = { generateTranscript };