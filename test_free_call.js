const fs = require('fs');
let code = fs.readFileSync('src/firebase-backend.js', 'utf8');
console.log(code.includes('freeIcalReservation(uid, checkIn, noches, targetBaseId, oldClientName)'));
