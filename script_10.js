
        
        let emailScrollInterval;
        function startEmailAutoScroll() {
            stopEmailAutoScroll();
            const list = document.getElementById('pendingEmailsList');
            emailScrollInterval = setInterval(() => {
                if(list.scrollTop + list.clientHeight >= list.scrollHeight) {
                    list.scrollTop = 0; // go back to top when reaching bottom
                } else {
                    list.scrollTop += 1;
                }
            }, 15); // speed of scroll
        }
        function stopEmailAutoScroll() {
            clearInterval(emailScrollInterval);
        }
        
        document.getElementById('pendingEmailsList').addEventListener('mouseenter', stopEmailAutoScroll);
        document.getElementById('pendingEmailsList').addEventListener('mouseleave', startEmailAutoScroll);
        document.getElementById('pendingEmailsList').addEventListener('touchstart', stopEmailAutoScroll);
        document.getElementById('pendingEmailsList').addEventListener('touchend', startEmailAutoScroll);

        // Minimize/Maximize
        let emailsWidgetMinimized = false;
        function toggleEmailsMinMax() {
            emailsWidgetMinimized = !emailsWidgetMinimized;
            const body = document.getElementById('widgetEmailsBody');
            const btn = document.getElementById('widgetMinMaxBtn');
            if (emailsWidgetMinimized) {
                body.style.display = 'none';
                btn.style.transform = 'rotate(-90deg)';
            } else {
                body.style.display = 'flex';
                btn.style.transform = 'rotate(0deg)';
                if (currentPendingEmails.length === 0 && !document.getElementById('pendingEmailsLoader').classList.contains('flex')) {
                    loadPendingEmails();
                }
            }
        }

        
        window.printPlanningA4 = function() {
    const currentDate = document.getElementById('planingDate').value;
    let dia = appState.dailyData[currentDate] || [];
    
    let htmlContent = '';
    let groups = {};
    appState.baseRooms.forEach(base => {
        let cat = base.roomName || 'Aloxamento';
        if (!groups[cat]) groups[cat] = { color: base.zoneColor || '#e2e8f0', items: [] };
        groups[cat].items.push(base);
    });
    
    Object.keys(groups).sort().forEach(cat => {
        const group = groups[cat];
        htmlContent += `
            <div class="mb-6 print-group">
                <h2 class="text-lg font-black text-slate-800 uppercase border-b-2 border-slate-300 mb-2 pb-1 flex items-center gap-2">
                    <div class="w-4 h-4 rounded-full border border-slate-400 shadow-sm" style="background-color: ${group.color}"></div>
                    ${cat}
                </h2>
                <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        `;
        
        group.items.forEach(base => {
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
                        
                        return `
                            <div class="border rounded-md p-1.5 ${bgClass} flex flex-col justify-between" style="min-height: 55px;">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-[9px] uppercase font-bold text-slate-500">${label}</span>
                                    <span class="text-[9px] font-black ${textClass}">${statusText}</span>
                                </div>
                                <div class="text-[11px] font-bold text-slate-800 leading-tight truncate">${bed.clientName || ''}</div>
                                <div class="text-[10px] font-black text-slate-700 text-right mt-1">${bed.price > 0 ? bed.price+'€' : ''}</div>
                            </div>
                        `;
                    };
                    
                    bedsHtml += `
                        <div class="flex flex-col gap-1.5 p-1.5 bg-slate-100 rounded-lg border border-slate-300 shadow-inner break-inside-avoid">
                            <div class="text-[10px] font-black text-center text-slate-700 bg-slate-200 rounded px-1 uppercase tracking-wider">Lit. ${litNum}</div>
                            ${renderPrintBed(topBed, 'Alta')}
                            ${renderPrintBed(botBed, 'Baixa')}
                        </div>
                    `;
                });
                
                htmlContent += `
                    <div class="col-span-2 sm:col-span-3 border-2 border-blue-200 bg-blue-50/30 rounded-xl overflow-hidden shadow-sm flex flex-col break-inside-avoid">
                        <div class="bg-blue-100 border-b border-blue-200 p-2 flex justify-between items-center">
                            <h3 class="font-black text-blue-900 text-sm flex items-center gap-1">🛏️ ${base.number} - ${base.roomName}</h3>
                            <span class="text-xs bg-white text-blue-800 px-2 py-0.5 rounded shadow-sm font-bold">ALBERGUE</span>
                        </div>
                        <div class="p-2 grid grid-cols-3 sm:grid-cols-4 gap-2 flex-grow">
                            ${bedsHtml}
                        </div>
                    </div>
                `;
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
                
                htmlContent += `
                    <div class="col-span-1 rounded-xl border-2 ${bgStatus} shadow-sm flex flex-col h-full bg-white relative overflow-hidden break-inside-avoid" style="min-height: 120px;">
                        <div class="absolute left-0 top-0 bottom-0 w-2 ${barColor}"></div>
                        <div class="pl-3 p-2 flex flex-col h-full z-10">
                            <div class="flex justify-between items-start mb-1">
                                <span class="text-[10px] font-black text-slate-700 uppercase truncate">${icon} ${room.roomName || 'Aloxamento'}</span>
                                <span class="text-[9px] font-bold ${badgeColor} px-1.5 py-0.5 rounded border">${statusText}</span>
                            </div>
                            <div class="text-2xl font-black text-slate-900 leading-none mb-1">${room.number}</div>
                            
                            <div class="flex flex-wrap gap-1 mb-1">
                                <span class="text-[9px] bg-slate-100 border border-slate-200 text-slate-800 px-1 rounded truncate max-w-[80%]">${room.bedConfig}</span>
                                <span class="text-[9px] bg-blue-50 border border-blue-200 text-blue-800 px-1 rounded">👤 ${room.guests || 1}</span>
                            </div>
                            
                            <div class="mt-auto pt-2">
                                <div class="text-xs font-black text-slate-800 leading-tight truncate">${room.clientName || ''}</div>
                                ${room.agency ? `<div class="text-[10px] font-bold text-blue-700 mt-0.5 truncate">🏢 ${room.agency}</div>` : ''}
                                <div class="flex justify-between items-end mt-1">
                                    <div class="text-[9px] text-slate-500 italic truncate w-[70%]">${room.observations ? '📝 ' + room.observations : ''}</div>
                                    <div class="text-[11px] font-black ${isFree ? 'opacity-0' : 'text-slate-800'}">${room.price || 0}€</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
        
        htmlContent += `
                </div>
            </div>
        `;
    });

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="gl">
        <head>
            <title>Planning A4 - ${currentDate}</title>
            <script src="https://cdn.tailwindcss.com"><\/script>
            <style>
                body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 10px; font-family: sans-serif; }
                @page { size: A4 landscape; margin: 8mm; }
                .print-header { text-align: center; margin-bottom: 15px; font-size: 22px; font-weight: 900; color: #1e293b; border-bottom: 3px solid #e2e8f0; padding-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
                .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
                .print-group { page-break-inside: auto; }
            </style>
        </head>
        <body>
            <div class="print-header">PLANNING DIARIO - ${currentDate.split('-').reverse().join('/')}</div>
            ${htmlContent}
            <script>
                window.onload = () => {
                    setTimeout(() => {
                        window.print();
                        window.close();
                    }, 1000);
                };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
};



        // Minimize/Maximize and Close
        function closeEmailsWidget() {
            document.getElementById('draggableEmailsWidget').style.display = 'none';
            document.getElementById('reopenEmailsFab').style.display = 'flex';
        }
        function openEmailsWidget() {
            document.getElementById('reopenEmailsFab').style.display = 'none';
            const w = document.getElementById('draggableEmailsWidget');
            w.style.display = 'flex';
            if (emailsWidgetMinimized) toggleEmailsMinMax();
            if (currentPendingEmails.length === 0) loadPendingEmails(true);
        }
        // Draggable Logic
        const dragWidget = document.getElementById('draggableEmailsWidget');
        const dragHeader = document.getElementById('draggableEmailsHeader');
        let isWidgetDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        dragHeader.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return; // Don't drag if clicking buttons
            isWidgetDragging = true;
            dragOffsetX = e.clientX - dragWidget.getBoundingClientRect().left;
            dragOffsetY = e.clientY - dragWidget.getBoundingClientRect().top;
            dragWidget.style.transition = 'none'; // Disable transition while dragging
            
            // Set fixed dimensions so it doesn't collapse
            dragWidget.style.width = dragWidget.offsetWidth + 'px';
            if(!emailsWidgetMinimized) dragWidget.style.height = dragWidget.offsetHeight + 'px';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isWidgetDragging) return;
            let newX = e.clientX - dragOffsetX;
            let newY = e.clientY - dragOffsetY;
            
            // Keep within bounds
            newX = Math.max(0, Math.min(newX, window.innerWidth - dragWidget.offsetWidth));
            newY = Math.max(0, Math.min(newY, window.innerHeight - dragWidget.offsetHeight));
            
            dragWidget.style.right = 'auto';
            dragWidget.style.bottom = 'auto';
            dragWidget.style.left = newX + 'px';
            dragWidget.style.top = newY + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isWidgetDragging) {
                isWidgetDragging = false;
                dragWidget.style.transition = 'all 0.3s';
            }
        });
    
        let qrVideo = document.createElement("video");
        let qrCanvasElement, qrCanvas, qrScanning = false, qrScanStream = null;
        let lastScannedData = null;

        window.openQrScanner = function() {
            document.getElementById('qrScannerModal').classList.add('active');
            qrCanvasElement = document.getElementById("qrCanvas");
            qrCanvas = qrCanvasElement.getContext("2d");
            document.getElementById('qrResultPanel').classList.add('hidden');
            document.getElementById('qrBtnNext').classList.add('hidden');
            document.getElementById('qrBtnValidate').classList.remove('hidden');
            document.getElementById('qrStatusBox').className = "mb-4 p-4 rounded-xl border bg-indigo-50 border-indigo-200 text-indigo-800 font-bold text-center";
            document.getElementById('qrStatusBox').innerText = "Apunta o QR do tícket cara a cámara...";
            
            qrScanning = true;
            navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
                qrScanStream = stream;
                qrVideo.srcObject = stream;
                qrVideo.setAttribute("playsinline", true);
                qrVideo.play();
                requestAnimationFrame(tickQr);
            }).catch(err => {
                cAlert("Erro ao acceder á cámara: " + err.message);
            });
        };

        window.stopQrScanner = function() {
            document.getElementById('qrScannerModal').classList.remove('active');
            qrScanning = false;
            if (qrScanStream) {
                qrScanStream.getTracks().forEach(track => track.stop());
            }
        };
        
        window.resumeQrScanner = function() {
            document.getElementById('qrResultPanel').classList.add('hidden');
            document.getElementById('qrBtnNext').classList.add('hidden');
            document.getElementById('qrBtnValidate').classList.remove('hidden');
            document.getElementById('qrBtnValidate').innerText = "✅ VALIDAR CONSUMICIÓN";
            document.getElementById('qrStatusBox').className = "mb-4 p-4 rounded-xl border bg-indigo-50 border-indigo-200 text-indigo-800 font-bold text-center";
            document.getElementById('qrStatusBox').innerText = "Apunta o QR do tícket cara a cámara...";
            qrScanning = true;
            requestAnimationFrame(tickQr);
        };

        function tickQr() {
            if (!qrScanning) return;
            if (qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA) {
                qrCanvasElement.height = qrVideo.videoHeight;
                qrCanvasElement.width = qrVideo.videoWidth;
                qrCanvas.drawImage(qrVideo, 0, 0, qrCanvasElement.width, qrCanvasElement.height);
                var imageData = qrCanvas.getImageData(0, 0, qrCanvasElement.width, qrCanvasElement.height);
                
                if (typeof jsQR !== 'undefined') {
                    var code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert",
                    });
                    
                    if (code && code.data && code.data.startsWith('XAC|')) {
                        qrScanning = false; // Stop scanning momentarily
                        processScannedQr(code.data);
                        return;
                    }
                }
            }
            requestAnimationFrame(tickQr);
        }

        
        // Check if loaded with a ?qr= parameter via smartphone camera
        
        window.addEventListener('DOMContentLoaded', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const qrParam = urlParams.get('qr');
            if (qrParam) {
                // Hide the main app and login overlay entirely
                document.body.style.overflow = 'hidden';
                if(document.getElementById('loginOverlay')) document.getElementById('loginOverlay').style.display = 'none';
                if(document.getElementById('mainHeader')) document.getElementById('mainHeader').style.display = 'none';
                if(document.getElementById('roomGrid')) document.getElementById('roomGrid').style.display = 'none';
                
                // Pop the QR modal over everything
                const modal = document.getElementById('qrScannerModal');
                if (modal) {
                    modal.style.display = 'flex';
                    modal.classList.add('active');
                    modal.style.zIndex = '99999999'; // ensure on top
                }
                const canvasEl = document.getElementById('qrCanvas');
                if (canvasEl) {
                    canvasEl.parentElement.classList.add('hidden');
                }
                
                // Show a mini password prompt just for QR validation
                // Unhide the panel so the password prompt is visible
                const panel = document.getElementById('qrResultPanel');
                if (panel) panel.classList.remove('hidden');
                
                const statusEl = document.getElementById('qrStatusBox');
                if (statusEl) {
                    statusEl.innerHTML = `<div class="flex flex-col gap-3 items-center w-full">
                        <p class="text-sm font-black text-slate-800">CÓDIGO DE ACCESO</p>
                        <input type="password" id="qrPass" placeholder="Contrasinal..." class="p-3 border rounded-xl font-bold w-full text-center text-xl shadow-inner outline-none">
                        <button onclick="checkQrPass('${qrParam}')" class="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-3 rounded-xl shadow-lg transition transform hover:scale-105">Acceder</button>
                    </div>`;
                }
            }
        });
        
        window.checkQrPass = function(qrParam) {
            const pass = document.getElementById('qrPass').value;
            if(pass === 'xacobeo' || pass.toLowerCase() === 'xacobeo') {
                document.getElementById('qrStatusBox').innerText = "Procesando código...";
                setTimeout(() => {
                    processScannedQr(decodeURIComponent(atob(qrParam)));
                }, 100);
            } else {
                cAlert("Contrasinal incorrecto");
            }
        };

        window.processScannedQr = async function(dataStr) {
            // XAC|currentPlaningDate|room.id|tipo|qty
            const parts = dataStr.split('|');
            if (parts.length < 5) {
                cAlert("QR non válido.");
                resumeQrScanner();
                return;
            }
            
            const date = parts[1];
            const roomId = parts[2];
            const tipo = parts[3];
            const qty = parts[4];
            
            lastScannedData = { date, roomId, tipo, qty };
            
            // Try to find local room name if available
            let rName = roomId;
            let cName = "Hóspede";
            
            try {
                if (!appState.dailyData) appState.dailyData = {};
                
                // If we don't have the data, try to fetch it from backend
                if (!appState.dailyData[date] && typeof firebaseBackend !== 'undefined') {
                    document.getElementById('qrStatusBox').innerText = "Cargando datos da habitación...";
                    const dayData = await firebaseBackend.getInitialData(date);
                    if (dayData && dayData.dayData) {
                        appState.dailyData[date] = dayData.dayData;
                    }
                }
                
                // Extra fallback if we still don't have the specific room (could be from another establishment)
                if (appState.dailyData[date] && !appState.dailyData[date].find(r => r.id === roomId)) {
                     // try to look inside config.baseRooms or something if necessary? 
                }
                
                if (appState.dailyData[date]) {
                    const rm = appState.dailyData[date].find(r => r.id === roomId);
                    if (rm) {
                        rName = rm.bedId ? rm.number+'-'+rm.bedId : rm.number;
                        cName = rm.clientName || cName;
                    }
                }
            } catch (e) {
                console.warn("Failed to fetch day data for QR:", e);
            }
            
            document.getElementById('qrResTitle').innerText = "HABITACIÓN " + rName;
            document.getElementById('qrResSubtitle').innerText = "Hóspede: " + cName + " (" + date + ")";
            document.getElementById('qrResType').innerText = tipo;
            document.getElementById('qrResQty').innerText = qty + " Pax";
            
            let icon = '🎟️';
            if(tipo.includes('Almorzo')) icon = '☕';
            else if(tipo.includes('Cea')) icon = '🍽️';
            else if(tipo.includes('Picnic')) icon = '🎒';
            else if(tipo.includes('Pensión')) icon = '⭐';
            document.getElementById('qrResIcon').innerText = icon;
            
            document.getElementById('qrResultPanel').classList.remove('hidden');
            if (document.getElementById('qrResTopDetails')) {
                document.getElementById('qrResTopDetails').classList.remove('hidden');
            }
            
            document.getElementById('qrStatusBox').className = "mb-4 p-4 rounded-xl border bg-yellow-50 border-yellow-200 text-yellow-800 font-bold text-center";
            document.getElementById('qrStatusBox').innerText = "⏳ Comprobando estado na base de datos...";
            document.getElementById('qrBtnValidate').disabled = true;
            document.getElementById('qrBtnValidate').classList.add('opacity-50');
            
            // Check if consumed
            if (typeof firebaseBackend !== 'undefined' && firebaseBackend.getConsumptions) {
                const consumptions = await firebaseBackend.getConsumptions(date);
                const key = roomId + "_" + tipo;
                if (consumptions[key]) {
                    const c = consumptions[key];
                    const time = new Date(c.consumedAt).toLocaleTimeString('gl-ES', {hour: '2-digit', minute:'2-digit'});
                    document.getElementById('qrStatusBox').className = "mb-4 p-4 rounded-xl border bg-red-100 border-red-300 text-red-800 font-black text-center text-lg shadow-sm";
                    document.getElementById('qrStatusBox').innerHTML = `❌ XA CONSUMIDO<br><span class="text-sm font-bold text-red-600">Ás ${time} por ${c.validatedBy}</span>`;
                    document.getElementById('qrBtnValidate').classList.add('hidden');
                    document.getElementById('qrBtnNext').classList.remove('hidden');
                } else {
                    document.getElementById('qrStatusBox').className = "mb-4 p-4 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-800 font-bold text-center";
                    document.getElementById('qrStatusBox').innerText = "🟢 PENDENTE DE CONSUMIR";
                    document.getElementById('qrBtnValidate').disabled = false;
                    document.getElementById('qrBtnValidate').classList.remove('opacity-50');
                    document.getElementById('qrBtnValidate').classList.remove('hidden');
                }
            } else {
                document.getElementById('qrStatusBox').innerText = "⚠️ Modo Sen Conexión: PENDENTE";
                document.getElementById('qrBtnValidate').disabled = false;
                document.getElementById('qrBtnValidate').classList.remove('opacity-50');
                document.getElementById('qrBtnValidate').classList.remove('hidden');
            }
        };

        window.confirmQrValidation = async function() {
            if (!lastScannedData) return;
            const { date, roomId, tipo, qty } = lastScannedData;
            
            document.getElementById('qrBtnValidate').innerText = "Gardando...";
            document.getElementById('qrBtnValidate').disabled = true;
            
            let user = document.getElementById('receptionistName')?.value || 'Restaurante';
            if (user.toLowerCase().includes('xacobeo')) user = 'Restaurante';
            
            if (typeof firebaseBackend !== 'undefined' && firebaseBackend.validarQR) {
                const res = await firebaseBackend.validarQR(date, roomId, tipo, qty, user);
                if (res.success) {
                    document.getElementById('qrStatusBox').className = "mb-4 p-4 rounded-xl border bg-emerald-100 border-emerald-300 text-emerald-800 font-black text-center text-lg shadow-sm";
                    document.getElementById('qrStatusBox').innerHTML = `✅ CONSUMO REXISTRADO<br><span class="text-sm">Todo correcto</span>`;
                    document.getElementById('qrBtnValidate').classList.add('hidden');
                    document.getElementById('qrBtnNext').classList.remove('hidden');
                    
                    if (appState.pushConfig && appState.pushConfig.telegram) {
                         sendTelegramMsg(`🍽️ <b>Consumo QR Validado</b>\n🛏️ Hab: ${roomId}\n🎟️ ${tipo} (x${qty})\n👤 Por: ${user}`);
                    }
                } else {
                    document.getElementById('qrStatusBox').className = "mb-4 p-4 rounded-xl border bg-red-100 border-red-300 text-red-800 font-black text-center text-lg shadow-sm";
                    document.getElementById('qrStatusBox').innerText = "❌ ERRO: " + res.error;
                    document.getElementById('qrBtnValidate').innerText = "✅ VALIDAR CONSUMICIÓN";
                    document.getElementById('qrBtnValidate').disabled = false;
                }
            } else {
                document.getElementById('qrStatusBox').className = "mb-4 p-4 rounded-xl border bg-emerald-100 border-emerald-300 text-emerald-800 font-black text-center text-lg shadow-sm";
                document.getElementById('qrStatusBox').innerHTML = `✅ OK (Local Mode)`;
                document.getElementById('qrBtnValidate').classList.add('hidden');
                document.getElementById('qrBtnNext').classList.remove('hidden');
            }
        };

    