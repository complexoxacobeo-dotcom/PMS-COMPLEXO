const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Remove inboxModal HTML
const inboxModalStart = `<!-- Modal Inbox Reservas -->`;
const inboxModalEnd = `</div>\n    </div>`;
const startIndex = code.indexOf(inboxModalStart);
if (startIndex !== -1) {
    const nextModalIndex = code.indexOf('<!-- Modal Importación de Lista -->', startIndex);
    if (nextModalIndex !== -1) {
        code = code.substring(0, startIndex) + code.substring(nextModalIndex);
    }
}

// Remove window.openInboxReservas block
const openInboxRegex = /window\.openInboxReservas = function\(\) \{[\s\S]*?\};\n/g;
code = code.replace(openInboxRegex, '');

// Remove window.syncIcalReservations block
const syncIcalRegex = /window\.isSyncingIcal = false;\s*window\.syncIcalReservations = async function\(silent = false\) \{[\s\S]*?return;\n        \};\n/g;
code = code.replace(syncIcalRegex, '');

// Remove purgeIcalBlocks block
const purgeRegex = /window\.purgeIcalBlocks = async function\(\) \{[\s\S]*?\}\n\n/g;
code = code.replace(purgeRegex, '');

// Remove parseIcal functions
const parseIcalRegex = /function parseIcal\(icalStr\) \{[\s\S]*?function parseIcalDate\(icalDateStr\) \{[\s\S]*?return str;\n        \}\n/g;
code = code.replace(parseIcalRegex, '');

fs.writeFileSync('index.html', code);
