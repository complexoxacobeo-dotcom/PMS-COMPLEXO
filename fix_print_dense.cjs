const fs = require('fs');

const funcCode = `window.printPlanningA4 = function() {
    const currentDate = document.getElementById('planingDate').value;
    let dia = appState.dailyData[currentDate] || [];
    
    // Unha soa cuadrícula compacta, sen as cabeceiras de grupos
    let htmlContent = '<div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-1.5">';
    
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
                    
                    return \`
                        <div class="border rounded-sm p-1 \${bgClass} flex flex-col justify-between">
                            <div class="flex justify-between items-center mb-0.5">
                                <span class="text-[8px] uppercase font-bold text-slate-500">\${label}</span>
                                <span class="text-[8px] font-black \${textClass}">\${isFree ? 'L' : (isRes ? 'R' : 'O')}</span>
                            </div>
                            <div class="text-[9.5px] font-bold text-slate-800 leading-tight break-words">\${bed.clientName || ''}</div>
                            \${bed.price > 0 ? \`<div class="text-[8px] font-black text-slate-700 text-right mt-0.5">\${bed.price}€</div>\` : ''}
                        </div>
                    \`;
                };
                
                bedsHtml += \`
                    <div class="flex flex-col gap-1 p-1 bg-slate-100 rounded border border-slate-300 shadow-inner break-inside-avoid">
                        <div class="text-[8px] font-black text-center text-slate-700 bg-slate-200 rounded px-1 uppercase">L\${litNum}</div>
                        \${renderPrintBed(topBed, 'Alta')}
                        \${renderPrintBed(botBed, 'Baixa')}
                    </div>
                \`;
            });
            
            htmlContent += \`
                <div class="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-3 xl:col-span-2 border border-blue-200 bg-blue-50/30 rounded-lg overflow-hidden shadow-sm flex flex-col break-inside-avoid">
                    <div class="bg-blue-100 border-b border-blue-200 px-1.5 py-1 flex justify-between items-center">
                        <h3 class="font-black text-blue-900 text-[11px] flex items-center gap-1">🛏️ \${base.number} <span class="text-[9px] text-blue-700">(\${base.roomName})</span></h3>
                    </div>
                    <div class="p-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 flex-grow">
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
            
            let bgStatus = isFree ? 'bg-emerald-500/10 border-emerald-400' : (isRes ? 'bg-amber-500/10 border-amber-400' : 'bg-red-500/10 border-red-400');
            let badgeColor = isFree ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : (isRes ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-red-100 text-red-800 border-red-200');
            let statusText = isFree ? 'Libre' : (isRes ? 'Res' : 'Ocup');
            let barColor = isFree ? 'bg-emerald-500' : (isRes ? 'bg-amber-500' : 'bg-red-500');
            
            htmlContent += \`
                <div class="col-span-1 rounded-lg border \${bgStatus} shadow-sm flex flex-col h-full bg-white relative overflow-hidden break-inside-avoid">
                    <div class="absolute left-0 top-0 bottom-0 w-1.5 \${barColor}"></div>
                    <div class="pl-2.5 p-1.5 flex flex-col h-full z-10 justify-between">
                        <div>
                            <div class="flex justify-between items-start mb-0.5">
                                <span class="text-[8px] font-black text-slate-700 uppercase truncate mr-1" title="\${base.roomName}">\${icon} \${base.roomName}</span>
                                <span class="text-[8px] font-bold \${badgeColor} px-1 rounded border">\${statusText}</span>
                            </div>
                            <div class="text-lg font-black text-slate-900 leading-none mb-0.5">\${room.number}</div>
                            
                            <div class="text-[10px] font-black text-slate-800 leading-tight break-words mt-1">\${room.clientName || ''}</div>
                            \${room.agency ? \`<div class="text-[9px] font-bold text-blue-700 mt-0.5 leading-tight break-words">🏢 \${room.agency}</div>\` : ''}
                            \${room.observations ? \`<div class="text-[8px] text-slate-500 italic break-words leading-tight mt-0.5">📝 \${room.observations}</div>\` : ''}
                        </div>
                        
                        <div class="flex justify-between items-end mt-1 pt-1 border-t border-slate-100/50">
                            <span class="text-[8px] bg-slate-100 border border-slate-200 text-slate-800 px-1 rounded truncate max-w-[60%]">\${room.bedConfig}</span>
                            <div class="text-[10.5px] font-black \${isFree ? 'opacity-0' : 'text-slate-800'}">\${room.price || 0}€</div>
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
                body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 6px; font-family: sans-serif; }
                @page { size: A4 landscape; margin: 6mm; }
                .print-header { text-align: center; margin-bottom: 8px; font-size: 16px; font-weight: 900; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
                .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
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

let html = fs.readFileSync('index.html', 'utf8');
const regex = /window\.printPlanningA4 = function\(\) \{[\s\S]*?printWindow\.document\.close\(\);\s*\};/;
html = html.replace(regex, funcCode);
fs.writeFileSync('index.html', html);
console.log('Done replacing print logic with compact dense grid');
