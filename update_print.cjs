const fs = require('fs');

let funcCode = fs.readFileSync('print_func.txt', 'utf8');

// 1. Bed clientName
funcCode = funcCode.replace(
    /class="text-\[11px\] font-bold text-slate-800 leading-tight truncate">/g,
    'class="text-[11px] font-bold text-slate-800 leading-tight break-words">'
);

// 2. Room clientName
funcCode = funcCode.replace(
    /class="text-xs font-black text-slate-800 leading-tight truncate">/g,
    'class="text-[12px] font-black text-slate-800 leading-tight break-words">'
);

// 3. Room Agency
funcCode = funcCode.replace(
    /class="text-\[10px\] font-bold text-blue-700 mt-0\.5 truncate">/g,
    'class="text-[10px] font-bold text-blue-700 mt-0.5 leading-tight break-words">'
);

// 4. Room Observations
funcCode = funcCode.replace(
    /class="text-\[9px\] text-slate-500 italic truncate w-\[70%\]">/g,
    'class="text-[9px] text-slate-500 italic break-words leading-tight max-w-[75%]">'
);

fs.writeFileSync('print_func_updated.txt', funcCode);

let html = fs.readFileSync('index.html', 'utf8');
const regex = /window\.printPlanningA4 = function\(\) \{[\s\S]*?printWindow\.document\.close\(\);\s*\};/;
html = html.replace(regex, funcCode);
fs.writeFileSync('index.html', html);
console.log('Update applied');
