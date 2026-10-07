const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const match = html.match(/window\.syncIcalReservations = async function.*?window\.isSyncingIcal = false;\s*\};/s);
if (match) {
    console.log(match[0].substring(0, 1000) + '...\n\n...' + match[0].substring(match[0].length - 1000));
} else {
    console.log("Could not find function");
}
