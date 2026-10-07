const fs = require('fs');
let indexCode = fs.readFileSync('index.html', 'utf8');

const regex = /let highlightClass = "border-slate-200 bg-white";[\s\S]*?return \`/m;
const match = indexCode.match(regex);
console.log(match ? match[0] : "Not found!");
