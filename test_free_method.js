const fs = require('fs');
let code = fs.readFileSync('src/firebase-backend.js', 'utf8');
if (code.includes('freeIcalReservation: async (uid, checkIn, noches)')) {
    console.log("Method exists");
}
