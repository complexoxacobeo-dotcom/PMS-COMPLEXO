const fs = require('fs');

const funcCode = `window.printPlanningA4 = function() {
    const currentDate = document.getElementById('planingDate').value;
    let dia = appState.dailyData[currentDate] || [];
    
    // Categorías e tons grises
    const getCategoryStyles = (base) => {
        const name = (base.roomName || '').toLowerCase();
        if (name.includes('orixinal')) return { bg: 'bg-stone-200/60', border: 'border-stone-400', text: 'text-stone-800', headerBg: 'bg-stone-300/50' };
        if (name.includes('nova')) return { bg: 'bg-slate-200/60', border: 'border-slate-400', text: 'text-slate-800', headerBg: 'bg-slate-300/50' };
        if (name.includes('apartamento') || name.includes('apt')) return { bg: 'bg-zinc-200/80', border: 'border-zinc-400', text: 'text-zinc-800', headerBg: 'bg-zinc-300/50' };
        if (base.type === 'hostel') return { bg: 'bg-neutral-200/60', border: 'border-neutral-400', text: 'text-neutral-800', headerBg: 'bg-neutral-300/50' };
        return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-800', headerBg: 'bg-gray-200/50' };
    };

    let htmlContent = '<div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-1.5">';
    
    appState.baseRooms.forEach(base => {
        const catStyle = getCategoryStyles(base);

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
                            \${bed.agency ? \`<div class="text-[7.5px] font-bold text-indigo-800 leading-tight break-words mb-0.5 uppercase">🏢 \${bed.agency}</div>\` : ''}
                            <div class="text-[9.5px] font-bold text-slate-800 leading-tight break-words">\${bed.clientName || ''}</div>
                            \${bed.price > 0 ? \`<div class="text-[8px] font-black text-slate-700 text-right mt-0.5">\${bed.price}€</div>\` : ''}
                        </div>
                    \`;
                };
                
                bedsHtml += \`
                    <div class="flex flex-col gap-1 p-1 bg-white/60 rounded border \${catStyle.border} shadow-inner break-inside-avoid">
                        <div class="text-[8px] font-black text-center \${catStyle.text} \${catStyle.headerBg} rounded px-1 uppercase">L\${litNum}</div>
                        \${renderPrintBed(topBed, 'Alta')}
                        \${renderPrintBed(botBed, 'Baixa')}
                    </div>
                \`;
            });
            
            htmlContent += \`
                <div class="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-3 xl:col-span-2 border \${catStyle.border} \${catStyle.bg} rounded-lg overflow-hidden shadow-sm flex flex-col break-inside-avoid">
                    <div class="\${catStyle.headerBg} border-b \${catStyle.border} px-1.5 py-1 flex justify-between items-center">
                        <h3 class="font-black \${catStyle.text} text-[11px] flex items-center gap-1">🛏️ \${base.number} <span class="text-[9px] opacity-75">(\${base.roomName})</span></h3>
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
            
            let badgeColor = isFree ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : (isRes ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-red-100 text-red-800 border-red-200');
            let statusText = isFree ? 'Libre' : (isRes ? 'Res' : 'Ocup');
            let barColor = isFree ? 'bg-emerald-500' : (isRes ? 'bg-amber-500' : 'bg-red-500');
            
            htmlContent += \`
                <div class="col-span-1 rounded-lg border \${catStyle.border} \${catStyle.bg} shadow-sm flex flex-col h-full relative overflow-hidden break-inside-avoid">
                    <div class="absolute left-0 top-0 bottom-0 w-1.5 \${barColor}"></div>
                    <div class="pl-2.5 p-1.5 flex flex-col h-full z-10 justify-between">
                        <div>
                            <div class="flex justify-between items-start mb-0.5">
                                <span class="text-[8px] font-black \${catStyle.text} uppercase truncate mr-1" title="\${base.roomName}">\${icon} \${base.roomName}</span>
                                <span class="text-[8px] font-bold \${badgeColor} px-1 rounded border">\${statusText}</span>
                            </div>
                            
                            \${room.agency ? \`<div class="text-[9px] font-bold text-indigo-800 mb-0.5 leading-tight break-words uppercase">🏢 \${room.agency}</div>\` : ''}
                            
                            <div class="text-lg font-black text-slate-900 leading-none mb-0.5">\${room.number}</div>
                            
                            <div class="text-[10px] font-black text-slate-800 leading-tight break-words mt-1">\${room.clientName || ''}</div>
                            
                            \${room.observations ? \`<div class="text-[8px] text-slate-600 italic break-words leading-tight mt-0.5">📝 \${room.observations}</div>\` : ''}
                        </div>
                        
                        <div class="flex justify-between items-end mt-1 pt-1 border-t \${catStyle.border}">
                            <span class="text-[8px] bg-white/60 border \${catStyle.border} \${catStyle.text} px-1 rounded truncate max-w-[60%]">\${room.bedConfig}</span>
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
console.log('Update done');
