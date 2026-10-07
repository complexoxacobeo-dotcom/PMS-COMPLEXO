const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const findStr = `<span>\${s.name}</span>`;
const replaceStr = `<span class="whitespace-nowrap">\${s.name}</span>`;

code = code.replace(findStr, replaceStr);

fs.writeFileSync('index.html', code);
console.log("Shortcuts nowrap patched!");
