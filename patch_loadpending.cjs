const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const regex = /\/\/ Auto check Google token expiration[\s\S]*?try \{ await window\.doGoogleLogin\(\); \} catch\(e\) \{\}\s*\}\s*\}/m;
code = code.replace(regex, "// Auto-popup removed to prevent popup-blocked errors.");

fs.writeFileSync('index.html', code);
console.log("Auto-popup removed!");
