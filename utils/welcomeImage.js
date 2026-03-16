let createCanvas;
let loadImage;

try {
    ({ createCanvas, loadImage } = require('canvas'));
} catch {
    // If canvas is not installed or fails to load, we fall back to no image.
}

/**
 * Create a PNG buffer for a welcome/leave image.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {'welcome'|'leave'} type
 * @returns {Promise<Buffer>}
 */
async function createWelcomeImage(member, type = 'welcome') {
    if (!createCanvas || !loadImage) {
        throw new Error('Canvas module not available');
    }

    const width = 960;
    const height = 360;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    if (type === 'welcome') {
        gradient.addColorStop(0, '#2b2d42');
        gradient.addColorStop(1, '#8d99ae');
    } else {
        gradient.addColorStop(0, '#3a3b47');
        gradient.addColorStop(1, '#1b1c21');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Slight overlay pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    for (let i = 0; i < 30; i += 1) {
        ctx.fillRect(0, (height / 30) * i, width, 2);
    }

    // Avatar
    const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatar = await loadImage(avatarUrl);
    const avatarSize = 220;
    const avatarX = 70;
    const avatarY = (height - avatarSize) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.stroke();

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';

    ctx.font = 'bold 55px Sans';
    ctx.fillText(type === 'welcome' ? 'Bienvenue' : 'Au revoir', 320, 120);

    ctx.font = 'bold 38px Sans';
    ctx.fillText(member.user.tag, 320, 180);

    ctx.font = '26px Sans';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';

    if (type === 'welcome') {
        ctx.fillText(`Sur ${member.guild.name}, tu peux explorer et t'amuser !`, 320, 240);
    } else {
        ctx.fillText(`Tu vas nous manquer. Reviens quand tu veux !`, 320, 240);
    }

    return canvas.toBuffer('image/png');
}

module.exports = { createWelcomeImage };
