const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SectionBuilder, ThumbnailBuilder,
} = require('discord.js');

const Flags = require('./flags');

// ─── Données météo ────────────────────────────────────────────────────────────

const METEOS = {
    ensoleille: {
        label:       'Ensoleillé',
        emoji:       '☀️',
        couleur:     0xf4c542,
        description: 'Le ciel est d\'un bleu immaculé. Le soleil réchauffe les pierres et les visages. Une lumière dorée baigne le monde d\'Eldoria.',
        effet:       'Les voyageurs avancent sans peine. Les marchés s\'animent et les routes sont praticables.',
        intensite:   'Légère',
        transitions: ['ensoleille', 'nuageux', 'vent', 'canicule'],
    },
    nuageux: {
        label:       'Nuageux',
        emoji:       '⛅',
        couleur:     0x95a5a6,
        description: 'De grands nuages gris traversent le ciel avec lenteur. La lumière est douce, presque diffuse, comme filtrée par un voile invisible.',
        effet:       'Les conditions de voyage restent correctes. Une légère fraîcheur s\'installe.',
        intensite:   'Légère',
        transitions: ['nuageux', 'ensoleille', 'pluie', 'brumeux', 'vent'],
    },
    brumeux: {
        label:       'Brumeux',
        emoji:       '🌫️',
        couleur:     0xbdc3c7,
        description: 'Un voile de brume dense enveloppe le monde. Les contours des bâtiments et des forêts se fondent dans un gris cotonneux et mystérieux.',
        effet:       'La visibilité est réduite. Les déplacements sont plus lents et les rencontres inattendues plus probables.',
        intensite:   'Modérée',
        transitions: ['brumeux', 'nuageux', 'pluie', 'ensoleille'],
    },
    crachin: {
        label:       'Crachin',
        emoji:       '🌦️',
        couleur:     0x7f8c8d,
        description: 'Une fine pluie froide tombe sans relâche. Pas assez forte pour vraiment mouiller, mais assez tenace pour décourager les plus téméraires.',
        effet:       'Les routes deviennent légèrement boueuses. Les gens restent chez eux autant que possible.',
        intensite:   'Légère',
        transitions: ['crachin', 'pluie', 'nuageux', 'brumeux'],
    },
    pluie: {
        label:       'Pluie',
        emoji:       '🌧️',
        couleur:     0x2980b9,
        description: 'La pluie tombe dru sur les toits et les chemins. Les ruisseaux gonflent et les flaques se forment partout. L\'odeur de la terre mouillée emplit l\'air.',
        effet:       'Les routes sont boueuses et les traversées difficiles. Les voyageurs cherchent refuge dans les auberges et les abris.',
        intensite:   'Modérée',
        transitions: ['pluie', 'orage', 'crachin', 'nuageux', 'brumeux'],
    },
    orage: {
        label:       'Orage',
        emoji:       '⛈️',
        couleur:     0x6c3483,
        description: 'Le tonnerre gronde au loin et les éclairs déchirent le ciel noir. La pluie tombe en torrents et le vent s\'engouffre dans les rues avec fracas.',
        effet:       'Les déplacements sont dangereux. Les communications sont perturbées et les montures refusent d\'avancer.',
        intensite:   'Sévère',
        transitions: ['orage', 'pluie', 'tempete', 'vent', 'nuageux'],
    },
    tempete: {
        label:       'Tempête',
        emoji:       '🌪️',
        couleur:     0x922b21,
        description: 'Une tempête déchaînée s\'abat sur Eldoria. Le vent hurle, les arbres ploient, les toits tremblent. Le ciel est noir et furieux.',
        effet:       'Tout déplacement extérieur est extrêmement dangereux. Certains bâtiments peuvent être endommagés.',
        intensite:   'Extrême',
        transitions: ['orage', 'pluie', 'vent'],
    },
    vent: {
        label:       'Venteux',
        emoji:       '💨',
        couleur:     0x1abc9c,
        description: 'Un vent puissant souffle depuis les plaines du nord. Il agite les drapeaux, renverse les étals et siffle entre les ruelles étroites.',
        effet:       'La progression à cheval ou en chariot est ralentie. Les flambeaux et feux de camp sont difficiles à maintenir.',
        intensite:   'Modérée',
        transitions: ['vent', 'nuageux', 'ensoleille', 'orage', 'brumeux'],
    },
    grele: {
        label:       'Grêle',
        emoji:       '🌨️',
        couleur:     0x5d6d7e,
        description: 'Des grêlons blancs et durs tombent du ciel avec force. Ils rebondissent sur le sol avec un bruit sec et s\'accumulent en petits tas translucides.',
        effet:       'Les récoltes peuvent être endommagées. Les animaux cherchent refuge et les voyageurs également.',
        intensite:   'Sévère',
        transitions: ['grele', 'pluie', 'nuageux', 'orage'],
    },
    neige: {
        label:       'Neige',
        emoji:       '❄️',
        couleur:     0xd6eaf8,
        description: 'Des flocons blancs et silencieux descendent lentement du ciel. La neige recouvre le monde d\'un manteau immaculé, étouffant les sons et la vie.',
        effet:       'Les routes sont rendues difficiles. Certains cols de montagne peuvent devenir impraticables.',
        intensite:   'Modérée',
        transitions: ['neige', 'blizzard', 'nuageux', 'brumeux'],
    },
    blizzard: {
        label:       'Blizzard',
        emoji:       '🌬️',
        couleur:     0xa9cce3,
        description: 'Un blizzard féroce ensevelit Eldoria sous des rafales de neige et de vent glacial. La visibilité est quasi nulle. Le froid mord la chair et les os.',
        effet:       'Tout déplacement est impossible. Les habitants condamnent leurs fenêtres et se terrent au chaud.',
        intensite:   'Extrême',
        transitions: ['blizzard', 'neige', 'vent'],
    },
    canicule: {
        label:       'Canicule',
        emoji:       '🔥',
        couleur:     0xe74c3c,
        description: 'Une chaleur écrasante s\'abat sur Eldoria. L\'air tremble au-dessus des pavés brûlants. Pas un souffle de vent ne vient soulager les habitants épuisés.',
        effet:       'La fatigue des voyageurs est accrue. Les réserves d\'eau sont à surveiller. Les combats sont plus éprouvants.',
        intensite:   'Sévère',
        transitions: ['canicule', 'ensoleille', 'nuageux', 'orage'],
    },
};

