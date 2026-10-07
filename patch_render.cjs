const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const regex = /let isTriacastela = lowerBody\.includes\("triacastela"\)[\s\S]*?\}\)\.join\(''\);/m;

const replacement = `let isTriacastela = lowerBody.includes("triacastela") || lowerBody.includes("boutique") || lowerBody.includes("hotel");
                let isXacobeo = lowerBody.includes("xacobeo");
                
                if (isTriacastela) est = "🏨 Hotel Triacastela";
                else if (isXacobeo) est = "🏡 Complexo Xacobeo";
                else est = "Xeral";
                
                let isMessage = lowerBody.includes("mensaje de") || lowerBody.includes("message from") || lowerBody.includes("nova mensaxe") || lowerBody.includes("nueva mensaxe") || lowerBody.includes("new message");
                let isPreCheckin = lowerBody.includes("precheckin") || lowerBody.includes("pre-checkin") || lowerBody.includes("pre checkin") || lowerBody.includes("check-in online") || lowerBody.includes("registro de viajeros");
                
                let isAgency = lowerBody.includes("booking") || lowerBody.includes("expedia") || lowerBody.includes("agoda") || lowerBody.includes("airbnb") || lowerBody.includes("camino ways") || lowerBody.includes("caminoways") || lowerBody.includes("tee travel") || lowerBody.includes("teetravel") || lowerBody.includes("santiago ways") || lowerBody.includes("santiagoways") || lowerBody.includes("galiwonders") || lowerBody.includes("greenlife") || lowerBody.includes("follow the camino") || lowerBody.includes("followthecamino") || (email.sender || "").toLowerCase().includes("booking") || (email.sender || "").toLowerCase().includes("expedia") || (email.sender || "").toLowerCase().includes("agoda") || (email.sender || "").toLowerCase().includes("airbnb") || (email.sender || "").toLowerCase().includes("noreply") || (email.sender || "").toLowerCase().includes("no-reply");
                let isRuralgest = lowerBody.includes("ruralgest") || (email.sender || "").toLowerCase().includes("ruralgest");
                
                let isLastMinuteWords = lowerBody.includes("ultima hora") || lowerBody.includes("última hora") || lowerBody.includes("last minute") || lowerBody.includes("para hoy") || lowerBody.includes("para hoxe") || lowerBody.includes("esta noche") || lowerBody.includes("esta noite") || lowerBody.includes("for today") || lowerBody.includes("tonight") || lowerBody.includes("inmediata");
                
                // ONLY treat as last minute if it's not a pre-checkin, not a message, and it's a reservation.
                let isLastMinute = isLastMinuteWords && !isPreCheckin && !isMessage && (isAgency || lowerBody.includes("reserva") || lowerBody.includes("booking"));
                
                let d = new Date(email.date);
                let dStr = isNaN(d.getTime()) ? email.date : d.toLocaleString('gl-ES', {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'});
                
                let highlightClass = "border-slate-200 bg-white";
                let titleHighlight = "text-slate-800";
                let customStyle = "";
                let customTitleStyle = "";
                
                let estHighlight = "text-slate-700 bg-slate-100 border-slate-300";
                if (isTriacastela) {
                    estHighlight = "text-blue-800 bg-blue-100 border-blue-400 font-bold shadow-sm";
                } else if (isXacobeo) {
                    estHighlight = "text-emerald-800 bg-emerald-100 border-emerald-400 font-bold shadow-sm";
                }
                
                let agencyHtml = "";
                
                if (isRuralgest) {
                    highlightClass = "border-yellow-400 bg-yellow-50";
                    titleHighlight = "text-yellow-800";
                    agencyHtml = \`<span class="text-[10px] font-black px-2 py-0.5 rounded border uppercase bg-yellow-200 text-yellow-900 border-yellow-400" style="background-color: #fef08a; border-color: #facc15; color: #713f12;">🌻 RURALGEST</span>\`;
                    customStyle = "background-color: #fefce8; border-color: #facc15;"; 
                    customTitleStyle = "color: #854d0e;";
                } else if (isAgency) {
                    highlightClass = "border-red-500 bg-red-100 shadow-red-200/50";
                    titleHighlight = "text-red-900 font-black";
                    agencyHtml = \`<span class="text-[10px] font-black px-2 py-0.5 rounded border uppercase bg-red-600 text-white border-red-700 shadow-sm" style="background-color: #dc2626 !important; border-color: #b91c1c !important; color: #ffffff !important;">⚠️ AXENCIA</span>\`;
                    customStyle = "background-color: #fee2e2 !important; border: 2px solid #ef4444 !important; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);";
                    customTitleStyle = "color: #7f1d1d !important; font-weight: 900 !important; font-size: 13px !important;";
                }
                
                if (isLastMinute) {
                    highlightClass = "border-red-600 bg-red-100 shadow-red-500/50 animate-pulse";
                    titleHighlight = "text-red-900 font-black";
                    agencyHtml = \`<span class="text-[10px] font-black px-2 py-0.5 rounded border uppercase bg-red-800 text-white border-red-900 shadow-sm animate-bounce" style="background-color: #991b1b !important; border-color: #7f1d1d !important; color: #ffffff !important; font-size: 11px !important; padding: 4px 8px !important;">🚨 ÚLTIMA HORA</span> \` + agencyHtml;
                    customStyle = "background: linear-gradient(to right, #fee2e2, #fecaca) !important; border: 3px solid #dc2626 !important; box-shadow: 0 0 15px rgba(220, 38, 38, 0.6); transform: scale(1.01); margin-top: 8px; margin-bottom: 8px;";
                    customTitleStyle = "color: #7f1d1d !important; font-weight: 900 !important; font-size: 14px !important; text-transform: uppercase;";
                }
                
                return \`
                    <div class="\${highlightClass} rounded-lg border shadow-sm p-3 hover:shadow-md transition-shadow flex flex-col gap-2 cursor-pointer" style="\${customStyle}" onclick="prepareReply('\${email.id}')">
                        <div class="flex justify-between items-start">
                            <h3 class="font-bold \${titleHighlight} text-xs truncate flex-1" style="\${customTitleStyle}" title="\${email.subject}">\${email.subject || '(Sen asunto)'}</h3>
                            <span class="text-[10px] text-slate-400 whitespace-nowrap ml-2">\${dStr}</span>
                        </div>
                        <div class="text-[11px] text-slate-600 truncate">De: \${email.sender}</div>
                        <div class="flex justify-between items-center mt-1">
                            <div class="flex gap-2 items-center flex-wrap">
                                \${agencyHtml}
                                <span class="text-[10px] font-black px-2 py-0.5 rounded border uppercase \${estHighlight}">\${est}</span>
                            </div>
                            <span class="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 uppercase border border-blue-200/50">Responder ✨</span>
                        </div>
                    </div>
                \`;
            }).join('');`;

code = code.replace(regex, replacement);
fs.writeFileSync('index.html', code);
