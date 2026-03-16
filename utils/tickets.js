const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'tickets.json');
let tickets = {};

function load() {
    try { if (fs.existsSync(FILE)) tickets = JSON.parse(fs.readFileSync(FILE, 'utf-8')); }
    catch { tickets = {}; }
}

function save() {
    fs.writeFileSync(FILE, JSON.stringify(tickets, null, 2));
}

function get() { return tickets; }

module.exports = { load, save, get };