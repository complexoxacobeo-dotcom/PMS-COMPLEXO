const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const regex = /window\.printPlanningA4 = function\(\) \{[\s\S]*?printWindow\.document\.close\(\);\s*\};/g;

const newPrintFunction = `window.printPlanningA4 = function() {
            const currentDate = document.getElementById('planingDate').value;
            let dia = appState.dailyData[currentDate] || [];
            
            let htmlContent = '<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">';
            
            appState.baseRooms.forEach(base => {
                if (base.type === 'hostel') {
                    const beds = dia.filter(d => d.baseId === base.id);
                    let bedGroups = {};
                    beds.forEach(b => {
                        let num = b.bedId.replace(/[AB]/g, '');
                        if (!bedGroups[num]) bedGroups[num] = { top: null, bot: null };
                        if (b.bedId.includes('A')) bedGroups[num].top = b;
                        else bedGroups[num].bot = b;
                    });
                    
                    let bedsHtml = '';
                    const groupKeys = Object.keys(bedGroups).sort((a,b) => parseInt(a) - parseInt(b));
                    groupKeys.forEach(litNum => {
                        let topBed = bedGroups[litNum].top;
                        let botBed = bedGroups[litNum].bot;
                        if (!topBed && !botBed) return;
                        
                        const renderPrintBed = (bed, label) => {
                            if(!bed) return '';
                            let isFree = bed.status === 'free';
                            let isRes = bed.status === 'reserved';
                            let bgClass = isFree ? 'bg-emerald-50 border-emerald-300' : (isRes ? 'bg-amber-50 border-amber-400' : 'bg-red-50 border-red-400');
                            let textClass = isFree ? 'text-emerald-800' : (isRes ? 'text-amber-800' : 'text-red-800');
                            let statusText = isFree ? 'Libre' : (isRes ? 'Reserva' : 'Ocupado');
                            
                            return \`
                                <div class="border rounded-md p-1.5 \${bgClass} flex flex-col justify-between" style="min-height: 55px;">
                                    <div class="flex justify-between items-center mb-1">
                                        <span class="text-[9px] uppercase font-bold text-slate-500">\${label}</span>
                                        <span class="text-[9px] font-black \${textClass}">\${statusText}</span>
                                    </div>
                                    <div class="text-[11px] font-bold text-slate-800 leading-tight truncate">\${bed.clientName || ''}</div>
                                    <div class="text-[10px] font-black text-slate-700 text-right mt-1">\${bed.price > 0 ? bed.price+'€' : ''}</div>
                                </div>
                            \`;
                        };
                        
                        bedsHtml += \`
                            <div class="flex flex-col gap-1.5 p-1.5 bg-slate-100 rounded-lg border border-slate-300 shadow-inner">
                                <div class="text-[10px] font-black text-center text-slate-700 bg-slate-200 rounded px-1 uppercase tracking-wider">Lit. \${litNum}</div>
                                \${renderPrintBed(topBed, 'Alta')}
                                \${renderPrintBed(botBed, 'Baixa')}
                            </div>
                        \`;
                    });
                    
                    htmlContent += \`
                        <div class="col-span-2 sm:col-span-3 border-2 border-blue-200 bg-blue-50/30 rounded-xl overflow-hidden shadow-sm flex flex-col">
                            <div class="bg-blue-100 border-b border-blue-200 p-2 flex justify-between items-center">
                                <h3 class="font-black text-blue-900 text-sm flex items-center gap-1">🛏️ \${base.number} - \${base.roomName}</h3>
                                <span class="text-xs bg-white text-blue-800 px-2 py-0.5 rounded shadow-sm font-bold">ALBERGUE</span>
                            </div>
                            <div class="p-2 grid grid-cols-3 sm:grid-cols-4 gap-2 flex-grow">
                                \${bedsHtml}
                            </div>
                        </div>
                    \`;
                } else {
                    const room = dia.find(d => d.id === base.id);
                    if(!room) return;
                    
                    const isApt = room.type === 'apartment';
                    const icon = isApt ? '🏠' : '🚪';
                    
                    let isFree = room.status === 'free';
                    let isRes = room.status === 'reserved';
                    let isOcc = room.status === 'occupied';
                    
                    let bgStatus = isFree ? 'bg-emerald-500/10 border-emerald-400' : (isRes ? 'bg-amber-500/10 border-amber-400' : 'bg-red-500/10 border-red-400');
                    let badgeColor = isFree ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : (isRes ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-red-100 text-red-800 border-red-200');
                    let statusText = isFree ? 'Libre' : (isRes ? 'Reserva' : 'Ocupado');
                    let barColor = isFree ? 'bg-emerald-500' : (isRes ? 'bg-amber-500' : 'bg-red-500');
                    
                    htmlContent += \`
                        <div class="col-span-1 rounded-xl border-2 \${bgStatus} shadow-sm flex flex-col h-full bg-white relative overflow-hidden" style="min-height: 120px;">
                            <div class="absolute left-0 top-0 bottom-0 w-2 \${barColor}"></div>
                            <div class="pl-3 p-2 flex flex-col h-full z-10">
                                <div class="flex justify-between items-start mb-1">
                                    <span class="text-[10px] font-black text-slate-700 uppercase truncate">\${icon} \${room.roomName || 'Aloxamento'}</span>
                                    <span class="text-[9px] font-bold \${badgeColor} px-1.5 py-0.5 rounded border">\${statusText}</span>
                                </div>
                                <div class="text-2xl font-black text-slate-900 leading-none mb-1">\${room.number}</div>
                                
                                <div class="flex flex-wrap gap-1 mb-1">
                                    <span class="text-[9px] bg-slate-100 border border-slate-200 text-slate-800 px-1 rounded truncate max-w-[80%]">\${room.bedConfig}</span>
                                    <span class="text-[9px] bg-blue-50 border border-blue-200 text-blue-800 px-1 rounded">👤 \${room.guests || 1}</span>
                                </div>
                                
                                <div class="mt-auto pt-2">
                                    <div class="text-xs font-black text-slate-800 leading-tight truncate">\${room.clientName || ''}</div>
                                    \${room.agency ? \`<div class="text-[10px] font-bold text-blue-700 mt-0.5 truncate">🏢 \${room.agency}</div>\` : ''}
                                    <div class="flex justify-between items-end mt-1">
                                        <div class="text-[9px] text-slate-500 italic truncate w-[70%]">\${room.observations ? '📝 ' + room.observations : ''}</div>
                                        <div class="text-[11px] font-black \${isFree ? 'opacity-0' : 'text-slate-800'}">\${room.price || 0}€</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    \`;
                }
            });
            
            htmlContent += '</div>';

            const printWindow = window.open('', '_blank');
            printWindow.document.write(\`
                <!DOCTYPE html>
                <html lang="gl">
                <head>
                    <title>Planning A4 - \${currentDate}</title>
                    <script src="https://cdn.tailwindcss.com"><\\/script>
                    <style>
                        body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 10px; font-family: sans-serif; }
                        @page { size: A4 landscape; margin: 8mm; }
                        .print-header { text-align: center; margin-bottom: 15px; font-size: 22px; font-weight: 900; color: #1e293b; border-bottom: 3px solid #e2e8f0; padding-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
                        .col-span-1, .col-span-2, .col-span-3 { break-inside: avoid; }
                    </style>
                </head>
                <body>
                    <div class="print-header">PLANNING DIARIO - \${currentDate.split('-').reverse().join('/')}</div>
                    \${htmlContent}
                    <script>
                        window.onload = () => {
                            setTimeout(() => {
                                window.print();
                                window.close();
                            }, 1000);
                        };
                    <\\/script>
                </body>
                </html>
            \`);
            printWindow.document.close();
        };`;

code = code.replace(regex, newPrintFunction);
fs.writeFileSync('index.html', code);
