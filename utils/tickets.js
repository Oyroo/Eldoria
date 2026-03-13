const fs   = require('fs');
const path = require('path');

const TICKETS_FILE = path.join(__dirname, '..', 'tickets.json');

let openTickets = {};

function loadTickets() {
    try {
        if (fs.existsSync(TICKETS_FILE))
            openTickets = JSON.parse(fs.readFileSync(TICKETS_FILE, 'utf-8'));
    } catch {
        openTickets = {};
    }
}

function saveTickets() {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(openTickets, null, 2));
}

function getTickets() {
    return openTickets;
}

module.exports = { loadTickets, saveTickets, getTickets };