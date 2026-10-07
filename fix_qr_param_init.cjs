const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Find the very beginning of the script tag
const scriptStart = /<script>\s+let isLoggedIn = false;/;
const scriptReplacement = `<script>
        const urlParams = new URLSearchParams(window.location.search);
        window.pendingQrToProcess = urlParams.get('qr');
        let isLoggedIn = false;`;

code = code.replace(scriptStart, scriptReplacement);
fs.writeFileSync('index.html', code);
console.log("QR param init fixed");