const INTENSITE_COULEUR = {
    'Légère':  '🟢',
    'Modérée': '🟡',
    'Sévère':  '🟠',
    'Extrême': '🔴',
};

// ─── Sélection logique ────────────────────────────────────────────────────────

function choisirProchaineMeteo(meteoActuelle) {
    const meteo = METEOS[meteoActuelle];
    if (!meteo) {
        // Météo inconnue → météo de base aléatoire parmi légères
        const bases = ['ensoleille', 'nuageux', 'vent'];
        return bases[Math.floor(Math.random() * bases.length)];
    }
    const pool = meteo.transitions;
    return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Builder embed CV2 ────────────────────────────────────────────────────────

function buildMeteoEmbed(meteoKey, guildIconURL = null) {
    const m   = METEOS[meteoKey];
    const now = new Date();
    const date = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const dateCapitalized = date.charAt(0).toUpperCase() + date.slice(1);

    const intensiteIcon = INTENSITE_COULEUR[m.intensite] ?? '⚪';

    const c = new ContainerBuilder().setAccentColor(m.couleur);

    const section = new SectionBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# ${m.emoji}  Météo d'Eldoria\n` +
            `-# ${dateCapitalized}`
        )
    );

    if (guildIconURL) {
        section.setThumbnailAccessory(new ThumbnailBuilder().setURL(guildIconURL));
    }

    c.addSectionComponents(section)
     .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${m.emoji}  ${m.label}\n` +
        `${m.description}`
     ))
     .addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### Conditions du jour\n` +
        `${intensiteIcon}  **Intensité** · ${m.intensite}\n` +
        `⚠️  **Effet RP** · ${m.effet}`
     ))
     .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2))
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `-# Bulletin météorologique officiel d'Eldoria · Mis à jour quotidiennement`
     ));

    return c;
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

let schedulerInterval = null;

function startScheduler(client) {
    if (schedulerInterval) clearInterval(schedulerInterval);

    // Vérifie toutes les minutes si c'est l'heure d'envoyer la météo
    schedulerInterval = setInterval(async () => {
        const { config, saveConfig } = require('./config');
const { logMeteo }            = require('./botLogger');
        const meteoConfig = config.meteo;
        if (!meteoConfig?.active || !meteoConfig?.channelId || !meteoConfig?.heure) return;

        const now       = new Date();
        const heureNow  = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        const dateNow   = now.toISOString().split('T')[0];

        if (heureNow !== meteoConfig.heure) return;
        if (meteoConfig.dernierEnvoi === dateNow) return; // déjà envoyée aujourd'hui

        try {
            const channel = await client.channels.fetch(meteoConfig.channelId);
            if (!channel) return;

            const guild        = channel.guild;
            const guildIconURL = guild?.iconURL({ size: 256, extension: 'png' }) ?? null;

            // Choisir la prochaine météo
            const prochaine = choisirProchaineMeteo(meteoConfig.meteoActuelle ?? null);
            meteoConfig.meteoActuelle = prochaine;
            meteoConfig.dernierEnvoi  = dateNow;
            saveConfig();

            const embed = buildMeteoEmbed(prochaine, guildIconURL);
            await channel.send({ components: [embed], flags: Flags.CV2 });

            logMeteo(channel.guild, METEOS[prochaine].label, channel).catch(() => {});
            console.log(`☀️ Météo envoyée : ${METEOS[prochaine].label} dans #${channel.name}`);
        } catch (err) {
            console.error('Erreur envoi météo :', err.message);
        }
    }, 60 * 1000); // toutes les minutes
}

module.exports = { METEOS, INTENSITE_COULEUR, buildMeteoEmbed, choisirProchaineMeteo, startScheduler };