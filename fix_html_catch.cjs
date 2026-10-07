const fs = require('fs');
let indexHtml = fs.readFileSync('index.html', 'utf8');

indexHtml = indexHtml.replace(/\.catch\(e=>console\.error\(e\)\)/g, '.catch(e=>{})');

fs.writeFileSync('index.html', indexHtml);
console.log("Fixed catch");
