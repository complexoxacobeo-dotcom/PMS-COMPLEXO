const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /\.propagarReserva\(res\.checkIn,\s*res\.checkOut,\s*null,\s*updatedRooms,\s*res\.checkIn\);/g;

html = html.replace(regex, '.propagarReserva(res.checkIn, res.checkOut, updatedRooms.map(r => r.id), updatedRooms, res.checkIn);');
fs.writeFileSync('index.html', html);
console.log("Patched propagarReserva null arg");
