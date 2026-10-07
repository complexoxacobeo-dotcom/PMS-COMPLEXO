const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const searchStr = `<div class="text-[10px] text-slate-800  font-bold">\${room.observations ? '📝 Nota' : ''}</div>`;
const replaceStr = `<div class="text-[10px] text-slate-800 font-bold truncate max-w-[120px]">\${room.observations ? '📝 ' + room.observations : ''}</div>`;

html = html.replace(searchStr, replaceStr);

fs.writeFileSync('index.html', html);
console.log("Patched observation UI");
