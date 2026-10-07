
        let lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => {
            const header = document.getElementById('mainHeader');
            if (!header) return;
            const currentScroll = window.scrollY;
            
            if (currentScroll > lastScrollY && currentScroll > 100) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
            lastScrollY = currentScroll;
        });
    
        window.openLibro = function() {
            // Populate select 'libroAsignado'
            const empSelect = document.getElementById('libroAsignado');
            if (empSelect) {
                empSelect.innerHTML = '<option value="Calquera">Calquera / Sen asignar</option>';
                if (appState.empregados) {
                    appState.empregados.forEach(e => {
                        empSelect.innerHTML += `<option value="${e.nome}">${e.nome}</option>`;
                    });
                }
            }
            // Populate select 'libroAloxamento'
            const aloxSelect = document.getElementById('libroAloxamento');
            if (aloxSelect) {
                aloxSelect.innerHTML = '<option value="Xeral">Xeral / Todos</option><option value="Zonas Comúns">Zonas Comúns</option>';
                if (appState.userEstablishments) {
                    appState.userEstablishments.forEach(e => {
                        aloxSelect.innerHTML += `<option value="${e.name}">Est. ${e.name}</option>`;
                    });
                }
                if (appState.baseRooms) {
                    appState.baseRooms.forEach(r => {
                        aloxSelect.innerHTML += `<option value="${r.number}">${r.number}</option>`;
                    });
                }
            }
            
            // Default date to today
            const dataInput = document.getElementById('libroData');
            if (dataInput) {
                dataInput.value = new Date().toISOString().split('T')[0];
            }
            
            document.getElementById('libroModal').classList.add('active');
            
            // Reload incidencias
            if (typeof firebaseBackend !== 'undefined' && firebaseBackend.obterIncidencias) {
                firebaseBackend.obterIncidencias().then(res => {
                    window.allIncidenciasMem = res;
                    renderLibroTable();
                });
            } else if (typeof google !== 'undefined' && google.script) {
                google.script.run.withSuccessHandler(res => {
                    window.allIncidenciasMem = res;
                    renderLibroTable();
                }).obterIncidencias();
            } else {
                // mock if both fail
                window.allIncidenciasMem = JSON.parse(localStorage.getItem('mockIncidencias') || '[]');
                renderLibroTable();
            }
        };

        window.renderLibroTable = function() {
            const tbody = document.getElementById('libroTableBody');
            if (!tbody) return;
            const filterState = document.getElementById('filterEstadoLibro')?.value || 'ALL';
            const query = (document.getElementById('searchLibro')?.value || '').toLowerCase();
            
            let list = window.allIncidenciasMem || [];
            tbody.innerHTML = '';
            
            let html = '';
            list.forEach(item => {
                const isObj = !Array.isArray(item);
                const id = isObj ? item.id : item[0];
                const tipo = isObj ? (item.tipo||'Xeral') : (item[5]||'Xeral');
                const alox = isObj ? item.aloxamento : item[1];
                const desc = isObj ? item.descricion : item[2];
                const resolucion = isObj ? item.resolucion : item[3];
                const estado = isObj ? item.estado : item[4];
                const data = isObj ? (item.dataLimite || item.data || '') : (item[6]||'');
                const rexistradaEn = isObj ? (item.data || '') : '';
                const photo = isObj ? (item.foto || '') : '';
                const asignado = isObj ? (item.asignado||'') : (item[7]||'');
                
                if (filterState !== 'ALL' && estado !== filterState) return;
                
                const searchStr = (tipo + ' ' + alox + ' ' + desc + ' ' + asignado + ' ' + data).toLowerCase();
                if (query && !searchStr.includes(query)) return;
                
                let icon = '📌';
                if(tipo==='Mantemento') icon = '🛠️';
                else if(tipo==='Limpeza') icon = '🧹';
                else if(tipo==='Queixa') icon = '🗣️';
                else if(tipo==='Tarefa Diaria') icon = '📋';
                
                const isPend = estado === 'Pendente';
                const estColor = isPend ? 'bg-red-100 text-red-800 border-red-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200';
                
                html += `<div class="bg-white rounded-xl shadow-sm border ${isPend ? 'border-amber-200' : 'border-slate-200'} p-4 flex flex-col relative overflow-hidden">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-1.5">
                            <span class="text-2xl">${icon}</span>
                            <div>
                                <h4 class="font-bold text-slate-800 leading-tight">${tipo}</h4>
                                <span class="text-xs font-semibold text-slate-500">${alox}</span>
                            </div>
                        </div>
                        <span class="px-2 py-1 rounded-md text-[10px] font-black uppercase border ${estColor}">${estado}</span>
                    </div>
                    
                    <div class="text-sm text-slate-700 font-medium mb-4 flex-1">
                        ${desc}
                    </div>
                    
                    <div class="bg-slate-50 rounded-lg p-2 mb-4 flex justify-between items-center border border-slate-100">
                        <div class="flex flex-col">
                            <span class="text-[10px] uppercase font-bold text-slate-400">Data Límite / Rexistro</span>
                            <span class="text-xs font-bold text-slate-700">${data || 'Sen data'}</span>
                        </div>
                        <div class="flex flex-col text-right">
                            <span class="text-[10px] uppercase font-bold text-slate-400">Asignado a</span>
                            <span class="text-xs font-bold text-slate-700">${asignado ? '👤 ' + asignado : 'Calquera'}</span>
                        </div>
                    </div>
                    
                    <div class="mt-3 flex gap-1.5">
                        ${photo ? `<button onclick="window.open('${photo}', '_blank')" class="flex-1 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold border border-blue-200">🖼️ Ver Foto</button>` : ''}
                    </div>
                    <div class="mt-auto border-t pt-3 mt-3">
                        ${isPend 
                            ? `<button onclick="marcarIncidenciaResolta('${id}')" class="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-black text-sm border border-emerald-200 transition-colors shadow-sm">✓ Marcar como Resolto</button>` 
                            : `<div class="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100"><span class="font-bold text-slate-700">Resolto:</span> ${resolucion}</div>`}
                    </div>
                </div>`;
            });
            if (!html) html = '<div class="col-span-full p-8 text-center italic text-slate-500 bg-slate-50 rounded-xl border border-slate-200">Non hai tarefas ou incidencias para este filtro.</div>';
            tbody.innerHTML = html;
        };
        
        
        window.imprimirOrdenDia = function() {
            let list = window.allIncidenciasMem || [];
            let pendentes = list.filter(item => {
                const isObj = !Array.isArray(item);
                const estado = isObj ? item.estado : item[4];
                return estado === 'Pendente';
            });
            
            let printHtml = `
            <html><head><title>Orden do Día</title>
            <style>
                body { font-family: sans-serif; margin: 20px; color: #000; }
                h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; text-transform: uppercase; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #000; padding: 10px; text-align: left; }
                th { background: #eee; font-weight: bold; }
                .box { width: 20px; height: 20px; border: 2px solid #000; display: inline-block; }
                .row { page-break-inside: avoid; }
                .date { text-align: right; font-weight: bold; margin-bottom: 20px; }
            </style>
            </head><body>
                <h1>📋 Orden do Día</h1>
                <div class="date">${new Date().toLocaleDateString('gl-ES')}</div>
                <table>
                    <tr><th style="width: 40px; text-align: center;">✓</th><th>Tipo</th><th>Lugar</th><th>Descrición</th><th>Data</th><th>Asignado</th></tr>
            `;
            
            if(pendentes.length === 0) {
                printHtml += `<tr><td colspan="6" style="text-align: center; padding: 20px;">Non hai tarefas pendentes. ¡Bo traballo!</td></tr>`;
            } else {
                pendentes.forEach(item => {
                    const isObj = !Array.isArray(item);
                    const tipo = isObj ? (item.tipo||'Xeral') : (item[5]||'Xeral');
                    const alox = isObj ? item.aloxamento : item[1];
                    const desc = isObj ? item.descricion : item[2];
                    const data = isObj ? (item.data||'') : (item[6]||'');
                    const asignado = isObj ? (item.asignado||'') : (item[7]||'');
                    
                    printHtml += `<tr class="row">
                        <td style="text-align: center;"><div class="box"></div></td>
                        <td><b>${tipo}</b></td>
                        <td>${alox}</td>
                        <td>${desc}</td>
                        <td>${data}</td>
                        <td>${asignado && asignado !== 'Calquera' ? asignado : ''}</td>
                    </tr>`;
                });
            }
            
            printHtml += `</table></body></html>`;
            
            const printFrame = document.createElement('iframe');
            printFrame.style.position = 'absolute';
            printFrame.style.top = '-9999px';
            document.body.appendChild(printFrame);
            
            const printDoc = printFrame.contentWindow.document;
            printDoc.open();
            printDoc.write(printHtml);
            printDoc.close();
            
            printFrame.contentWindow.focus();
            setTimeout(() => {
                printFrame.contentWindow.print();
                setTimeout(() => {
                    document.body.removeChild(printFrame);
                }, 1000);
            }, 500);
        };
        
        window.filterLibro = function() {

            renderLibroTable();
        };

        
        window.previewIncidenciaPhoto = function(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                // Compress image to avoid 1MB Firestore limit
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    let ctx = canvas.getContext('2d');
                    let maxW = 800; let maxH = 800;
                    let width = img.width; let height = img.height;
                    if (width > height) {
                        if (width > maxW) { height *= maxW / width; width = maxW; }
                    } else {
                        if (height > maxH) { width *= maxH / height; height = maxH; }
                    }
                    canvas.width = width; canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    const b64 = canvas.toDataURL('image/jpeg', 0.7);
                    
                    document.getElementById('incidenciaPhotoB64').value = b64;
                    document.getElementById('incidenciaPhotoPreview').src = b64;
                    document.getElementById('incidenciaPhotoPreviewContainer').classList.remove('hidden');
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        };
        
        window.clearIncidenciaPhoto = function() {
            document.getElementById('incidenciaPhotoB64').value = '';
            document.getElementById('incidenciaPhotoPreview').src = '';
            document.getElementById('incidenciaPhotoPreviewContainer').classList.add('hidden');
            document.getElementById('incidenciaPhoto').value = '';
        };

        window.gardarNovaIncidencia = function() {
            const tipo = document.getElementById('libroTipo').value;
            const asignado = document.getElementById('libroAsignado').value;
            const alox = document.getElementById('libroAloxamento').value;
            const data = document.getElementById('libroData').value;
            const desc = document.getElementById('libroDescricion').value;
            const b64 = document.getElementById('incidenciaPhotoB64')?.value || '';
            
            if (!desc) { cAlert('Engade unha descrición por favor'); return; }
            
            const btn = document.querySelector('button[onclick="gardarNovaIncidencia()"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Gardando...'; btn.disabled = true;
            
            let obj = {
                id: 'INC_' + Date.now(),
                tipo: tipo,
                asignado: asignado,
                aloxamento: alox,
                data: data,
                descricion: desc,
                resolucion: '',
                estado: 'Pendente',
                foto: b64
            };
            
            // In backend save
            if (typeof firebaseBackend !== 'undefined' && firebaseBackend.gardarIncidencia) {
                Promise.race([
        firebaseBackend.gardarIncidencia(obj),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout gardando incidencia. Comproba a túa conexión.")), 8000))
    ]).then(() => {
                    if (appState.pushConfig && appState.pushConfig.telegram) { sendTelegramMsg(`🚨 <b>Nova Tarefa/Incidencia:</b>\n\n📌 <b>Tipo:</b> ${tipo}\n👤 <b>Asignado a:</b> ${asignado}\n📍 <b>Lugar:</b> ${alox}\n📅 <b>Data:</b> ${data}\n📝 <b>Descrición:</b> ${desc}`); }
                    btn.innerHTML = originalText; btn.disabled = false;
                    document.getElementById('libroDescricion').value = '';
                    if(typeof clearIncidenciaPhoto === 'function') clearIncidenciaPhoto();
                    openLibro(); // reload
                }).catch(err => {
                    btn.innerHTML = originalText; btn.disabled = false;
                    cAlert("Erro: " + err);
                });
            } else if (typeof google !== 'undefined' && google.script) {
                google.script.run.withSuccessHandler(() => {
                    if (appState.pushConfig && appState.pushConfig.telegram) { sendTelegramMsg(`🚨 <b>Nova Tarefa/Incidencia:</b>\n\n📌 <b>Tipo:</b> ${tipo}\n👤 <b>Asignado a:</b> ${asignado}\n📍 <b>Lugar:</b> ${alox}\n📅 <b>Data:</b> ${data}\n📝 <b>Descrición:</b> ${desc}`); }
                    btn.innerHTML = originalText; btn.disabled = false;
                    document.getElementById('libroDescricion').value = '';
                    if(typeof clearIncidenciaPhoto === 'function') clearIncidenciaPhoto();
                    openLibro();
                }).withFailureHandler((err)=>{
                    btn.innerHTML = originalText; btn.disabled = false;
                    cAlert("Erro: " + err);
                }).gardarIncidencia(tipo, alox, desc, b64, asignado, data);
            } else {
                 let arr = JSON.parse(localStorage.getItem('mockIncidencias') || '[]');
                 arr.unshift(obj);
                 localStorage.setItem('mockIncidencias', JSON.stringify(arr));
                 if (appState.pushConfig && appState.pushConfig.telegram) { sendTelegramMsg(`🚨 <b>Nova Tarefa/Incidencia:</b>\n\n📌 <b>Tipo:</b> ${tipo}\n👤 <b>Asignado a:</b> ${asignado}\n📍 <b>Lugar:</b> ${alox}\n📅 <b>Data:</b> ${data}\n📝 <b>Descrición:</b> ${desc}`); }
                 btn.innerHTML = originalText; btn.disabled = false;
                 document.getElementById('libroDescricion').value = '';
                 if(typeof clearIncidenciaPhoto === 'function') clearIncidenciaPhoto();
                 openLibro();
            }
        };

        window.updateIncidenciasBadge = function() {
            const badge = document.getElementById('badgeIncidencias');
            if (!badge) return;
            const mem = window.allIncidenciasMem || [];
            let count = 0;
            mem.forEach(item => {
                const isObj = !Array.isArray(item);
                const estado = isObj ? item.estado : item[4];
                if (estado === 'Pendente') count++;
            });
            if (count > 0) {
                badge.innerText = count;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        };
        // Also call updateIncidenciasBadge inside renderLibroTable
        const oldRenderLibro = window.renderLibroTable;
        window.renderLibroTable = function() {
            if (oldRenderLibro) oldRenderLibro();
            updateIncidenciasBadge();
        };

        window.openPecheCaixa = function() {
            const m = document.getElementById('caixaModal');
            if (!m) return;
            
            const dia = appState.dailyData[currentPlaningDate] || [];
            
            let tEfectivo = 0, tTarxeta = 0, tTransf = 0, tAgency = 0;
            let pHab = 0, pApt = 0, pAlb = 0;
            let pBreak = 0, pDin = 0, pPic = 0, pPens = 0, pLaun = 0, pMoch = 0, pOutros = 0;
            
            dia.forEach(r => {
                if (r.status === 'free') return;
                
                tEfectivo += parseFloat(r.paidCash || 0);
                tTarxeta += parseFloat(r.paidCard || 0);
                tTransf += parseFloat(r.paidTransfer || 0);
                tAgency += parseFloat(r.paidAgency || 0);
                
                const base = appState.baseRooms.find(b => b.id === r.baseId);
                const aPrice = parseFloat(r.price || 0);
                if (base) {
                    if (base.type === 'hostel') pAlb += aPrice;
                    else if (base.type === 'apartment') pApt += aPrice;
                    else pHab += aPrice;
                } else {
                    pHab += aPrice; // fallback
                }
                
                const s = r.services || {};
                pBreak += parseFloat(s.breakfast?.price || 0);
                pDin += parseFloat(s.dinner?.price || 0);
                pPic += parseFloat(s.picnic?.price || 0);
                pPens += parseFloat(s.halfBoard?.price || 0) + parseFloat(s.fullBoard?.price || 0);
                if (s.laundry?.active) pLaun += parseFloat(s.laundry.price || 0);
                pMoch += parseFloat(s.mochilas?.price || 0);
                pOutros += parseFloat(s.outros?.price || 0);
            });
            
            const tIn = tEfectivo + tTarxeta + tTransf;
            const tAlox = pHab + pApt + pAlb;
            const tExt = pBreak + pDin + pPic + pPens + pLaun + pMoch + pOutros;
            const tFact = tAlox + tExt;
            const tPen = Math.max(0, tFact - (tIn + tAgency));
            
            document.getElementById('cEfectivo').innerText = tEfectivo.toFixed(2) + ' €';
            document.getElementById('cTarxeta').innerText = tTarxeta.toFixed(2) + ' €';
            document.getElementById('cTransf').innerText = tTransf.toFixed(2) + ' €';
            document.getElementById('cTotalIn').innerText = tIn.toFixed(2) + ' €';
            
            document.getElementById('cPHab').innerText = pHab.toFixed(2) + ' €';
            document.getElementById('cPApt').innerText = pApt.toFixed(2) + ' €';
            document.getElementById('cPAlb').innerText = pAlb.toFixed(2) + ' €';
            document.getElementById('cTotalAlox').innerText = tAlox.toFixed(2) + ' €';
            
            document.getElementById('cBreak').innerText = pBreak.toFixed(2) + ' €';
            document.getElementById('cDin').innerText = pDin.toFixed(2) + ' €';
            document.getElementById('cPic').innerText = pPic.toFixed(2) + ' €';
            document.getElementById('cPens').innerText = pPens.toFixed(2) + ' €';
            document.getElementById('cLaun').innerText = pLaun.toFixed(2) + ' €';
            document.getElementById('cMoch').innerText = (pMoch + pOutros).toFixed(2) + ' €';
            document.getElementById('cTotalExt').innerText = tExt.toFixed(2) + ' €';
            
            document.getElementById('cFacturado').innerText = tFact.toFixed(2) + ' €';
            document.getElementById('cAgency').innerText = tAgency.toFixed(2) + ' €';
            document.getElementById('cPendente').innerText = tPen.toFixed(2) + ' €';
            
            m.classList.add('active');
        };

        window.enviarPecheTelegram = function() {
            if (!appState.pushConfig || !appState.pushConfig.telegram) {
                cAlert('O envío de Telegram non está activado en Configuración.');
                return;
            }
            const dateStr = currentPlaningDate.split('-').reverse().join('/');
            const msg = `💰 <b>PECHE DE CAIXA: ${dateStr}</b>\n\n` +
                        `💵 Efectivo: ${document.getElementById('cEfectivo').innerText}\n` +
                        `💳 Tarxeta: ${document.getElementById('cTarxeta').innerText}\n` +
                        `🏦 Transfer.: ${document.getElementById('cTransf').innerText}\n` +
                        `👉 <b>TOTAL INGR.: ${document.getElementById('cTotalIn').innerText}</b>\n\n` +
                        `🛏️ <b>PRODUCIÓN</b>\n` +
                        `Aloxamento: ${document.getElementById('cTotalAlox').innerText}\n` +
                        `Extras: ${document.getElementById('cTotalExt').innerText}\n\n` +
                        `📊 <b>RESUMO FINAL</b>\n` +
                        `Facturado: ${document.getElementById('cFacturado').innerText}\n` +
                        `Axencias: ${document.getElementById('cAgency').innerText}\n` +
                        `Pendente: ${document.getElementById('cPendente').innerText}`;
            
            const btn = document.querySelector('button[onclick="enviarPecheTelegram()"]');
            if (btn) { btn.innerHTML = 'Enviando...'; btn.disabled = true; }
            
            sendTelegramMsg(msg).then(() => {
                cAlert('Notificación enviada correctamente a Dirección.');
                if (btn) { btn.innerHTML = '📲 Notificar Peche a Dirección'; btn.disabled = false; }
            }).catch(e => {
                cAlert('Houbo un erro ao enviar.');
                if (btn) { btn.innerHTML = '📲 Notificar Peche a Dirección'; btn.disabled = false; }
            });
        };

        window.inboxReservas = [];
        window.pendingMailAssign = null;

        
        window.fetchInboxReservas = function() { return; 
            const cont = document.getElementById('inboxContent');
            if(cont) cont.innerHTML = '<div class="col-span-full p-8 text-center font-bold text-blue-600"><div class="spinner inline-block mr-2 border-blue-600"></div>Buscando correos de reservas na bandexa...</div>';
            
            if (typeof google !== 'undefined' && google.script) {
                const runner = google.script.run.withSuccessHandler(res => {
                    window.inboxReservas = res || [];
                    updateInboxBadge();
                    renderInboxContent();
                }).withFailureHandler(err => {
                    const cont = document.getElementById('inboxContent');
                    if (cont) cont.innerHTML = `<div class="col-span-full p-8 text-center text-red-600 bg-red-50 rounded-xl border border-red-200">
                        <b>Erro:</b> ${err.message === 'NOT_LOGGED_IN_GOOGLE' ? 'Non iniciaches sesión con Google na sesión actual.' : (err.message || 'Erro descoñecido')}<br><br>
                        <button onclick="conectarGmail()" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-transform transform hover:scale-105">Conectar con Gmail</button>
                    </div>`;
                });
                if (false) {} /* Removed Gmail Sync */ else {
                    window.inboxReservas = [];
                    renderInboxContent();
                }
            } else {
                window.inboxReservas = [];
                renderInboxContent();
            }
        };

        window.updateInboxBadge = function() {
            const badge = document.getElementById('badgeInbox');
            if(badge) {
                if(window.inboxReservas && window.inboxReservas.length > 0) {
                    badge.innerText = window.inboxReservas.length;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            }
        };

        window.renderInboxContent = function() {
            const cont = document.getElementById('inboxContent');
            if (!cont) return;
            if (!window.inboxReservas || window.inboxReservas.length === 0) {
                cont.innerHTML = '<div class="col-span-full p-8 text-center italic text-slate-500 bg-slate-50 rounded-xl border border-slate-200">Non hai novas reservas sen ler en Gmail.</div>';
                return;
            }
            
            let html = '';
            window.inboxReservas.forEach((r, idx) => {
                const isCanc = r.isCancellation;
                const estText = r.establecimiento ? r.establecimiento : 'Descoñecido';
                const isComplexo = estText.toLowerCase().includes('complexo');
                const isHotel = estText.toLowerCase().includes('hotel');
                const badgeColor = isHotel ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-orange-100 text-orange-800 border-orange-200';
                
                html += `<div class="bg-white rounded-xl shadow-sm border ${isCanc ? 'border-red-400 bg-red-50' : 'border-blue-200'} p-4 flex flex-col">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h3 class="font-black text-lg ${isCanc ? 'text-red-700 line-through' : 'text-slate-900'}">${r.clientName}</h3>
                            <p class="text-xs font-bold text-slate-500">ID: ${r.id}</p>
                        </div>
                        <span class="px-2 py-1 rounded-md text-[10px] font-black uppercase border ${badgeColor}">${estText}</span>
                    </div>
                    
                    <div class="text-sm font-bold text-slate-700 mb-2">
                        <p>📅 <b>Check-In:</b> ${r.checkIn ? r.checkIn.split('-').reverse().join('/') : 'N/A'} (${r.noches} noites)</p>
                        <p>👥 <b>Persoas:</b> ${r.personas}</p>
                        <p>🛏️ <b>Tipo:</b> ${r.roomInfo || 'N/A'}</p>
                    </div>
                    
                    <div class="bg-slate-50 rounded-lg p-2 mb-4 border border-slate-100 text-xs font-bold">
                        <div class="flex justify-between"><span>💰 Total:</span><span>${r.total}€</span></div>
                        <div class="flex justify-between text-emerald-600"><span>💳 Anticipo:</span><span>${r.paidAgency}€</span></div>
                        <div class="flex justify-between text-red-600"><span>⏳ Pendente:</span><span>${(r.total - r.paidAgency).toFixed(2)}€</span></div>
                    </div>
                    
                    <div class="mt-auto border-t pt-3 flex gap-1.5">
                        ${isCanc ? 
                            `<button onclick="autoCancelReservationWrapper(${idx})" class="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 font-bold text-sm shadow-sm transition">🗑️ Auto-Cancelar</button>
                             <button onclick="marcarCorreoLido('${r.msgId}', ${idx})" class="px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg py-2 font-bold text-sm transition" title="Marcar lido e ignorar">👁️</button>` 
                            : 
                            `<button onclick="autoAssignReservationWrapper(${idx})" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 font-bold text-sm shadow-sm transition">🤖 Auto-Asignar</button>
                             <button onclick="marcarCorreoLido('${r.msgId}', ${idx})" class="px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg py-2 font-bold text-sm transition" title="Marcar como lido e ignorar">👁️</button>`
                        }
                    </div>
                </div>`;
            });
            cont.innerHTML = html;
        };

        
        window.autoAssignReservationWrapper = function(idx) {
            const resObj = window.inboxReservas[idx];
            if (!resObj) return;
            cConfirm(`Confirmas que desexas asignar automaticamente a reserva de <b>${resObj.clientName}</b> (${resObj.noches} noites, ${resObj.personas} persoas)?`, (res) => {
                if(res) {
                    const cont = document.getElementById('inboxContent');
                    if (cont) cont.innerHTML = '<div class="col-span-full p-8 text-center font-bold text-blue-600"><div class="spinner inline-block mr-2 border-blue-600"></div>Auto-asignando reserva...</div>';
                    
                    if (typeof google !== 'undefined' && google.script) {
                        google.script.run.withSuccessHandler(res => {
                            showToast("Reserva auto-asignada con éxito!");
                            window.syncIcalReservations(false);
                            appState.dailyData = {}; if (window.changeDate) window.changeDate();
                        }).withFailureHandler(err => {
                            if (cont) cont.innerHTML = '<div class="col-span-full p-8 text-center text-red-600 bg-red-50 rounded-xl border border-red-200"><b>Erro:</b> ' + err.message + '<br><br><button onclick="window.syncIcalReservations(false)" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold mt-2">Volver</button></div>';
                        }).autoAssignReservation(resObj);
                    }
                }
            });
        };

        window.autoCancelReservationWrapper = function(idx) {
            const resObj = window.inboxReservas[idx];
            if (!resObj) return;
            cConfirm(`Confirmas que desexas cancelar as habitacións rexistradas a nome de <b>${resObj.clientName}</b> nas datas da reserva?`, (res) => {
                if(res) {
                    const cont = document.getElementById('inboxContent');
                    if (cont) cont.innerHTML = '<div class="col-span-full p-8 text-center font-bold text-red-600"><div class="spinner inline-block mr-2 border-red-600"></div>Auto-cancelando reserva...</div>';
                    
                    if (typeof google !== 'undefined' && google.script) {
                        google.script.run.withSuccessHandler(res => {
                            showToast("Reserva cancelada con éxito! ("+res.canceledCount+" días libres)");
                            window.syncIcalReservations(false);
                            if (window.changeDate) window.changeDate();
                        }).withFailureHandler(err => {
                            if (cont) cont.innerHTML = '<div class="col-span-full p-8 text-center text-red-600 bg-red-50 rounded-xl border border-red-200"><b>Erro:</b> ' + err.message + '<br><br><button onclick="window.syncIcalReservations(false)" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold mt-2">Volver</button></div>';
                        }).autoCancelReservation(resObj);
                    }
                }
            });
        };

        
        window.showReservationNotification = function(res) {
            const cancelCount = res.filter(r => r.isCancellation).length;
            const addCount = res.length - cancelCount;
            let msg = `Entraron ${res.length} correos de reservas.<br>`;
            if (addCount > 0) msg += `- ${addCount} para engadir<br>`;
            if (cancelCount > 0) msg += `- ${cancelCount} para cancelar<br>`;
            msg += `<br>Queres xestionalas agora?`;
            
            const notif = document.createElement('div');
            notif.className = 'fixed bottom-4 right-4 bg-white rounded-xl shadow-2xl border-2 border-blue-500 p-6 z-[9999] animate-bounce';
            notif.innerHTML = `
                <h3 class="font-black text-lg text-blue-800 mb-2">🔔 Novas Reservas Detectadas!</h3>
                <p class="text-slate-600 mb-4">${msg}</p>
                <div class="flex gap-1.5">
                    <button onclick="this.parentElement.parentElement.remove(); openInboxReservas();" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold">Si, ver reservas</button>
                    <button onclick="this.parentElement.parentElement.remove();" class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold">Máis tarde</button>
                </div>
            `;
            document.body.appendChild(notif);
        };

        window.marcarCorreoLido = function(msgId, idx) {
            if (typeof google !== 'undefined' && google.script) {
                if (typeof google.script.run.markEmailAsRead === 'function') {
                    google.script.run.markEmailAsRead(msgId);
                }
            }
            window.inboxReservas.splice(idx, 1);
            updateInboxBadge();
            renderInboxContent();
            showToast("Correo arquivado correctamente.");
        };

        window.conectarGmail = function() {
            if (window.doGoogleLogin) {
                const cont = document.getElementById('inboxContent');
                if (cont) cont.innerHTML = '<div class="col-span-full p-8 text-center font-bold text-blue-600"><div class="spinner inline-block mr-2 border-blue-600"></div>Conectando con Google...</div>';
                
                window.doGoogleLogin().then(() => {
                    window.syncIcalReservations(false);
                }).catch(e => {
                    if (cont) cont.innerHTML = '<div class="col-span-full p-8 text-center text-red-600">Erro ao conectar: ' + e.message + '</div>';
                });
            }
        };

        
                
        function parseIcal(icalStr) {
            let unfolded = icalStr.replace(/\r\n[ \t]+/g, '');
            unfolded = unfolded.replace(/\n[ \t]+/g, '');
            const lines = unfolded.split(/\r\n|\n|\r/);
            const events = [];
            let currentEvent = null;
            
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                if (line.startsWith('BEGIN:VEVENT')) {
                    currentEvent = {};
                } else if (line.startsWith('END:VEVENT')) {
                    if (currentEvent) events.push(currentEvent);
                    currentEvent = null;
                } else if (currentEvent) {
                    if (line.startsWith('DTSTART')) {
                        const val = line.split(':')[1];
                        if (val) currentEvent.dtstart = parseIcalDate(val);
                    } else if (line.startsWith('DTEND')) {
                        const val = line.split(':')[1];
                        if (val) currentEvent.dtend = parseIcalDate(val);
                    } else if (line.startsWith('SUMMARY')) {
                        currentEvent.summary = line.substring(line.indexOf(':')+1);
                    } else if (line.startsWith('DESCRIPTION')) {
                        currentEvent.description = line.substring(line.indexOf(':')+1);
                    } else if (line.startsWith('UID')) {
                        currentEvent.uid = line.substring(line.indexOf(':')+1).trim();
                    }
                }
            }
            return events;
        }
        
        function parseIcalDate(icalDateStr) {
            if (!icalDateStr) return null;
            let str = icalDateStr.trim().replace(/T/g, '').replace(/Z/g, '');
            if (str.includes('-')) {
                str = str.replace(/-/g, '');
            }
            if (str.length >= 8) {
                const y = str.substring(0,4);
                const m = str.substring(4,6);
                const d = str.substring(6,8);
                return new Date(y + '-' + m + '-' + d + 'T12:00:00Z');
            }
            return null;
        }
        
        
        
        
        
        
        window.pendingAIParsedReservations = [];
        let analyzeTimeout = null;

        window.debounceAnalyzeImport = function() {
            const text = document.getElementById('importListTextarea').value.trim();
            const btn = document.getElementById('btnProcessImportAI');
            const summaryBox = document.getElementById('importSummaryBox');
            
            if (text.length < 20) {
                btn.disabled = true;
                btn.classList.add('opacity-50', 'cursor-not-allowed');
                summaryBox.classList.add('hidden');
                return;
            }
            
            summaryBox.classList.remove('hidden');
            summaryBox.className = "mb-4 p-4 rounded-xl border bg-blue-50 border-blue-200 text-blue-800 animate-pulse font-bold";
            summaryBox.innerHTML = "✨ A Intelixencia Artificial está analizando o texto, agarda un momento...";
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');

            clearTimeout(analyzeTimeout);
            analyzeTimeout = setTimeout(() => {
                analyzeImportWithAI(text);
            }, 1000);
        };

        window.analyzeImportWithAI = async function(text) {
            const summaryBox = document.getElementById('importSummaryBox');
            try {
                const res = await fetch('/api/parse-import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: text,
                        baseRooms: appState.baseRooms
                    })
                });
                let data;
                let rawText = await res.text();
                try {
                    data = JSON.parse(rawText);
                } catch(err) {
                    if (res.status === 504 || res.status === 502) {
                        throw new Error("O servidor tardou demasiado en responder (Timeout). Téntao cun texto máis curto.");
                    }
                    throw new Error("Erro do servidor (" + res.status + "): non se puido ler a resposta da IA.");
                }
                if (!res.ok) {
                    throw new Error(data.error || "Erro de servidor (" + res.status + ")");
                }
                
                window.pendingAIParsedReservations = data.reservations || [];
                
                if (window.pendingAIParsedReservations.length > 0) {
                    summaryBox.className = "mb-4 p-4 rounded-xl border bg-green-50 border-green-200 text-green-800";
                    let htmlList = `<div class="font-bold text-lg mb-2">✅ ${data.summary}</div><ul class="list-disc pl-5 max-h-40 overflow-y-auto text-sm">`;
                    window.pendingAIParsedReservations.forEach(r => {
                        htmlList += `<li>${r.clientName} (${r.checkIn} a ${r.checkOut}) - ${r.rooms.length} hab. - ${r.price}€</li>`;
                    });
                    htmlList += '</ul>';
                    summaryBox.innerHTML = htmlList;
                    
                    const btn = document.getElementById('btnProcessImportAI');
                    btn.disabled = false;
                    btn.classList.remove('opacity-50', 'cursor-not-allowed');
                } else {
                    summaryBox.className = "mb-4 p-4 rounded-xl border bg-orange-50 border-orange-200 text-orange-800 font-bold";
                    summaryBox.innerHTML = "⚠️ " + (data.summary || "Non se atoparon reservas válidas neste texto. Asegúrate de pegar ben o contido.");
                }
                        } catch(e) {
                summaryBox.className = "mb-4 p-4 rounded-xl border bg-red-50 border-red-200 text-red-800 font-bold";
                summaryBox.innerHTML = "❌ Produciuse un erro contactando coa IA: " + e.message;
            }
        };

        window.processImportListAI = async function() {
            if (!window.pendingAIParsedReservations || window.pendingAIParsedReservations.length === 0) return;
            showLoader();
            let successCount = 0;
            
            try {
                // 1. Gather all dates needed for all reservations
                let datesNeeded = new Set();
                for (let res of window.pendingAIParsedReservations) {
                    let inD = new Date(res.checkIn);
                    let outD = new Date(res.checkOut);
                    if (isNaN(inD.getTime()) || isNaN(outD.getTime()) || outD <= inD) {
                        outD = new Date(inD);
                        outD.setDate(outD.getDate() + 1);
                    }
                    let iter = new Date(inD);
                    while (iter < outD) {
                        datesNeeded.add(iter.toISOString().split('T')[0]);
                        iter.setDate(iter.getDate() + 1);
                    }
                }
                
                // 2. Fetch all missing dates in parallel
                if (typeof google !== 'undefined' && google.script) {
                    let fetchPromises = Array.from(datesNeeded).map(d => {
                        if (appState.dailyData && appState.dailyData[d]) return Promise.resolve();
                        return new Promise(resolve => {
                            google.script.run.withSuccessHandler(res => {
                                if (res && res.dayData) {
                                    if(!appState.dailyData) appState.dailyData = {};
                                    appState.dailyData[d] = res.dayData;
                                }
                                resolve();
                            }).withFailureHandler(resolve).getInitialData(d);
                        });
                    });
                    await Promise.all(fetchPromises);
                }

                // 3. Process reservations locally in memory
                for (let res of window.pendingAIParsedReservations) {
                    const updatedRooms = [];
                    let dayData = (appState.dailyData && appState.dailyData[res.checkIn]) ? appState.dailyData[res.checkIn] : [];
                    
                    
                    
                    // QUICK CHECK: DOES THIS EXACT RESERVATION ALREADY EXIST?
                    let alreadyExists = true;
                    for (let ri of res.rooms) {
                        let baseRoom = appState.baseRooms.find(br => br.id === ri.baseRoomId);
                        if (!baseRoom) continue;
                        
                        let targetClientName = (res.clientName || '').trim().toLowerCase();
                        let otaName = (res.ota || '').trim().toLowerCase();
                        
                        if (baseRoom.type === 'hostel') {
                            let qty = ri.qty || 1;
                            let matchingBeds = dayData.filter(r => r.baseId === baseRoom.id && r.clientName && (r.clientName.trim().toLowerCase().includes(targetClientName) || targetClientName.includes(r.clientName.trim().toLowerCase())) && r.status !== 'free');
                            if (matchingBeds.length < qty) {
                                alreadyExists = false; break;
                            }
                        } else {
                            let matchingRoom = dayData.find(r => r.baseId === baseRoom.id && r.status !== 'free' && r.clientName && (r.clientName.trim().toLowerCase().includes(targetClientName) || targetClientName.includes(r.clientName.trim().toLowerCase())));
                            if (!matchingRoom) {
                                alreadyExists = false; break;
                            }
                        }
                    }

                    if (alreadyExists) {
                        console.log("Reservation already exists, merging notes and services:", res.clientName);
                        let updatedExisting = false;
                        for (let ri of res.rooms) {
                            let baseRoom = appState.baseRooms.find(br => br.id === ri.baseRoomId);
                            if (!baseRoom) continue;
                            
                            let targetClientName = (res.clientName || '').trim().toLowerCase();
                            
                            let matchingRooms = [];
                            if (baseRoom.type === 'hostel') {
                                matchingRooms = dayData.filter(r => r.baseId === baseRoom.id && r.status !== 'free' && r.clientName && (r.clientName.trim().toLowerCase().includes(targetClientName) || targetClientName.includes(r.clientName.trim().toLowerCase())));
                            } else {
                                let m = dayData.find(r => r.baseId === baseRoom.id && r.status !== 'free' && r.clientName && (r.clientName.trim().toLowerCase().includes(targetClientName) || targetClientName.includes(r.clientName.trim().toLowerCase())));
                                if (m) matchingRooms.push(m);
                            }
                            
                            for (let matchingRoom of matchingRooms) {
                                if (res.observations && (!matchingRoom.observations || !matchingRoom.observations.includes(res.observations))) {
                                    matchingRoom.observations = (matchingRoom.observations ? matchingRoom.observations + "\n" : "") + res.observations;
                                    updatedExisting = true;
                                }
                                if (res.services) {
                                    if (res.services.breakfast?.qty > 0 && (!matchingRoom.services.breakfast || matchingRoom.services.breakfast.qty === 0)) {
                                         matchingRoom.services.breakfast = res.services.breakfast; updatedExisting = true;
                                    }
                                    if (res.services.halfBoard?.qty > 0 && (!matchingRoom.services.halfBoard || matchingRoom.services.halfBoard.qty === 0)) {
                                         matchingRoom.services.halfBoard = res.services.halfBoard; updatedExisting = true;
                                    }
                                    if (res.services.dinner?.qty > 0 && (!matchingRoom.services.dinner || matchingRoom.services.dinner.qty === 0)) {
                                         matchingRoom.services.dinner = res.services.dinner; updatedExisting = true;
                                    }
                                }
                                
                                let o = res.ota || '';
                                
                                let oLower = o.trim().toLowerCase();
                                let matched = false;
                                if(oLower && appState && appState.agencies) {
                                    let bestMatch = appState.agencies.find(a => oLower.includes(a.name.toLowerCase()) || a.name.toLowerCase().includes(oLower));
                                    if(bestMatch) { o = bestMatch.name; matched = true; }
                                }
                                if(!matched && oLower) {
                                    if(oLower.includes('booking')) o = 'Booking.com';
                                    else if(oLower.includes('hostelworld')) o = 'HostelWorld';
                                    else if(oLower.includes('pitchup')) o = 'Pitchup';
                                    else if(oLower.includes('expedia')) o = 'Expedia';
                                    else if(oLower.includes('airbnb')) o = 'Airbnb';
                                }

                                if (o && (!matchingRoom.agency || matchingRoom.agency.trim() === '' || matchingRoom.agency.toLowerCase().includes('ical') || matchingRoom.agency.toLowerCase().includes('misterplan'))) {
                                    matchingRoom.agency = o;
                                    updatedExisting = true;
                                } else if (o && matchingRoom.agency !== o) {
                                    matchingRoom.agency = o;
                                    updatedExisting = true;
                                }

                            }
                        }
                        
                        if (updatedExisting) {
                            appState.dailyData[res.checkIn] = dayData;
                            if (typeof google === 'undefined' || !google.script) {
                                 if (res.checkIn === currentPlaningDate) salvarDiaNoServidor();
                            } else {
                                 const s = document.getElementById('saveStatus'); if(s) { s.classList.remove('hidden'); setTimeout(()=>s.classList.add('hidden'), 2000); }
                                 google.script.run.withSuccessHandler(()=>{
                                    console.log("Merged data saved to server");
                                 }).saveDayData(res.checkIn, JSON.stringify(dayData));
                            }
                        }
                        
                        continue;
                    }

                    // ALSO CHECK IF ROOMS ARE ALREADY OCCUPIED BY SOMEONE ELSE TO AVOID OVERWRITING REAL RESERVATIONS
                    let roomConflict = false;
                    for (let ri of res.rooms) {
                        let baseRoom = appState.baseRooms.find(br => br.id === ri.baseRoomId);
                        if (!baseRoom || baseRoom.type === 'hostel') continue;
                        
                        let existingRoom = dayData.find(r => r.baseId === baseRoom.id);
                        if (existingRoom && existingRoom.status !== 'free') {
                            // It is occupied. Is it a ghost block?
                            let cName = (existingRoom.clientName || '').toLowerCase();
                            let isGhost = existingRoom.isIcal || cName.includes('verifica') || cName.includes('misterplan') || cName.includes('force_update') || cName.includes('reserv');
                            if (!isGhost) {
                                // Real reservation is there, don't overwrite!
                                roomConflict = true;
                                break;
                            }
                        }
                    }

                    if (roomConflict) {
                        console.log("Skipping reservation because room is already occupied by a real reservation:", res.clientName);
                        continue;
                    }
                    
                    
                    for (let ri of res.rooms) {
                        let baseRoom = null;
                        if (ri.baseRoomId) {
                            baseRoom = appState.baseRooms.find(br => br.id === ri.baseRoomId);
                        } else if (ri.qty > 0 && ri.rawName && (ri.rawName.toLowerCase().includes('cama') || ri.rawName.toLowerCase().includes('liter') || ri.rawName.toLowerCase().includes('albergue') || ri.rawName.toLowerCase().includes('compartida'))) {
                            baseRoom = appState.baseRooms.find(br => br.type === 'hostel');
                        }
                        
                        if (!baseRoom) continue;
                        
                        let o = res.ota || '';
                        
                                let oLower = o.trim().toLowerCase();
                                let matched = false;
                                if(oLower && appState && appState.agencies) {
                                    let bestMatch = appState.agencies.find(a => oLower.includes(a.name.toLowerCase()) || a.name.toLowerCase().includes(oLower));
                                    if(bestMatch) { o = bestMatch.name; matched = true; }
                                }
                                if(!matched && oLower) {
                                    if(oLower.includes('booking')) o = 'Booking.com';
                                    else if(oLower.includes('hostelworld')) o = 'HostelWorld';
                                    else if(oLower.includes('pitchup')) o = 'Pitchup';
                                    else if(oLower.includes('expedia')) o = 'Expedia';
                                    else if(oLower.includes('airbnb')) o = 'Airbnb';
                                }

                        
                        if (baseRoom.type === 'hostel') {
                            let qty = ri.qty || 1;
                            let allHostelBases = appState.baseRooms.filter(br => br.type === 'hostel');
                            let allAvailableBeds = [];
                            
                            for (let hb of allHostelBases) {
                                let beds = dayData.filter(r => r.baseId === hb.id);
                                if (beds.length === 0) {
                                    for (let i = 1; i <= (hb.totalBeds || 16); i++) {
                                        let literaNum = Math.ceil(i / 2);
                                        let isTop = (i % 2 === 0);
                                        let bedCode = `${literaNum}${isTop ? 'A' : 'B'}`;
                                        beds.push({ id: `${hb.id}_${bedCode}`, bedId: bedCode, status: 'free', baseId: hb.id });
                                    }
                                }
                                
                                let icalBeds = beds.filter(b => b.status !== 'free' && (b.isIcal || (b.clientName && (b.clientName.includes('Verifica') || b.clientName.includes('misterplan') || b.clientName.includes('FORCE_UPDATE') || b.clientName.includes('Reserv')))));
                                for (let ib of icalBeds) {
                                    let freeRoom = createEmptyRoomObject(hb.id, hb.number, hb.roomName, 'bed', ib.bedId);
                                    freeRoom.status = 'free';
                                    freeRoom.clientName = '';
                                    updatedRooms.push(freeRoom);
                                    ib.status = 'free';
                                    ib.clientName = '';
                                }
                                
                                let availableInThisRoom = beds.filter(b => b.status === 'free' || !b.clientName);
                                availableInThisRoom.forEach(b => b._hb = hb);
                                allAvailableBeds.push(...availableInThisRoom);
                            }
                            
                            allAvailableBeds.sort((a, b) => {
                                if (a.baseId !== b.baseId) return a.baseId.localeCompare(b.baseId);
                                return a.bedId.localeCompare(b.bedId);
                            });
                            
                            let bedsToAssign = allAvailableBeds.slice(0, qty);
                            if (bedsToAssign.length < qty) {
                                console.log("Aviso: Non hai suficientes camas libres no albergue para:", res.clientName);
                            }
                            
                            for (let bed of bedsToAssign) {
                                let hb = bed._hb;
                                let uRoom = createEmptyRoomObject(hb.id, hb.number, hb.roomName, 'bed', bed.bedId);
                                uRoom.status = 'reserved';
                                uRoom.clientName = res.clientName;
                                uRoom.checkIn = res.checkIn;
                                uRoom.checkOut = res.checkOut;
                                uRoom.price = ri.roomPrice / qty;
                                uRoom.agency = o;
                                uRoom.clientPhone = res.phone || '';
                            uRoom.guests = (baseRoom && baseRoom.type === 'hostel') ? 1 : (ri.pax || res.pax || res.guests || ri.qty || 1);
                            updatedRooms.push(uRoom);
                                bed.status = 'reserved';
                                bed.clientName = res.clientName;
                            }
                        } else {
                            let uRoom = createEmptyRoomObject(baseRoom.id, baseRoom.number, baseRoom.roomName, baseRoom.type);
                            uRoom.status = 'reserved';
                            uRoom.clientName = res.clientName;
                            uRoom.checkIn = res.checkIn;
                            uRoom.checkOut = res.checkOut;
                            uRoom.price = ri.roomPrice;
                            uRoom.agency = o;
                            uRoom.clientPhone = res.phone || '';
                            uRoom.guests = (ri.pax || res.pax || res.guests || ri.qty || 1);
                            updatedRooms.push(uRoom);
                        }
                    }

                    
                    if (updatedRooms.length > 0) {
                        let totalUnits = updatedRooms.length;
                        for (let uRoom of updatedRooms) {
                            uRoom.observations = res.observations || '';
                            if(res.services && totalUnits > 0) {
                                uRoom.services = {
                                    breakfast: {qty: Math.floor((res.services.breakfast?.qty || 0)/totalUnits) || ((res.services.breakfast?.qty || 0) > 0 ? 1 : 0), price: (res.services.breakfast?.price || 0)/totalUnits},
                                    dinner: {qty: Math.floor((res.services.dinner?.qty || 0)/totalUnits) || ((res.services.dinner?.qty || 0) > 0 ? 1 : 0), price: (res.services.dinner?.price || 0)/totalUnits},
                                    picnic: {qty: Math.floor((res.services.picnic?.qty || 0)/totalUnits) || ((res.services.picnic?.qty || 0) > 0 ? 1 : 0), price: (res.services.picnic?.price || 0)/totalUnits},
                                    halfBoard: {qty: Math.floor((res.services.halfBoard?.qty || 0)/totalUnits) || ((res.services.halfBoard?.qty || 0) > 0 ? 1 : 0), price: (res.services.halfBoard?.price || 0)/totalUnits},
                                    fullBoard: {qty: Math.floor((res.services.fullBoard?.qty || 0)/totalUnits) || ((res.services.fullBoard?.qty || 0) > 0 ? 1 : 0), price: (res.services.fullBoard?.price || 0)/totalUnits},
                                    laundry: {active: false, price: 0},
                                    mochilas: {qty: 0, price: 0},
                                    outros: {qty: 0, price: 0},
                                    parking: false,
                                    taxi: false
                                };
                            }
                            
                            
                            // We will do the multi-day merge after the rooms loop!
                            // Just tracking it here.
                            let existingIdx = dayData.findIndex(d => d.id === uRoom.id);
                            if (existingIdx > -1) {
                                dayData[existingIdx] = uRoom;
                            } else {
                                dayData.push(uRoom);
                            }

                        }
                        
                        
                        // We must save the local state BEFORE propagarReserva, just in case!
                        
                        // LOCAL MULTI-DAY PROPAGATION
                        let inDate = new Date(res.checkIn);
                        let outDate = new Date(res.checkOut);
                        if (isNaN(inDate.getTime()) || isNaN(outDate.getTime()) || outDate <= inDate) {
                            outDate = new Date(inDate);
                            outDate.setDate(outDate.getDate() + 1);
                        }
                        
                        let iterD = new Date(inDate);
                        while(iterD < outDate) {
                            let dStr = iterD.toISOString().split('T')[0];
                            if (!appState.dailyData[dStr]) {
                                // Basic generation if missing
                                appState.dailyData[dStr] = [];
                                appState.baseRooms.forEach(base => {
                                    if (base.type === 'hostel') {
                                        for (let i = 1; i <= (base.totalBeds || 16); i++) {
                                            let bedCode = Math.ceil(i/2) + (i%2===0?'A':'B');
                                            let newBed = createEmptyRoomObject(base.id, base.number, base.roomName, 'bed', bedCode);
                                            newBed.price = base.bedPrice || 15;
                                            appState.dailyData[dStr].push(newBed);
                                        }
                                    } else {
                                        appState.dailyData[dStr].push(createEmptyRoomObject(base.id, base.number, base.roomName, base.type));
                                    }
                                });
                            }
                            
                            // Merge updatedRooms into this day
                            for (let uRoom of updatedRooms) {
                                let idx = appState.dailyData[dStr].findIndex(d => d.id === uRoom.id);
                                if (idx > -1) {
                                    appState.dailyData[dStr][idx] = JSON.parse(JSON.stringify(uRoom));
                                } else {
                                    appState.dailyData[dStr].push(JSON.parse(JSON.stringify(uRoom)));
                                }
                            }
                            
                            if (typeof google === 'undefined' || !google.script) {
                                if (dStr === currentPlaningDate) salvarDiaNoServidor();
                            }
                            iterD.setDate(iterD.getDate() + 1);
                        }
                        
                        appState.dailyData[res.checkIn] = dayData; // keep dayData ref intact for this day just in case
                    }
                }
                
                // 4. Save all modified dates in parallel
                if (typeof google !== 'undefined' && google.script) {
                    let savePromises = Array.from(datesNeeded).map(d => {
                        return new Promise(resolve => {
                            google.script.run.withSuccessHandler(resolve).withFailureHandler(resolve)
                                .saveDayData(d, JSON.stringify(appState.dailyData[d]));
                        });
                    });
                    await Promise.all(savePromises);
                    successCount = window.pendingAIParsedReservations.length;
                } else {
                    successCount = window.pendingAIParsedReservations.length;
                }
                cAlert(`📋 Importación completada! Gardáronse ${successCount} reservas.`);
                
                let modal = document.getElementById('importListModal');
                if (modal) modal.classList.remove('active');
                document.getElementById('importListTextarea').value = '';
                document.getElementById('importSummaryBox').classList.add('hidden');
                document.getElementById('btnProcessImportAI').disabled = true;
                document.getElementById('btnProcessImportAI').classList.add('opacity-50', 'cursor-not-allowed');
                
                if (typeof google !== 'undefined' && google.script) {
                    const reloadRes = await new Promise((resolve) => {
                        google.script.run
                            .withSuccessHandler(resolve)
                            .withFailureHandler(resolve)
                            .getInitialData(currentPlaningDate);
                    });
                    if (reloadRes && reloadRes.dayData) {
                        appState.dailyData[currentPlaningDate] = reloadRes.dayData;
                        appState.dailyData[currentPlaningDate].forEach(patchRoomServices);
                    }
                    xerarDiaSeNonExiste();
                    renderGrid();
                    filterGrid();
                } else {
                    window.location.reload();
                }
            } catch (err) {
                console.error("Erro importando con IA:", err);
                cAlert("❌ Produciuse un erro gardando as reservas na base de datos.");
            }
            hideLoader();
        };





        window.autoAssignIcal = async function(resObj) {
            return new Promise((resolve, reject) => {
                if (typeof firebaseBackend !== 'undefined' && firebaseBackend.autoAssignReservation) {
                    firebaseBackend.autoAssignReservation(resObj).then(res => {
                        if(res && res.error) reject(new Error(res.message)); else resolve(res);
                    }).catch(reject);
                } else if (typeof google !== 'undefined' && google.script) {
                    google.script.run.withSuccessHandler(res => {
                        resolve(res);
                    }).withFailureHandler(err => {
                        reject(err);
                    }).autoAssignReservation(resObj);
                } else {
                    reject(new Error("Backend non dispoñible"));
                }
            });
        };

        
        

        window.prepararAsignacionCorreo = function(idx) {
            const r = window.inboxReservas[idx];
            
            if (r.checkIn) {
                document.getElementById('planingDate').value = r.checkIn;
                changePlaningDate();
            }
            
            closeModal('inboxModal');
            
            setTimeout(() => {
                cAlert("✅ Selecciona a habitación ou cama no Planing para asignar a reserva de: " + r.clientName + ".\nAo facer clic no oco, autocompletaranse os datos.");
                window.pendingMailAssign = r;
            }, 500);
        };
