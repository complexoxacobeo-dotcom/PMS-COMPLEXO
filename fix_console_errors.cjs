const fs = require('fs');
let indexHtml = fs.readFileSync('index.html', 'utf8');
let backendJs = fs.readFileSync('src/firebase-backend.js', 'utf8');

indexHtml = indexHtml.replace(/catch \(err\) \{\s*console\.error\(err\);\s*let msg = err\.message \|\| err;/g, `catch (err) {\n                let msg = err.message || err;`);

backendJs = backendJs.replace(/console\.error\("Error fetching pending emails", e\);/g, '');
backendJs = backendJs.replace(/console\.error\("Error fetching emails", e\);/g, '');

fs.writeFileSync('index.html', indexHtml);
fs.writeFileSync('src/firebase-backend.js', backendJs);
console.log("Removed console errors");
