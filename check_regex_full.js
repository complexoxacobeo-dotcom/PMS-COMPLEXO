const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regexMatch = html.match(/let descNameMatch = ([^;]+);/);
console.log("Regex line:", regexMatch[0]);

const nameFallback = html.match(/let extractedName = ([^;]+);/);
console.log("Fallback line:", nameFallback[0]);
