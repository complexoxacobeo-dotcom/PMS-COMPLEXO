const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const targetStr = `<button id="btnPurgeIcal" onclick="purgeIcalBlocks()" class="bg-rose-100 hover:bg-rose-200 text-rose-800 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors shadow-sm border border-rose-200/50 flex items-center justify-center gap-1.5 shrink-0">
                    <span>🗑️</span> <span class="whitespace-nowrap">Limpar iCal</span>
                </button>`;
const replaceStr = `<button onclick="printPlanningA4()" class="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors shadow-sm border border-indigo-200/50 flex items-center justify-center gap-1.5 shrink-0">
                    <span>🖨️</span> <span class="whitespace-nowrap">Imprimir A4</span>
                </button>`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('index.html', code);
