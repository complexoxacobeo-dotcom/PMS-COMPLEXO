const fs = require('fs');

const funcCode = `window.printPlanningA4 = function() {
    const currentDate = document.getElementById('planingDate').value;
    let dia = appState.dailyData[currentDate] || [];
    
    const getCategoryStyles = (base) => {
        const name = (base.roomName || '').toLowerCase();
        if (name.includes('orixinal')) return { bg: 'bg-stone-200/90', border: 'border-stone-500', text: 'text-stone-900', headerBg: 'bg-stone-300' };
        if (name.includes('nova')) return { bg: 'bg-slate-200/90', border: 'border-slate-500', text: 'text-slate-900', headerBg: 'bg-slate-300' };
        if (name.includes('apartamento') || name.includes('apt')) return { bg: 'bg-zinc-200/90', border: 'border-zinc-500', text: 'text-zinc-900', headerBg: 'bg-zinc-300' };
        if (base.type === 'hostel') return { bg: 'bg-neutral-200/90', border: 'border-neutral-500', text: 'text-neutral-900', headerBg: 'bg-neutral-300' };
        return { bg: 'bg-gray-200/90', border: 'border-gray-500', text: 'text-gray-900', headerBg: 'bg-gray-300' };
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
                    let bgClass = isFree ? 'bg-emerald-50 border-emerald-400' : (isRes ? 'bg-amber-50 border-amber-500' : 'bg-red-50 border-red-500');
                    let textClass = isFree ? 'text-emerald-800' : (isRes ? 'text-amber-800' : 'text-red-800');
                    
                    const s = bed.services || {};
                    let almorzos = (parseInt(s.breakfast?.qty)||0) + (parseInt(s.halfBoard?.qty)||0) + (parseInt(s.fullBoard?.qty)||0);
                    let ceas = (parseInt(s.dinner?.qty)||0) + (parseInt(s.halfBoard?.qty)||0) + (parseInt(s.fullBoard?.qty)||0);
                    let srvHtml = '';
                    if(almorzos > 0) srvHtml += \`<span class="bg-amber-100 text-amber-900 border-2 border-amber-400 px-1.5 py-0.5 rounded flex items-center font-black text-[12px]">☕ \${almorzos}</span>\`;
                    if(ceas > 0) srvHtml += \`<span class="bg-orange-100 text-orange-900 border-2 border-orange-400 px-1.5 py-0.5 rounded flex items-center font-black text-[12px]">🍽️ \${ceas}</span>\`;
                    
                    return \`
                        <div class="border rounded p-1 \${bgClass} flex flex-col overflow-hidden relative" style="min-height: 75px;">
                            \${bed.agency ? \`<div class="bg-blue-700 text-white text-[7.5px] font-black px-1 py-0.5 uppercase tracking-wide truncate text-center -mx-1 -mt-1 mb-1 shadow-sm">🏢 \${bed.agency}</div>\` : ''}
                            <div class="flex justify-between items-center mb-0.5">
                                <span class="text-[8px] uppercase font-black text-slate-600">\${label}</span>
                                <span class="text-[9px] font-black \${textClass} bg-white/50 px-1 rounded shadow-sm">\${isFree ? 'L' : (isRes ? 'R' : 'O')}</span>
                            </div>
                            
                            <div class="text-[13px] font-black text-slate-900 leading-tight break-words mt-0.5 flex-grow uppercase" style="line-height: 1.1;">\${bed.clientName || ''}</div>
                            
                            <div class="flex justify-between items-end mt-1">
                                <div class="flex gap-1 flex-wrap">\${srvHtml}</div>
                                \${bed.price > 0 ? \`<div class="text-[9px] font-black text-slate-800 bg-white/50 px-1 rounded shadow-sm">\${bed.price}€</div>\` : '<div class="h-3"></div>'}
                            </div>
                        </div>
                    \`;
                };
                
                bedsHtml += \`
                    <div class="flex flex-col gap-1 p-1 bg-white/80 rounded border-2 \${catStyle.border} shadow-inner break-inside-avoid">
                        <div class="text-[9px] font-black text-center \${catStyle.text} \${catStyle.headerBg} rounded px-1 uppercase shadow-sm">Litera \${litNum}</div>
                        \${renderPrintBed(topBed, 'Alta')}
                        \${renderPrintBed(botBed, 'Baixa')}
                    </div>
                \`;
            });
            
            htmlContent += \`
                <div class="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-3 xl:col-span-2 border-2 \${catStyle.border} \${catStyle.bg} rounded-lg overflow-hidden shadow-sm flex flex-col break-inside-avoid">
                    <div class="\${catStyle.headerBg} border-b-2 \${catStyle.border} px-2 py-1 flex justify-between items-center">
                        <h3 class="font-black \${catStyle.text} text-[12px] flex items-center gap-1">🛏️ \${base.number} <span class="text-[10px] opacity-80 uppercase tracking-wide">(\${base.roomName})</span></h3>
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
            
            let bgStatus = isFree ? 'bg-emerald-50 border-emerald-400' : (isRes ? 'bg-amber-50 border-amber-500' : 'bg-red-50 border-red-500');
            let badgeColor = isFree ? 'bg-emerald-200 text-emerald-900 border-emerald-400' : (isRes ? 'bg-amber-200 text-amber-900 border-amber-400' : 'bg-red-200 text-red-900 border-red-400');
            let statusText = isFree ? 'Libre' : (isRes ? 'Res' : 'Ocup');
            let barColor = isFree ? 'bg-emerald-500' : (isRes ? 'bg-amber-500' : 'bg-red-500');
            
            const s = room.services || {};
            let almorzos = (parseInt(s.breakfast?.qty)||0) + (parseInt(s.halfBoard?.qty)||0) + (parseInt(s.fullBoard?.qty)||0);
            let ceas = (parseInt(s.dinner?.qty)||0) + (parseInt(s.halfBoard?.qty)||0) + (parseInt(s.fullBoard?.qty)||0);
            let srvHtml = '';
            if(almorzos > 0) srvHtml += \`<span class="bg-amber-100 text-amber-900 border-2 border-amber-400 px-1.5 py-0.5 rounded flex items-center font-black text-[13px] shadow-sm">☕ \${almorzos}</span>\`;
            if(ceas > 0) srvHtml += \`<span class="bg-orange-100 text-orange-900 border-2 border-orange-400 px-1.5 py-0.5 rounded flex items-center font-black text-[13px] shadow-sm">🍽️ \${ceas}</span>\`;

            htmlContent += \`
                <div class="col-span-1 rounded-lg border-2 \${catStyle.border} \${catStyle.bg} shadow-sm flex flex-col relative overflow-hidden break-inside-avoid" style="min-height: 135px;">
                    <div class="absolute left-0 top-0 bottom-0 w-1.5 \${catStyle.headerBg}"></div>
                    
                    \${room.agency ? \`<div class="bg-blue-700 text-white text-[8.5px] font-black px-1.5 py-0.5 uppercase tracking-wide truncate text-center ml-1.5 shadow-sm relative z-10 border-b border-blue-800">🏢 \${room.agency}</div>\` : ''}
                    
                    <div class="pl-2.5 p-1.5 flex flex-col flex-grow z-10">
                        <div class="flex justify-between items-start mb-0.5">
                            <span class="text-[8.5px] font-black \${catStyle.text} uppercase truncate mr-1" title="\${base.roomName}">\${icon} \${base.roomName}</span>
                            <span class="text-[8px] font-black \${badgeColor} px-1 rounded shadow-sm">\${statusText}</span>
                        </div>
                        
                        <div class="flex items-center gap-2 mb-0.5">
                            <div class="text-xl font-black text-slate-900 leading-none">\${room.number}</div>
                            \${!isFree ? \`<div class="bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">👤 \${room.guests || 1} PAX</div>\` : ''}
                        </div>
                        
                        <div class="text-[15px] font-black text-slate-900 leading-tight break-words mt-1 mb-1 flex-grow uppercase" style="line-height: 1.1;">\${room.clientName || ''}</div>
                        
                        \${room.observations ? \`<div class="text-[8.5px] font-bold text-red-700 bg-red-50 border border-red-200 p-1 rounded italic break-words leading-tight mt-0.5 shadow-sm">📝 \${room.observations}</div>\` : ''}
                        
                        <div class="flex justify-between items-end mt-auto pt-1 border-t \${catStyle.border}">
                            <div class="flex flex-col gap-1">
                                <span class="text-[8px] bg-white/80 border \${catStyle.border} \${catStyle.text} font-bold px-1 rounded truncate max-w-[80%] shadow-sm">\${room.bedConfig}</span>
                                <div class="flex gap-1">\${srvHtml}</div>
                            </div>
                            <div class="text-[11px] font-black bg-white/50 px-1 rounded shadow-sm \${isFree ? 'opacity-0' : 'text-slate-900'}">\${room.price || 0}€</div>
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
