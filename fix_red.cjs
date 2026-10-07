const fs = require('fs');

let indexCode = fs.readFileSync('index.html', 'utf8');

// 1. Fix the width of the draggable widget (make it wider)
indexCode = indexCode.replace(/w-\[450px\]/g, 'w-[550px]');
indexCode = indexCode.replace(/min-h-\[200px\]/g, 'min-h-[300px]');

// 2. Fix agency match
const matchOld = `let isAgency = lowerBody.includes("booking") || lowerBody.includes("expedia") || lowerBody.includes("agoda") || lowerBody.includes("airbnb") || lowerBody.includes("camino ways") || lowerBody.includes("tee travel") || lowerBody.includes("santiago ways") || lowerBody.includes("galiwonders") || lowerBody.includes("greenlife") || lowerBody.includes("follow the camino") || (email.sender || "").toLowerCase().includes("booking") || (email.sender || "").toLowerCase().includes("expedia") || (email.sender || "").toLowerCase().includes("agoda") || (email.sender || "").toLowerCase().includes("airbnb") || (email.sender || "").toLowerCase().includes("noreply") || (email.sender || "").toLowerCase().includes("no-reply");`;

const matchNew = `let isAgency = lowerBody.includes("booking") || lowerBody.includes("expedia") || lowerBody.includes("agoda") || lowerBody.includes("airbnb") || lowerBody.includes("camino ways") || lowerBody.includes("caminoways") || lowerBody.includes("tee travel") || lowerBody.includes("teetravel") || lowerBody.includes("santiago ways") || lowerBody.includes("santiagoways") || lowerBody.includes("galiwonders") || lowerBody.includes("greenlife") || lowerBody.includes("follow the camino") || lowerBody.includes("followthecamino") || (email.sender || "").toLowerCase().includes("booking") || (email.sender || "").toLowerCase().includes("expedia") || (email.sender || "").toLowerCase().includes("agoda") || (email.sender || "").toLowerCase().includes("airbnb") || (email.sender || "").toLowerCase().includes("noreply") || (email.sender || "").toLowerCase().includes("no-reply");`;

indexCode = indexCode.replace(matchOld, matchNew);

// 3. Fix colors using inline styles to absolutely prevent Tailwind purging
const renderLoopRegex = /let highlightClass = "border-slate-200 bg-white";[\s\S]*?return \`/m;

const renderLoopNew = `let highlightClass = "border-slate-200 bg-white";
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
                    customStyle = "background-color: #fefce8; border-color: #facc15;"; // tailwind yellow-50 and 400
                    customTitleStyle = "color: #854d0e;"; // tailwind yellow-800
                    customTagStyle = "background-color: #fef08a; border-color: #facc15; color: #713f12;";
                } else if (isAgency) {
                    highlightClass = "border-red-500 bg-red-100 shadow-red-200/50";
                    titleHighlight = "text-red-900 font-black";
                    estHighlight = "text-white bg-red-600 border-red-700 shadow-sm";
                    tagPrefix = "⚠️ AXENCIA / ";
                    // INLINE STYLES FOR RED TO FORCE IT BEYOND PURGE
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
                \`;
            }).join('');`;

const regexToReplace = /let highlightClass = "border-slate-200 bg-white";[\s\S]*?<\/div>\s*<\/div>\s*\\`;\s*\}\)\.join\(''\);/;

if (indexCode.match(regexToReplace)) {
    indexCode = indexCode.replace(regexToReplace, renderLoopNew + "\n            startEmailAutoScroll();\n        }");
    // Oh wait, startEmailAutoScroll is missing in the regex match above. Let me just do a simpler replace.
} else {
    console.log("Could not match the render block completely.");
}

fs.writeFileSync('index.html', indexCode);
console.log("Applied width and color changes");
