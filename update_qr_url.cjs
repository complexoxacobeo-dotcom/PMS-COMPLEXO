const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Find the line where qrPayload is defined
const targetLine = /const qrPayload = encodeURIComponent\("XAC\|" \+ currentPlaningDate \+ "\|" \+ room.id \+ "\|" \+ tipo \+ "\|" \+ qty\);/;

// Replace it with an absolute URL linking directly to a handler in the app
// We use window.location.origin to point to the currently deployed app
// For safety, we also include a path that opens the QR scanner directly or processes it
const replacement = `const qrDataStr = btoa(encodeURIComponent("XAC|" + currentPlaningDate + "|" + room.id + "|" + tipo + "|" + qty));
            const appUrl = window.location.origin + window.location.pathname + "?qr=" + qrDataStr;
            const qrPayload = encodeURIComponent(appUrl);`;

code = code.replace(targetLine, replacement);

fs.writeFileSync('index.html', code);
console.log("QR payload updated to full URL.");
