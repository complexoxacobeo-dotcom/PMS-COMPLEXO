const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Replace the shortcuts HTML string
const oldStr = `px-2 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl text-[10px] sm:text-xs md:text-sm font-bold transition-all shadow-sm border hover:shadow-md flex items-center justify-center gap-1 md:gap-1.5`;
const newStr = `px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm border hover:shadow-md flex items-center justify-center gap-1.5`;

code = code.replace(oldStr, newStr);

fs.writeFileSync('index.html', code);
console.log("Shortcuts patched!");
