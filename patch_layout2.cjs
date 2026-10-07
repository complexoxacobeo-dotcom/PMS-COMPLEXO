const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Replace the closing div after Alertas
const findStr = `                    <span id="badgeAlertasMaster" class="hidden absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black animate-pulse shadow-md border-2 border-white/50 ">0</span>
                </button>
                
                
                
                </div>
                
                <button onclick="document.getElementById('voiceModal').classList.add('active');" class="bg-purple-100 hover:bg-purple-200 text-purple-800 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors shadow-sm border border-purple-200/50 flex items-center justify-center gap-1.5">`;
                
const replaceStr = `                    <span id="badgeAlertasMaster" class="hidden absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black animate-pulse shadow-md border-2 border-white/50 ">0</span>
                </button>
                                
                <button onclick="document.getElementById('voiceModal').classList.add('active');" class="bg-purple-100 hover:bg-purple-200 text-purple-800 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors shadow-sm border border-purple-200/50 flex items-center justify-center gap-1.5">`;

code = code.replace(findStr, replaceStr);

// Move the closing div to after openAdmin button
const findStrEnd = `                <button onclick="openAdmin()" class="bg-slate-200 hover:bg-slate-300 text-slate-900 shadow-md px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors shadow-sm border border-slate-300/50 flex items-center justify-center gap-1.5">
                    <span>⚙️</span> <span>Admin</span>
                </button>
            </div>`;

const replaceStrEnd = `                <button onclick="openAdmin()" class="bg-slate-200 hover:bg-slate-300 text-slate-900 shadow-md px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors shadow-sm border border-slate-300/50 flex items-center justify-center gap-1.5">
                    <span>⚙️</span> <span>Admin</span>
                </button>
            </div>
            </div>`;

code = code.replace(findStrEnd, replaceStrEnd);

fs.writeFileSync('index.html', code);
console.log("Layout patched part 2!");
