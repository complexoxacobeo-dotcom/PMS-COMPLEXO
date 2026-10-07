const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Compact globalCountersWrapper
code = code.replace(/text-\[10px\] sm:text-\[11px\] uppercase font-black tracking-widest text-slate-800 bg-white\/40 backdrop-blur-md border border-white\/60 shadow-md rounded-xl px-3 sm:px-4 py-2/g, 
'text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-slate-800 bg-white/40 backdrop-blur-md border border-white/60 shadow-md rounded-xl px-2 sm:px-3 py-1.5');

code = code.replace(/<span class="text-xl drop-shadow-sm">/g, '<span class="text-lg drop-shadow-sm">');
code = code.replace(/text-emerald-600 text-xs/g, 'text-emerald-600 text-[10px]');
code = code.replace(/text-red-600 text-xs/g, 'text-red-600 text-[10px]');

fs.writeFileSync('index.html', code);
console.log("Counters patched!");
