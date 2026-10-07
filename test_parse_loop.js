const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// find all local storage calls
let matches = html.match(/localStorage\.getItem\([^)]+\)/g);
console.log(matches);
