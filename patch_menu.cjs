const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const mailBtn = `                <button onclick="openPendingEmailsModal()" class="relative bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm border border-orange-200 flex items-center justify-center gap-2">
                    <span>✉️</span> <span>Correos de reservas</span>
                    <span id="badgePendingEmails" class="hidden absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black shadow-md border-2 border-white/50 ">0</span>
                </button>
`;

code = code.replace(/<button id="btnPurgeIcal"/, mailBtn + '                <button id="btnPurgeIcal"');
fs.writeFileSync('index.html', code);
console.log("Patched menu");
