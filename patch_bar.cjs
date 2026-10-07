const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// 1. Remove the dropdown button completely
const dropdownRegex = /<div class="relative flex" id="emailsDropdownContainer">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
code = code.replace(dropdownRegex, '');

// 2. We want to insert the integrated window to the left side of the header.
// Looking at the header left section:
// <!-- CONTADORES GLOBAIS -->
// ... counters HTML ...
// </div>
// </div>
// </div>
// Let's find the closing of the counters wrapper.
const countersRegex = /(<div id="globalCountersWrapper"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/;
const match = code.match(countersRegex);

if (match) {
    const inlineWidget = `
                    <!-- Integrated Pending Emails -->
                    <div id="pendingEmailsWidget" class="hidden xl:flex flex-col w-[350px] h-[75px] ml-4 bg-white/80 backdrop-blur-md border border-blue-300 rounded-xl shadow-inner overflow-hidden">
                        <div class="bg-blue-600 text-white text-[10px] uppercase font-bold p-1.5 flex justify-between items-center shrink-0">
                            <span class="flex items-center gap-1">✉️ Correos de reservas (<span id="widgetPendingCount">0</span>)</span>
                            <button onclick="loadPendingEmails(true)" class="hover:text-blue-200 transition-colors">🔄</button>
                        </div>
                        <div id="widgetEmailsBody" class="flex-1 overflow-hidden flex flex-col relative">
                            <div id="pendingEmailsLoader" class="hidden absolute inset-0 bg-white/90 z-10 flex-col items-center justify-center">
                                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mb-1"></div>
                                <span class="text-[9px] text-slate-500 font-bold uppercase">Buscando...</span>
                            </div>
                            <div id="pendingEmailsError" class="hidden text-[9px] text-red-600 p-1"></div>
                            <div id="pendingEmailsList" class="overflow-y-auto flex-1 p-1 bg-slate-50/50 flex flex-col gap-1">
                                <!-- Emails -->
                            </div>
                        </div>
                    </div>`;
                    
    // Wait, the counters wrapper is inside:
    // <div class="flex items-center gap-2 mt-2"> ... 
    //   <!-- CONTADORES GLOBAIS -->
    //   <div id="globalCountersWrapper"> ... </div>
    // </div>
    // Let's insert it right after the globalCountersWrapper.
    
    code = code.replace(/(<div id="globalCountersWrapper"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/, '$1' + inlineWidget);
}

fs.writeFileSync('index.html', code);
console.log("Patched inline widget HTML!");
