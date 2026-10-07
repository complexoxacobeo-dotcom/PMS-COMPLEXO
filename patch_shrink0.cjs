const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// For generic buttons
code = code.replace(/flex items-center justify-center gap-1\.5"/g, 'flex items-center justify-center gap-1.5 shrink-0"');

// For dynamic shortcuts
code = code.replace(/flex items-center justify-center gap-1\.5">/g, 'flex items-center justify-center gap-1.5 shrink-0">');

fs.writeFileSync('index.html', code);
console.log("Shrink-0 patched!");
