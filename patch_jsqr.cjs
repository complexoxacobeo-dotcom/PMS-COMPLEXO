const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');
code = code.replace(
    /<\/head>/,
    `    <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>\n</head>`
);
fs.writeFileSync('index.html', code);
console.log("jsQR added");
