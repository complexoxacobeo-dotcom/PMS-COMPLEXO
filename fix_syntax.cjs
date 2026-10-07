const fs = require('fs');
let code = fs.readFileSync('src/firebase-backend.js', 'utf8');

code = code.replace(/\\n/g, '\n');

fs.writeFileSync('src/firebase-backend.js', code);
