const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(/const qrDataStr = btoa\(encodeURIComponent\("XAC\|" \+ currentPlaningDate \+ "\|" \+ room\.id \+ "\|" \+ tipo \+ "\|" \+ qty\)\);\s*const qrDataStr = btoa\(encodeURIComponent\("XAC\|" \+ currentPlaningDate \+ "\|" \+ room\.id \+ "\|" \+ tipo \+ "\|" \+ qty\)\);/, 'const qrDataStr = btoa(encodeURIComponent("XAC|" + currentPlaningDate + "|" + room.id + "|" + tipo + "|" + qty));');

fs.writeFileSync('index.html', code);
