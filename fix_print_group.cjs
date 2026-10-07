const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const regex = /window\.printPlanningA4 = function\(\) \{[\s\S]*?printWindow\.document\.close\(\);\s*\};/g;

// Build the string safely
const newPrintFunction = 
"window.printPlanningA4 = function() {\n" +
"    const currentDate = document.getElementById('planingDate').value;\n" +
"    let dia = appState.dailyData[currentDate] || [];\n" +
"    \n" +
"    let htmlContent = '';\n" +
"    let groups = {};\n" +
"    appState.baseRooms.forEach(base => {\n" +
"        let cat = base.roomName || 'Aloxamento';\n" +
"        if (!groups[cat]) groups[cat] = { color: base.zoneColor || '#e2e8f0', items: [] };\n" +
"        groups[cat].items.push(base);\n" +
"    });\n" +
"    \n" +
"    Object.keys(groups).sort().forEach(cat => {\n" +
"        const group = groups[cat];\n" +
"        htmlContent += `\n" +
"            <div class=\"mb-6 print-group\">\n" +
"                <h2 class=\"text-lg font-black text-slate-800 uppercase border-b-2 border-slate-300 mb-2 pb-1 flex items-center gap-2\">\n" +
"                    <div class=\"w-4 h-4 rounded-full border border-slate-400 shadow-sm\" style=\"background-color: ${group.color}\"></div>\n" +
"                    ${cat}\n" +
"                </h2>\n" +
"                <div class=\"grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3\">\n" +
"        `;\n" +
"        \n" +
"        group.items.forEach(base => {\n" +
"            if (base.type === 'hostel') {\n" +
"                const beds = dia.filter(d => d.baseId === base.id);\n" +
"                let bedGroups = {};\n" +
"                beds.forEach(b => {\n" +
"                    let num = b.bedId.replace(/[AB]/g, '');\n" +
"                    if (!bedGroups[num]) bedGroups[num] = { top: null, bot: null };\n" +
"                    if (b.bedId.includes('A')) bedGroups[num].top = b;\n" +
"                    else bedGroups[num].bot = b;\n" +
"                });\n" +
"                \n" +
"                let bedsHtml = '';\n" +
"                const groupKeys = Object.keys(bedGroups).sort((a,b) => parseInt(a) - parseInt(b));\n" +
"                groupKeys.forEach(litNum => {\n" +
"                    let topBed = bedGroups[litNum].top;\n" +
"                    let botBed = bedGroups[litNum].bot;\n" +
"                    if (!topBed && !botBed) return;\n" +
"                    \n" +
"                    const renderPrintBed = (bed, label) => {\n" +
"                        if(!bed) return '';\n" +
"                        let isFree = bed.status === 'free';\n" +
"                        let isRes = bed.status === 'reserved';\n" +
"                        let bgClass = isFree ? 'bg-emerald-50 border-emerald-300' : (isRes ? 'bg-amber-50 border-amber-400' : 'bg-red-50 border-red-400');\n" +
"                        let textClass = isFree ? 'text-emerald-800' : (isRes ? 'text-amber-800' : 'text-red-800');\n" +
"                        let statusText = isFree ? 'Libre' : (isRes ? 'Reserva' : 'Ocupado');\n" +
"                        \n" +
"                        return `\n" +
"                            <div class=\"border rounded-md p-1.5 ${bgClass} flex flex-col justify-between\" style=\"min-height: 55px;\">\n" +
"                                <div class=\"flex justify-between items-center mb-1\">\n" +
"                                    <span class=\"text-[9px] uppercase font-bold text-slate-500\">${label}</span>\n" +
"                                    <span class=\"text-[9px] font-black ${textClass}\">${statusText}</span>\n" +
"                                </div>\n" +
"                                <div class=\"text-[11px] font-bold text-slate-800 leading-tight truncate\">${bed.clientName || ''}</div>\n" +
"                                <div class=\"text-[10px] font-black text-slate-700 text-right mt-1\">${bed.price > 0 ? bed.price+'€' : ''}</div>\n" +
"                            </div>\n" +
"                        `;\n" +
"                    };\n" +
"                    \n" +
"                    bedsHtml += `\n" +
"                        <div class=\"flex flex-col gap-1.5 p-1.5 bg-slate-100 rounded-lg border border-slate-300 shadow-inner break-inside-avoid\">\n" +
"                            <div class=\"text-[10px] font-black text-center text-slate-700 bg-slate-200 rounded px-1 uppercase tracking-wider\">Lit. ${litNum}</div>\n" +
"                            ${renderPrintBed(topBed, 'Alta')}\n" +
"                            ${renderPrintBed(botBed, 'Baixa')}\n" +
"                        </div>\n" +
"                    `;\n" +
"                });\n" +
"                \n" +
"                htmlContent += `\n" +
"                    <div class=\"col-span-2 sm:col-span-3 border-2 border-blue-200 bg-blue-50/30 rounded-xl overflow-hidden shadow-sm flex flex-col break-inside-avoid\">\n" +
"                        <div class=\"bg-blue-100 border-b border-blue-200 p-2 flex justify-between items-center\">\n" +
"                            <h3 class=\"font-black text-blue-900 text-sm flex items-center gap-1\">🛏️ ${base.number} - ${base.roomName}</h3>\n" +
"                            <span class=\"text-xs bg-white text-blue-800 px-2 py-0.5 rounded shadow-sm font-bold\">ALBERGUE</span>\n" +
"                        </div>\n" +
"                        <div class=\"p-2 grid grid-cols-3 sm:grid-cols-4 gap-2 flex-grow\">\n" +
"                            ${bedsHtml}\n" +
"                        </div>\n" +
"                    </div>\n" +
"                `;\n" +
"            } else {\n" +
"                const room = dia.find(d => d.id === base.id);\n" +
"                if(!room) return;\n" +
"                \n" +
"                const isApt = room.type === 'apartment';\n" +
"                const icon = isApt ? '🏠' : '🚪';\n" +
"                \n" +
"                let isFree = room.status === 'free';\n" +
"                let isRes = room.status === 'reserved';\n" +
"                let isOcc = room.status === 'occupied';\n" +
"                \n" +
"                let bgStatus = isFree ? 'bg-emerald-500/10 border-emerald-400' : (isRes ? 'bg-amber-500/10 border-amber-400' : 'bg-red-500/10 border-red-400');\n" +
"                let badgeColor = isFree ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : (isRes ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-red-100 text-red-800 border-red-200');\n" +
"                let statusText = isFree ? 'Libre' : (isRes ? 'Reserva' : 'Ocupado');\n" +
"                let barColor = isFree ? 'bg-emerald-500' : (isRes ? 'bg-amber-500' : 'bg-red-500');\n" +
"                \n" +
"                htmlContent += `\n" +
"                    <div class=\"col-span-1 rounded-xl border-2 ${bgStatus} shadow-sm flex flex-col h-full bg-white relative overflow-hidden break-inside-avoid\" style=\"min-height: 120px;\">\n" +
"                        <div class=\"absolute left-0 top-0 bottom-0 w-2 ${barColor}\"></div>\n" +
"                        <div class=\"pl-3 p-2 flex flex-col h-full z-10\">\n" +
"                            <div class=\"flex justify-between items-start mb-1\">\n" +
"                                <span class=\"text-[10px] font-black text-slate-700 uppercase truncate\">${icon} ${room.roomName || 'Aloxamento'}</span>\n" +
"                                <span class=\"text-[9px] font-bold ${badgeColor} px-1.5 py-0.5 rounded border\">${statusText}</span>\n" +
"                            </div>\n" +
"                            <div class=\"text-2xl font-black text-slate-900 leading-none mb-1\">${room.number}</div>\n" +
"                            \n" +
"                            <div class=\"flex flex-wrap gap-1 mb-1\">\n" +
"                                <span class=\"text-[9px] bg-slate-100 border border-slate-200 text-slate-800 px-1 rounded truncate max-w-[80%]\">${room.bedConfig}</span>\n" +
"                                <span class=\"text-[9px] bg-blue-50 border border-blue-200 text-blue-800 px-1 rounded\">👤 ${room.guests || 1}</span>\n" +
"                            </div>\n" +
"                            \n" +
"                            <div class=\"mt-auto pt-2\">\n" +
"                                <div class=\"text-xs font-black text-slate-800 leading-tight truncate\">${room.clientName || ''}</div>\n" +
"                                ${room.agency ? `<div class=\"text-[10px] font-bold text-blue-700 mt-0.5 truncate\">🏢 ${room.agency}</div>` : ''}\n" +
"                                <div class=\"flex justify-between items-end mt-1\">\n" +
"                                    <div class=\"text-[9px] text-slate-500 italic truncate w-[70%]\">${room.observations ? '📝 ' + room.observations : ''}</div>\n" +
"                                    <div class=\"text-[11px] font-black ${isFree ? 'opacity-0' : 'text-slate-800'}\">${room.price || 0}€</div>\n" +
"                                </div>\n" +
"                            </div>\n" +
"                        </div>\n" +
"                    </div>\n" +
"                `;\n" +
"            }\n" +
"        });\n" +
"        \n" +
"        htmlContent += `\n" +
"                </div>\n" +
"            </div>\n" +
"        `;\n" +
"    });\n" +
"\n" +
"    const printWindow = window.open('', '_blank');\n" +
"    printWindow.document.write(`\n" +
"        <!DOCTYPE html>\n" +
"        <html lang=\"gl\">\n" +
"        <head>\n" +
"            <title>Planning A4 - ${currentDate}</title>\n" +
"            <script src=\"https://cdn.tailwindcss.com\"><\\/script>\n" +
"            <style>\n" +
"                body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 10px; font-family: sans-serif; }\n" +
"                @page { size: A4 landscape; margin: 8mm; }\n" +
"                .print-header { text-align: center; margin-bottom: 15px; font-size: 22px; font-weight: 900; color: #1e293b; border-bottom: 3px solid #e2e8f0; padding-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }\n" +
"                .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }\n" +
"                .print-group { page-break-inside: auto; }\n" +
"            </style>\n" +
"        </head>\n" +
"        <body>\n" +
"            <div class=\"print-header\">PLANNING DIARIO - ${currentDate.split('-').reverse().join('/')}</div>\n" +
"            ${htmlContent}\n" +
"            <script>\n" +
"                window.onload = () => {\n" +
"                    setTimeout(() => {\n" +
"                        window.print();\n" +
"                        window.close();\n" +
"                    }, 1000);\n" +
"                };\n" +
"            <\\/script>\n" +
"        </body>\n" +
"        </html>\n" +
"    `);\n" +
"    printWindow.document.close();\n" +
"};\n";

code = code.replace(regex, newPrintFunction);
fs.writeFileSync('index.html', code);
