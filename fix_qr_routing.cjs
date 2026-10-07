const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Use the exact current path for the QR generation
const replacement = `const qrDataStr = btoa(encodeURIComponent("XAC|" + currentPlaningDate + "|" + room.id + "|" + tipo + "|" + qty));
            // Always point precisely to the domain serving the app, no matter what it is
            const appUrl = window.location.origin + "/?qr=" + qrDataStr;
            const qrPayload = encodeURIComponent(appUrl);`;

const targetRegex = /\/\/ Usamos a URL pública[\s\S]*?const appUrl = baseUrl \+ "\/\?qr=" \+ qrDataStr;/m;

code = code.replace(targetRegex, replacement);
fs.writeFileSync('index.html', code);
console.log("QR routing fixed.");
