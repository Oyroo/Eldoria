const { config, saveConfig } = require('./config');
 
// ─── État des reminders ───────────────────────────────────────────────────────
// config.bumpReminders = {
//   bump: { channelId, roleId, lastBump, timer },
//   vote: { channelId, roleId, lastVote, timer }
// }
 
let timers = {};
 
// ─── Planifier un reminder ────────────────────────────────────────────────────
 
function scheduleReminder(client, type, delayMs) {
    if (timers[type]) clearTimeout(timers[type]);
 
    timers[type] = setTimeout(async () => {
        const conf = config.bumpReminders?.[type];
        if (!conf?.channelId) return;
 
        try {
            const channel = await client.channels.fetch(conf.channelId);
            if (!channel) return;
 
            const emoji   = type === 'bump' ? '📣' : '🗳️';
            const label   = type === 'bump' ? 'bump Disboard' : 'vote pour le serveur';
            const cmd     = type === 'bump' ? '</bump:947088344167366698>' : '/vote';
            const mention = conf.roleId ? `<@&${conf.roleId}> ` : '';
 
            await channel.send({
                content: `${mention}${emoji} Il est temps de faire le **${label}** ! → ${cmd}`,
                allowedMentions: { roles: conf.roleId ? [conf.roleId] : [] },
            });
        } catch (err) {
            console.error(`bumpReminder [${type}]:`, err.message);
        }
    }, delayMs);
}


function recordAction(client, type) {
    if (!config.bumpReminders) config.bumpReminders = {};
    if (!config.bumpReminders[type]) config.bumpReminders[type] = {};
    config.bumpReminders[type].lastAction = Date.now();
    saveConfig();

    const delay = type === 'bump' ? 2 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000; // 2h pour bump, 12h pour vote
    scheduleReminder(client, type, delay);
}

function restoreReminders(client) {
    const reminder = config.bumpReminders ?? {};
    const delays = {
        bump: 2 * 60 * 60 * 1000, // 2h
        vote: 12 * 60 * 60 * 1000, // 12h
    };

    for (const [type, conf] of Object.entries(reminder)) {
        if (!conf.lastAction || !conf.channelId) continue;
        const elapsed = Date.now() - conf.lastAction;
        const remaining = delays[type] - elapsed;
        if (remaining > 0) {
            scheduleReminder(client, type, remaining);
            console.log(`⏰ Reminder ${type} restauré, déclenchement dans ${Math.round(remaining / 1000)}s.`);
        }
    }
}

function userOptOut(userId, type) {
    if (!config.bumpOptOut) config.bumpOptOut = {};
    if (!config.bumpOptOut[type]) config.bumpOptOut[type] = [];
    if (!config.bumpOptOut[type].includes(userId)) {
        config.bumpOptOut[type].push(userId);
        saveConfig();
    }
}
 
function userOptIn(userId, type) {
    if (!config.bumpOptOut?.[type]) return;
    config.bumpOptOut[type] = config.bumpOptOut[type].filter(id => id !== userId);
    saveConfig();
}
 
function hasOptedOut(userId, type) {
    return config.bumpOptOut?.[type]?.includes(userId) ?? false;
}
 
module.exports = { recordAction, restoreReminders, userOptOut, userOptIn, hasOptedOut };