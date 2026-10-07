const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /Texto a analizar:\\n\$\{text\.substring\(0, 15000\)\}/g;
const replaceWith = 'Texto a analizar (Ten en conta que hoxe é ${new Date().toISOString().split(\'T\')[0]}):\\n${text.substring(0, 15000)}';

code = code.replace(regex, replaceWith);

fs.writeFileSync('server.ts', code);
console.log("Patched prompt with current date");
