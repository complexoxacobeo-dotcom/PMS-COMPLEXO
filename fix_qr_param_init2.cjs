const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const targetLine = "let isLoggedIn = false;";
const replacement = `const urlParams = new URLSearchParams(window.location.search);
        window.pendingQrToProcess = urlParams.get('qr');
        let isLoggedIn = false;`;

code = code.replace(targetLine, replacement);
fs.writeFileSync('index.html', code);
