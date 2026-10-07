const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');
code = code.replace(
    /<button onclick="openAdmin\(\)" class="bg-slate-200 hover:bg-slate-300 text-slate-900 shadow-md px-2\.5 py-1\.5 rounded-lg text-\[11px\] font-bold transition-colors shadow-sm border border-slate-300\/50 flex items-center justify-center gap-1\.5 shrink-0">/,
    `<button onclick="openQrScanner()" class="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 shadow-md px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors shadow-sm border border-indigo-200 flex items-center justify-center gap-1.5 shrink-0">
                    <span>📷</span> <span class="whitespace-nowrap">Restaurante QR</span>
                </button>
                <button onclick="openAdmin()" class="bg-slate-200 hover:bg-slate-300 text-slate-900 shadow-md px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors shadow-sm border border-slate-300/50 flex items-center justify-center gap-1.5 shrink-0">`
);
fs.writeFileSync('index.html', code);
console.log("Scanner button added");
