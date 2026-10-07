const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const targetLine = /const appUrl = window\.location\.origin \+ window\.location\.pathname \+ "\?qr=" \+ qrDataStr;/;
const replacement = `// Usamos a URL pública da aplicación compartida para que calquera móbil poida abrilo sen pedir conta de Google
            const baseUrl = "https://ais-pre-fwidh24maf6wvk3ukzx6a4-169047008199.europe-west1.run.app";
            const appUrl = baseUrl + "/?qr=" + qrDataStr;`;

if(code.match(targetLine)) {
    code = code.replace(targetLine, replacement);
    fs.writeFileSync('index.html', code);
    console.log("QR public URL fixed.");
} else {
    console.log("Could not find the target line. Let's search for it.");
}
