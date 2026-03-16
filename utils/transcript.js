const { config } = require('./config');

async function generate(channel, info) {
    const msgs = [];
    let lastId;
    while (true) {
        const opts = { limit: 100 };
        if (lastId) opts.before = lastId;
        const batch = await channel.messages.fetch(opts);
        if (!batch.size) break;
        msgs.push(...batch.values());
        lastId = batch.last().id;
        if (batch.size < 100) break;
    }
    msgs.reverse();

    const cat      = config.ticketCategories[info.catKey];
    const catLabel = cat?.label ?? info.catKey;
    const openedAt = new Date(info.openedAt).toLocaleString('fr-FR');
    const closedAt = new Date().toLocaleString('fr-FR');
    const claimed  = info.claimedBy ? `<b>${info.claimedBy}</b>` : '<em>Non claim</em>';
    const num      = String(info.ticketNumber).padStart(4, '0');

    const rows = msgs.map(m => {
        const time    = new Date(m.createdTimestamp).toLocaleString('fr-FR');
        const avatar  = m.author.displayAvatarURL({ size: 32, extension: 'png' });
        const content = m.content
            .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>')
            || '<em style="opacity:.4">—</em>';
        const files = [...m.attachments.values()]
            .map(a => `<a href="${a.url}" target="_blank">📎 ${a.name}</a>`).join(' ');
        return `<div class="msg"><img class="av" src="${avatar}"><div class="b"><span class="au">${m.author.username}</span><span class="ti">${time}</span><div class="co">${content} ${files}</div></div></div>`;
    }).join('');

    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Transcript #${num}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#1e1f22;color:#dcddde;font-family:'Segoe UI',sans-serif;font-size:14px}
header{background:#2b2d31;border-bottom:1px solid #111;padding:20px 32px}
h1{font-size:18px;font-weight:600;color:#fff;display:flex;align-items:center;gap:8px}
.meta{font-size:12px;color:#949ba4;margin-top:4px}
.badge{font-size:11px;font-weight:700;padding:2px 10px;border-radius:99px}
.gold{background:#d4a853;color:#1e1f22} .blue{background:#5865f2;color:#fff}
.msgs{padding:24px 32px;display:flex;flex-direction:column;gap:2px}
.msg{display:flex;gap:12px;padding:4px 8px;border-radius:4px}
.msg:hover{background:rgba(255,255,255,.03)}
.av{width:36px;height:36px;border-radius:50%;flex-shrink:0;margin-top:2px}
.b{flex:1;min-width:0}
.au{font-weight:600;color:#fff;margin-right:8px}
.ti{font-size:11px;color:#6d6f78}
.co{color:#dcddde;line-height:1.5;margin-top:2px;word-break:break-word}
.co a{color:#00aff4}
footer{padding:16px 32px;border-top:1px solid #2b2d31;font-size:12px;color:#6d6f78;text-align:center}
</style></head><body>
<header>
  <h1>#${channel.name} <span class="badge gold">Ticket #${num}</span> <span class="badge blue">${catLabel}</span></h1>
  <div class="meta">Ouvert par <b>${info.username}</b> le ${openedAt} · Fermé le ${closedAt} · Claim : ${claimed}</div>
</header>
<div class="msgs">${rows}</div>
<footer>Eldoria — ${msgs.length} message${msgs.length > 1 ? 's' : ''}</footer>
</body></html>`;
}

module.exports = { generate };