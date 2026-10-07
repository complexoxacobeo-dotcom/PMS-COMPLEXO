const fs = require('fs');

let indexCode = fs.readFileSync('index.html', 'utf8');

const oldBlock = `let highlightClass = "border-slate-200 bg-white";
                let titleHighlight = "text-slate-800";
                let estHighlight = "text-indigo-600 bg-indigo-50 border-indigo-100";
                let tagPrefix = "";
                
                if (isRuralgest) {
                    highlightClass = "border-yellow-400 bg-yellow-50";
                    titleHighlight = "text-yellow-800";
                    estHighlight = "text-yellow-900 bg-yellow-200 border-yellow-400";
                    tagPrefix = "🌻 RURALGEST / ";
                } else if (isAgency) {
                    highlightClass = "border-red-500 bg-red-100 shadow-red-200/50";
                    titleHighlight = "text-red-900 font-black";
                    estHighlight = "text-white bg-red-600 border-red-700 shadow-sm";
                    tagPrefix = "⚠️ AXENCIA / ";
                }
                
                return \`
                    <div class="\${highlightClass} rounded-lg border shadow-sm p-3 hover:shadow-md transition-shadow flex flex-col gap-2 cursor-pointer" onclick="prepareReply('\${email.id}')">
                        <div class="flex justify-between items-start">
                            <h3 class="font-bold \${titleHighlight} text-xs truncate flex-1" title="\${email.subject}">\${email.subject || '(Sen asunto)'}</h3>
                            <span class="text-[10px] text-slate-400 whitespace-nowrap ml-2">\${dStr}</span>
                        </div>
                        <div class="text-[11px] text-slate-600 truncate">De: \${email.sender}</div>
                        <div class="flex justify-between items-center mt-1">
                            <span class="text-[10px] font-black px-2 py-0.5 rounded border uppercase \${estHighlight}">\${tagPrefix}\${est}</span>
                            <span class="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 uppercase border border-blue-200/50">Responder ✨</span>
                        </div>
                    </div>
                \`;`;
                
const newBlock = `let highlightClass = "border-slate-200 bg-white";
                let titleHighlight = "text-slate-800";
                let estHighlight = "text-indigo-600 bg-indigo-50 border-indigo-100";
                let tagPrefix = "";
                let customStyle = "";
                let customTitleStyle = "";
                let customTagStyle = "";
                
                if (isRuralgest) {
                    highlightClass = "border-yellow-400 bg-yellow-50";
                    titleHighlight = "text-yellow-800";
                    estHighlight = "text-yellow-900 bg-yellow-200 border-yellow-400";
                    tagPrefix = "🌻 RURALGEST / ";
                    customStyle = "background-color: #fefce8; border-color: #facc15;"; 
                    customTitleStyle = "color: #854d0e;";
                    customTagStyle = "background-color: #fef08a; border-color: #facc15; color: #713f12;";
                } else if (isAgency) {
                    highlightClass = "border-red-500 bg-red-100 shadow-red-200/50";
                    titleHighlight = "text-red-900 font-black";
                    estHighlight = "text-white bg-red-600 border-red-700 shadow-sm";
                    tagPrefix = "⚠️ AXENCIA / ";
                    customStyle = "background-color: #fee2e2 !important; border: 2px solid #ef4444 !important; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);";
                    customTitleStyle = "color: #7f1d1d !important; font-weight: 900 !important; font-size: 13px !important;";
                    customTagStyle = "background-color: #dc2626 !important; border-color: #b91c1c !important; color: #ffffff !important;";
                }
                
                return \`
                    <div class="\${highlightClass} rounded-lg border shadow-sm p-3 hover:shadow-md transition-shadow flex flex-col gap-2 cursor-pointer" style="\${customStyle}" onclick="prepareReply('\${email.id}')">
                        <div class="flex justify-between items-start">
                            <h3 class="font-bold \${titleHighlight} text-xs truncate flex-1" style="\${customTitleStyle}" title="\${email.subject}">\${email.subject || '(Sen asunto)'}</h3>
                            <span class="text-[10px] text-slate-400 whitespace-nowrap ml-2">\${dStr}</span>
                        </div>
                        <div class="text-[11px] text-slate-600 truncate">De: \${email.sender}</div>
                        <div class="flex justify-between items-center mt-1">
                            <span class="text-[10px] font-black px-2 py-0.5 rounded border uppercase \${estHighlight}" style="\${customTagStyle}">\${tagPrefix}\${est}</span>
                            <span class="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 uppercase border border-blue-200/50">Responder ✨</span>
                        </div>
                    </div>
                \`;`;
                
if (indexCode.includes(`let highlightClass = "border-slate-200 bg-white";`)) {
    indexCode = indexCode.replace(oldBlock, newBlock);
    fs.writeFileSync('index.html', indexCode);
    console.log("Updated HTML colors inline");
}

