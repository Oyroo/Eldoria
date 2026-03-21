const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');

// Polices Jost depuis node_modules (@fontsource/jost dans package.json)
GlobalFonts.registerFromPath(
    require.resolve('@fontsource/jost/files/jost-latin-700-normal.woff2'), 'JostBold'
);
GlobalFonts.registerFromPath(
    require.resolve('@fontsource/jost/files/jost-latin-600-normal.woff2'), 'JostSemiBold'
);

const W  = 820;
const H  = 280;
// ─── Couleur dominante de l'avatar ────────────────────────────────────────────

function getDominantColor(img, size = 64) {
    const tmp = createCanvas(size, size);
    const ctx = tmp.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);

    const buckets = {};
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 128) continue;
        const brightness = (r + g + b) / 3;
        if (brightness < 30 || brightness > 220) continue;
        const key = `${r >> 5},${g >> 5},${b >> 5}`;
        if (!buckets[key]) buckets[key] = { r: 0, g: 0, b: 0, n: 0 };
        buckets[key].r += r;
        buckets[key].g += g;
        buckets[key].b += b;
        buckets[key].n++;
    }

    let best = null, bestN = 0;
    for (const b of Object.values(buckets)) {
        if (b.n > bestN) { bestN = b.n; best = b; }
    }

    if (!best) return '#d4a853'; // fallback or Eldoria
    const r = Math.round(best.r / best.n).toString(16).padStart(2, '0');
    const g = Math.round(best.g / best.n).toString(16).padStart(2, '0');
    const b = Math.round(best.b / best.n).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

// ─── Génération du banner ─────────────────────────────────────────────────────

async function generateWelcomeBanner(member) {
    const canvas    = createCanvas(W, H);
    const ctx       = canvas.getContext('2d');
    const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatar    = await loadImage(avatarURL);
    const glow      = getDominantColor(avatar);

    // Fond 100% transparent

    // ── Avatar ────────────────────────────────────────────────────────────────
    const AX = 152, AY = H / 2, AR = 88;

    // Halo couleur dominante
    const halo = ctx.createRadialGradient(AX, AY, AR * 0.5, AX, AY, AR + 55);
    halo.addColorStop(0,   glow + '30');
    halo.addColorStop(0.5, glow + '18');
    halo.addColorStop(1,   'transparent');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(AX, AY, AR + 55, 0, Math.PI * 2);
    ctx.fill();

    // Photo de profil circulaire
    ctx.save();
    ctx.beginPath();
    ctx.arc(AX, AY, AR, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, AX - AR, AY - AR, AR * 2, AR * 2);
    ctx.restore();

    // Bordure fine couleur dominante
    ctx.strokeStyle = glow + '40';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(AX, AY, AR + 2, 0, Math.PI * 2);
    ctx.stroke();

    // ── Séparateur vertical ───────────────────────────────────────────────────
    const sepG = ctx.createLinearGradient(0, 40, 0, H - 40);
    sepG.addColorStop(0,   'transparent');
    sepG.addColorStop(0.3, 'rgba(255,255,255,0.07)');
    sepG.addColorStop(0.7, 'rgba(255,255,255,0.07)');
    sepG.addColorStop(1,   'transparent');
    ctx.strokeStyle = sepG;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(272, 40);
    ctx.lineTo(272, H - 40);
    ctx.stroke();

    // ── Textes ────────────────────────────────────────────────────────────────
    const TX         = 312;
    const yBienvenue = 122;
    const yLine      = yBienvenue + 10;
    const ySub       = yLine + 24;
    const yName      = ySub + 46;

    ctx.font         = '72px JostBold';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';

    // "Bienvenue"
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Bienvenue', TX, yBienvenue);

    // Masque la pointe du v avec un rectangle fond
    const wBien = ctx.measureText('Bien').width;
    const wV    = ctx.measureText('v').width;
    ctx.fillStyle = BG;
    ctx.fillRect(TX + wBien - 1, yBienvenue, wV + 2, 9);

    // Ligne dégradé fondu (couleur dominante)
    const lg = ctx.createLinearGradient(TX, 0, TX + 400, 0);
    lg.addColorStop(0,   glow + 'bb');
    lg.addColorStop(0.5, glow + '44');
    lg.addColorStop(1,   'transparent');
    ctx.strokeStyle = lg;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(TX, yLine);
    ctx.lineTo(TX + 400, yLine);
    ctx.stroke();

    // "sur le serveur Discord"
    ctx.font      = '17px JostSemiBold';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('sur le serveur Discord', TX, ySub);

    // Nom du serveur
    ctx.font      = '42px JostBold';
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.fillText(member.guild.name, TX, yName);

    // Numéro de membre — bas droite discret
    ctx.font      = '12px JostSemiBold';
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.textAlign = 'right';
    ctx.fillText(`Membre #${member.guild.memberCount}`, W - 28, H - 18);

    return canvas.toBuffer('image/png');
}

module.exports = { generateWelcomeBanner };