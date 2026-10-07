const fs = require('fs');
let code = fs.readFileSync('src/firebase-backend.js', 'utf8');

// The line is: const queryStr = encodeURIComponent('newer_than:7d -in:spam -in:trash (reserva OR reservas OR disponibilidad OR availability OR booking OR habitación OR room)');
const oldQueryLine = "const queryStr = encodeURIComponent('newer_than:7d -in:spam -in:trash (reserva OR reservas OR disponibilidad OR availability OR booking OR habitación OR room)');";
const newQueryLine = "const queryStr = encodeURIComponent('-in:spam -in:trash (reserva OR reservas OR disponibilidad OR availability OR booking OR habitación OR room)');";

if(code.includes(oldQueryLine)) {
    code = code.replace(oldQueryLine, newQueryLine);
    fs.writeFileSync('src/firebase-backend.js', code);
    console.log("Patched query successfully!");
} else {
    console.log("Could not find old query string.");
}
