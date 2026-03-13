function hexToInt(hex) {
    const v = parseInt(hex.replace('#', ''), 16);
    return isNaN(v) ? 0x5865f2 : v;
}

function intToHex(n) {
    return '#' + (typeof n === 'number' ? n : 0x5865f2).toString(16).padStart(6, '0');
}

function colorInt(c) {
    return typeof c === 'number' ? c : hexToInt(c ?? '#5865f2');
}

function slugify(str) {
    return str.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 24) || 'item_' + Date.now();
}

function uniqueKey(label, existing) {
    const base = slugify(label);
    if (!existing[base]) return base;
    let i = 2;
    while (existing[`${base}_${i}`]) i++;
    return `${base}_${i}`;
}

module.exports = { hexToInt, intToHex, colorInt, slugify, uniqueKey };