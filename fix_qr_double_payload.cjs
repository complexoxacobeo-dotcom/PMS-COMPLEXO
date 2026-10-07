const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// There's an accidental duplicate line: const qrPayload = encodeURIComponent(appUrl);
code = code.replace(/const qrPayload = encodeURIComponent\(appUrl\);\s*const qrPayload = encodeURIComponent\(appUrl\);/, "const qrPayload = encodeURIComponent(appUrl);");

fs.writeFileSync('index.html', code);
