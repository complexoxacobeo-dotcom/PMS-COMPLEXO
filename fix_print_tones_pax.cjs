const fs = require('fs');

const funcCode = `window.printPlanningA4 = function() {
    const currentDate = document.getElementById('planingDate').value;
    let dia = appState.dailyData[currentDate] || [];
    
    // Categorías e tons grises - MAXIMIZAMOS O CONTRASTE para que se vexa mellor a diferenza en branco e negro
    const getCategoryStyles = (base) => {
        const name = (base.roomName || '').toLowerCase();
        if (name.includes('orixinal')) return { bg: 'bg-stone-300/80', border: 'border-stone-500', text: 'text-stone-900', headerBg: 'bg-stone-400/60' };
        if (name.includes('nova')) return { bg: 'bg-slate-300/80', border: 'border-slate-500', text: 'text-slate-900', headerBg: 'bg-slate-400/60' };
        if (name.includes('apartamento') || name.includes('apt')) return { bg: 'bg-zinc-300/80', border: 'border-zinc-500', text: 'text-zinc-900', headerBg: 'bg-zinc-400/60' };
        if (base.type === 'hostel') return { bg: 'bg-neutral-300/80', border: 'border-neutral-500', text: 'text-neutral-900', headerBg: 'bg-neutral-400/60' };
        return { bg: 'bg-gray-200/80', border: 'border-gray-400', text: 'text-gray-900', headerBg: 'bg-gray-300/60' };
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
                    let bgClass = isFree ? 'bg-white' : (isRes ? 'bg-white' : 'bg-white');
                    let borderClass = isFree ? 'border-emerald-500' : (isRes ? 'border-amber-500' : 'border-red-500');
                    let textClass = isFree ? 'text-emerald-800' : (isRes ? 'text-amber-800' : 'text-red-800');
                    let statusLabel = isFree ? 'L' : (isRes ? 'R' : 'O');
                    let bgStatus = isFree ? 'bg-emerald-100' : (isRes ? 'bg-amber-100' : 'bg-red-100');
                    
                    const s = bed.services || {};
                    const bk = (s.breakfast?.qty || 0) + (s.halfBoard?.qty || 0) + (s.fullBoard?.qty || 0);
                    let iconsStr = '';
                    if (bk > 0) iconsStr += '☕';
                    if (s.dinner?.qty > 0 || s.halfBoard?.qty > 0 || s.fullBoard?.qty > 0) iconsStr += '🍽️';

                    return \`
                        <div class="border \${borderClass} rounded-sm p-1 \${bgClass} flex flex-col justify-between" style="border-width: 2px;">
                            <div class="flex justify-between items-center mb-0.5">
                                <span class="text-[8px] uppercase font-bold text-slate-500">\${label}</span>
                                <span class="text-[8px] font-black \${textClass} \${bgStatus} px-1 rounded">\${statusLabel}</span>
                            </div>
                            \${bed.agency ? \`<div class="text-[7.5px] font-bold text-white bg-indigo-700 px-1 py-0.5 rounded leading-tight break-words mb-0.5 uppercase block w-full text-center tracking-wider">🏢 \${bed.agency}</div>\` : ''}
                            <div class="text-[10px] font-black text-slate-900 leading-tight break-words" style="letter-spacing:-0.2px;">\${bed.clientName || ''}</div>
                            <div class="flex justify-between items-center mt-0.5">
                                <div class="text-[8px] font-black opacity-80">\${iconsStr}</div>
                                \${bed.price > 0 ? \`<div class="text-[8px] font-black text-slate-700 text-right">\${bed.price}€</div>\` : '<div></div>'}
                            </div>
                        </div>
                    \`;
                };
                
                bedsHtml += \`
                    <div class="flex flex-col gap-1 p-1 bg-white/70 rounded border-2 \${catStyle.border} shadow-inner break-inside-avoid">
                        <div class="text-[9px] font-black text-center \${catStyle.text} \${catStyle.headerBg} rounded px-1 uppercase tracking-widest border border-black/10">L\${litNum}</div>
                        \${renderPrintBed(topBed, 'Alta')}
                        \${renderPrintBed(botBed, 'Baixa')}
                    </div>
                \`;
            });
            
            htmlContent += \`
                <div class="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-3 xl:col-span-2 border-2 \${catStyle.border} \${catStyle.bg} rounded-lg overflow-hidden shadow-sm flex flex-col break-inside-avoid">
                    <div class="\${catStyle.headerBg} border-b-2 \${catStyle.border} px-2 py-1.5 flex justify-between items-center shadow-sm">
                        <h3 class="font-black \${catStyle.text} text-[13px] flex items-center gap-1 uppercase tracking-wide">🛏️ \${base.number} <span class="text-[10px] opacity-80 font-bold ml-1">(\${base.roomName})</span></h3>
                    </div>
                    <div class="p-1.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 flex-grow">
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
            
            let badgeColor = isFree ? 'bg-emerald-100 text-emerald-800 border-emerald-400' : (isRes ? 'bg-amber-100 text-amber-900 border-amber-400' : 'bg-red-100 text-red-900 border-red-400');
            let statusText = isFree ? 'Libre' : (isRes ? 'Res' : 'Ocup');
            let barColor = isFree ? 'bg-emerald-500' : (isRes ? 'bg-amber-500' : 'bg-red-500');
            
            const s = room.services || {};
            const bk = (s.breakfast?.qty || 0) + (s.halfBoard?.qty || 0) + (s.fullBoard?.qty || 0);
            let iconsStr = '';
            if (bk > 0) iconsStr += '☕';
            if (s.dinner?.qty > 0 || s.halfBoard?.qty > 0 || s.fullBoard?.qty > 0) iconsStr += '🍽️';
            
            htmlContent += \`
                <div class="col-span-1 rounded-lg border-2 \${catStyle.border} \${catStyle.bg} shadow-md flex flex-col h-full relative overflow-hidden break-inside-avoid">
                    <div class="absolute left-0 top-0 bottom-0 w-2 \${barColor} shadow-inner"></div>
                    <div class="pl-3 p-1.5 flex flex-col h-full z-10 justify-between">
                        <div>
                            <div class="flex justify-between items-start mb-0.5">
                                <span class="text-[8.5px] font-black \${catStyle.text} uppercase truncate mr-1 opacity-90" title="\${base.roomName}">\${icon} \${base.roomName}</span>
                                <span class="text-[8px] font-black \${badgeColor} px-1.5 rounded border shadow-sm">\${statusText}</span>
                            </div>
                            
                            \${room.agency ? \`<div class="text-[8.5px] font-black text-white bg-indigo-700 px-1 py-0.5 rounded leading-tight break-words mb-1 mt-0.5 uppercase w-full shadow-sm text-center tracking-wider">🏢 \${room.agency}</div>\` : ''}
                            
                            <div class="flex items-end gap-1 mb-0.5">
                                <div class="text-xl font-black text-slate-900 leading-none" style="letter-spacing:-0.5px;">\${room.number}</div>
                                \${room.guests ? \`<div class="text-[10px] font-bold bg-blue-100 text-blue-900 px-1 rounded-sm border border-blue-300 leading-none pb-0.5">👤\${room.guests}</div>\` : ''}
                            </div>
                            
                            <div class="text-[11px] font-black text-black leading-tight break-words mt-1 mb-1" style="letter-spacing:-0.2px;">\${room.clientName || ''}</div>
                            
                            \${room.observations ? \`<div class="text-[8.5px] text-slate-700 font-bold italic break-words leading-tight bg-white/50 p-1 rounded border border-black/10 mt-1 mb-1">📝 \${room.observations}</div>\` : ''}
                        </div>
                        
                        <div class="flex justify-between items-end mt-1 pt-1 border-t \${catStyle.border}">
                            <div class="flex gap-1 items-center">
                                <span class="text-[8px] bg-white border \${catStyle.border} \${catStyle.text} px-1 font-bold rounded truncate max-w-[60%]">\${room.bedConfig}</span>
                                <span class="text-[10px] font-black">\${iconsStr}</span>
                            </div>
                            <div class="text-[11px] font-black \${isFree ? 'opacity-0' : 'text-slate-900'}">\${room.price || 0}€</div>
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
