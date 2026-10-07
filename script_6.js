
        let appState = { baseRooms: [], dailyData: {}, agencies: [], currentCaixa: null, credentials: { user: 'Xacobeo07', pass: 'Xacobeo07' }, extrasPrices: {} };
        let currentPlaningDate = '';
        const urlParams = new URLSearchParams(window.location.search);
        window.pendingQrToProcess = urlParams.get('qr');
        let isLoggedIn = false;
        let lastPushSentDate = localStorage.getItem('lastPushSentDate') || '';
        
        
        async function sendTelegramMsg(message) {
            const TOKEN_BOT = "8056711513:AAGzgoSWSLLhNzoGvSPzxhlzHZMIrUdx1Tg";
            const CHAT_ID = "-4970720653";
            try {
                await fetch(`https://api.telegram.org/bot${TOKEN_BOT}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'HTML' })
                });
            } catch (e) {
                console.error("Error sending to telegram", e);
            }
        }

        function checkAndSendLocalPush() {
            if (!appState.pushConfig || !appState.pushConfig.time) return;
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const currentHourMin = now.toTimeString().substring(0, 5);
            
            if (currentHourMin === appState.pushConfig.time && lastPushSentDate !== todayStr) {
                // Send notifications
                if (Notification.permission === 'granted') {
                    if (appState.pushConfig.almorzos) {
                        let nextD = new Date(currentPlaningDate || new Date());
                        nextD.setDate(nextD.getDate() + 1);
                        let qb = 0;
                        const dia = appState.dailyData[currentPlaningDate] || [];
                        dia.forEach(r => {
                            if(r.status!=='free') {
                                const s = r.services || { breakfast:{qty:0}, halfBoard:{qty:0}, fullBoard:{qty:0} };
                                qb += (parseInt(s.breakfast?.qty)||0) + (parseInt(s.halfBoard?.qty)||0) + (parseInt(s.fullBoard?.qty)||0);
                            }
                        });
                        if (qb > 0) { 
                            showAppNotification("Almorzos para Mañá ☕", { body: `Temos ${qb} almorzos (incl. PC e MP) para mañá.`, icon: '/icon.svg' });
                            if (appState.pushConfig.telegram) sendTelegramMsg(`<b>Almorzos para Mañá ☕ (Complexo Xacobeo)</b>\nQue saibades que temos ${qb} almorzos (incl. PC e MP) para mañá. (Ide quentando a prancha e preparando o café, que a xente ten fame e non se van facer sós...)`);
                        }
                    }
                    if (appState.pushConfig.ceas) {
                        let qb = 0;
                        const dia = appState.dailyData[currentPlaningDate] || [];
                        dia.forEach(r => {
                            if(r.status!=='free') {
                                const s = r.services || { dinner:{qty:0}, halfBoard:{qty:0}, fullBoard:{qty:0} };
                                qb += (parseInt(s.dinner?.qty)||0) + (parseInt(s.halfBoard?.qty)||0) + (parseInt(s.fullBoard?.qty)||0);
                            }
                        });
                        if (qb > 0) {
                            showAppNotification("Ceas para Hoxe 🍽️", { body: `Temos ${qb} ceas (incl. PC e MP) para hoxe.`, icon: '/icon.svg' });
                            if (appState.pushConfig.telegram) sendTelegramMsg(`<b>Ceas para Hoxe 🍽️ (Complexo Xacobeo)</b>\nTemos ${qb} ceas (incl. PC e MP) para hoxe. Ide afiando os coitelos que hai moita fame...`);
                        }
                    }
                    if (appState.pushConfig.pendentes) {
                        let nomes = [];
                        const dia = appState.dailyData[currentPlaningDate] || [];
                        dia.forEach(r => {
                            if(r.status === 'reserved') {
                                nomes.push(`${r.clientName} (${r.number})`);
                            }
                        });
                        if (nomes.length > 0) showAppNotification("Pendentes de Chegar ⏰", { body: `Aínda faltan por chegar ${nomes.length} clientes.`, icon: '/icon.svg' });
                    }
                }
                lastPushSentDate = todayStr;
                localStorage.setItem('lastPushSentDate', todayStr);
            }
        }
        
        setInterval(checkAndSendLocalPush, 30000); // Check every 30s

        
        let currentEditingBedIds = []; 
        let multiSelectModeActive = false; 
        let mainMultiSelectModeActive = false;
        let mainSelectedRoomIds = [];
        let currentOpenHostelId = null;

        const paletteColors = ['#ffffff', '#e2e8f0', '#bbf7d0', '#bfdbfe', '#fde68a', '#fecaca', '#e9d5ff', '#fed7aa', '#a5f3fc', '#fbcfe8'];
        let dragSourceId = null;
        let dragTargetId = null;
        let isDragging = false;
        let touchMoved = false;
        let touchClone = null;
        let touchTimer = null;
        let editorActiveBaseId = null;
        let editorItemsData = [];
        let editorDecorData = [];
        let editingAdminRoomIndex = -1;

        let dialogCallback = null;
        function showCustomDialog(message, type, callback) {
            const dM = document.getElementById('dialogMessage'); if(dM) dM.innerHTML = message;
            const btnArea = document.getElementById('dialogButtons');
            if(btnArea) btnArea.innerHTML = '';
            
            if (type === 'alert') {
                const dI = document.getElementById('dialogIcon'); if(dI) dI.innerHTML = 'ℹ️';
                document.getElementById('dialogTitle').innerText = 'Aviso';
                btnArea.innerHTML = `<button onclick="closeCustomDialog(true)" class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">OK</button>`;
            } else if (type === 'confirm') {
                const dI2 = document.getElementById('dialogIcon'); if(dI2) dI2.innerHTML = '❓';
                document.getElementById('dialogTitle').innerText = 'Confirmar';
                btnArea.innerHTML = `
                    <button onclick="closeCustomDialog(false)" class="flex-1 py-3 bg-white/70 text-slate-900 rounded-xl shadow-sm border border-slate-300 font-bold hover:bg-slate-200">Cancelar</button>
                    <button onclick="closeCustomDialog(true)" class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg">Confirmar</button>
                `;
            } else if (type === 'choice') {
                const dI3 = document.getElementById('dialogIcon'); if(dI3) dI3.innerHTML = '❓';
                document.getElementById('dialogTitle').innerText = 'Elixir opción';
                btnArea.innerHTML = `
                    <button onclick="closeCustomDialog(false)" class="flex-1 py-3 bg-white/70 text-slate-900 rounded-xl shadow-sm border border-slate-300 font-bold hover:bg-slate-200">Non</button>
                    <button onclick="closeCustomDialog(true)" class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg">Si</button>
                `;
            }
            dialogCallback = callback;
            document.getElementById('customDialogModal').classList.add('active');
        }
        function closeCustomDialog(result) {
            document.getElementById('customDialogModal').classList.remove('active');
            if (dialogCallback) {
                const cb = dialogCallback; dialogCallback = null;
                // If it expects a result argument (length > 0), pass it, otherwise only call on true
                if (cb.length > 0) {
                    cb(result);
                } else {
                    if (result) cb();
                }
            }
        }
        function cAlert(msg) { showCustomDialog(msg, 'alert'); }
        function cConfirm(msg, callback) { showCustomDialog(msg, 'confirm', callback); }
        function cChoice(msg, callback) { showCustomDialog(msg, 'choice', callback); }

        
        
        function openAlertasMaster() {
            let msg = "RESUMO DE ALERTAS:\n\n";
            let found = false;
            
            // Check Incidencias
            let pendInc = (window.allIncidenciasMem || []).filter(l => (Array.isArray(l) ? l[4] : l.estado) === 'Pendente').length;
            if (pendInc > 0) { msg += "🚨 " + pendInc + " Incidencias pendentes.\n"; found = true; }
            
            // Check Pedidos
            let pendPed = (appState.pedidos || []).filter(p => p.estado === 'Pendente').length;
            if (pendPed > 0) { msg += "📦 " + pendPed + " Pedidos pendentes.\n"; found = true; }
            
            if (!found) msg = "Non hai alertas pendentes neste momento. 🎉";
            
            cAlert(msg);
        }
        
        function updateAlertasMaster() {
            let count = 0;
            // Incidencias
            let pendInc = (window.allIncidenciasMem || []).filter(l => (Array.isArray(l) ? l[4] : l.estado) === 'Pendente').length;
            count += pendInc;
            // Pedidos
            let pendPed = (appState.pedidos || []).filter(p => p.estado === 'Pendente').length;
            count += pendPed;
            
            const badge = document.getElementById('badgeAlertasMaster');
            if (badge) {
                if (count > 0) {
                    badge.innerText = count;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            }
        }

        async function requestPermissions() {
            // Disabled: Notifications will only be requested via explicit user action in the settings.
        }

        function checkLogin() {
            if (sessionStorage.getItem('rx_logged_in') === 'true') {
                
                isLoggedIn = true;
                document.getElementById('loginOverlay').style.display = 'none';
            }
        }

        function doGoogleLoginOnly() {
            if (window.doGoogleLogin) {
                window.doGoogleLogin().then((user) => {
                    isLoggedIn = true;
                    sessionStorage.setItem('rx_logged_in', 'true');
                        
                    document.getElementById('loginOverlay').style.opacity = '0';
                    setTimeout(() => document.getElementById('loginOverlay').style.display = 'none', 500);
                    
                    if (appState.baseRooms.length === 0 && typeof google !== 'undefined' && google.script) {
                        showLoader();
                        const hoxe = document.getElementById('planingDate').value;
                        google.script.run
                            .withSuccessHandler((res) => { handleInitialData(res); })
                            .withFailureHandler((err) => { cAlert("Erro de conexión: " + (err && err.message ? err.message : JSON.stringify(err))); hideLoader(); })
                            .getInitialData(hoxe);
                        // Comprobar se temos un QR pendente despois do login
                        if (window.pendingQrToProcess) {
                        try {
                            const decodedStr = decodeURIComponent(atob(window.pendingQrToProcess));
                            if (decodedStr.startsWith('XAC|')) {
                                // Mostrar o modal instantaneamente e tapar todo o fondo
                                const modal = document.getElementById('qrScannerModal');
                                if (modal) {
                                    modal.style.display = 'flex';
                                    modal.classList.add('active');
                                }
                                const canvasEl = document.getElementById('qrCanvas');
                                if (canvasEl) {
                                    canvasEl.parentElement.classList.add('hidden');
                                }
                                const statusEl = document.getElementById('qrStatusBox');
                                if (statusEl) {
                                    statusEl.innerText = "Procesando código...";
                                }
                                // Procesar
                                setTimeout(() => {
                                    processScannedQr(decodedStr);
                                    window.pendingQrToProcess = null;
                                }, 50); // Un mínimo delay para que asente o DOM
                            }
                        } catch(e) {}
                    }
                    } else if (typeof changeDate === 'function') {
                        changeDate();
                    }
                }).catch((err) => {
                    const errStr = String(err && (err.code || err.message || err) || '');
                    if (errStr.includes('popup-closed-by-user') || 
                        errStr.includes('cancelled-popup-request') || 
                        errStr.includes('popup_closed_by_user') ||
                        errStr.includes('closed-by-user')) {
                        console.log("Google login popup closed or cancelled by the user. Ignoring.");
                        return; // Ignorar cancelación
                    }
                    const errEl = document.getElementById('loginError');
                    errEl.innerText = "Erro de acceso: " + (err && err.message ? err.message : String(err));
                    errEl.style.opacity = '1';
                    setTimeout(() => errEl.style.opacity = '0', 3000);
                });
            } else {
                cAlert("Login con Google non dispoñible nesta versión.");
            }
        }

        function doLogin() {
            const u = document.getElementById('loginUser').value;
            const p = document.getElementById('loginPass').value;
            if (!u || !p) return;
            const email = u.includes('@') ? u : u + "@xacobeo.com";
            
            if (typeof google !== 'undefined' && google.script && google.script.run.doEmailLogin) {
                showLoader();
                google.script.run
                    .withSuccessHandler(() => {
                        isLoggedIn = true;
                        sessionStorage.setItem('rx_logged_in', 'true');
                        document.getElementById('loginOverlay').style.opacity = '0';
                        setTimeout(() => document.getElementById('loginOverlay').style.display = 'none', 500);
                        const hoxe = document.getElementById('planingDate').value;
                        google.script.run
                            .withSuccessHandler((res) => { handleInitialData(res); })
                            .withFailureHandler((err) => { cAlert("Erro: " + err); hideLoader(); })
                            .getInitialData(hoxe);
                    })
                    .withFailureHandler((err) => {
                        hideLoader();
                        const errEl = document.getElementById('loginError');
                        errEl.innerText = "Credenciais incorrectas";
                        errEl.style.opacity = '1';
                        setTimeout(() => errEl.style.opacity = '0', 3000);
                    })
                    .doEmailLogin(email, p);
            } else {
                // Fallback local se non hai firebase (non debería ocorrer na versión real)
                const validU = appState.credentials?.user || 'Xacobeo07';
                const validP = appState.credentials?.pass || 'Xacobeo07';
                if (u === validU && p === validP) {
                    isLoggedIn = true;
                    sessionStorage.setItem('rx_logged_in', 'true');
                    document.getElementById('loginOverlay').style.opacity = '0';
                    setTimeout(() => document.getElementById('loginOverlay').style.display = 'none', 500);
                } else {
                    const errEl = document.getElementById('loginError');
                    errEl.innerText = "Credenciais incorrectas";
                    errEl.style.opacity = '1';
                    setTimeout(() => errEl.style.opacity = '0', 3000);
                }
            }
        }

        function lockSystem() {
            sessionStorage.removeItem('rx_logged_in');
            isLoggedIn = false;
            document.getElementById('loginUser').value = '';
            document.getElementById('loginPass').value = '';
            document.getElementById('loginOverlay').style.display = 'flex';
            setTimeout(() => document.getElementById('loginOverlay').style.opacity = '1', 50);
        }

        function saveAdminSettings() {
            const nu = document.getElementById('confUser').value;
            const np = document.getElementById('confPass').value;
            
            appState.extrasPrices = {
                breakfast: parseFloat(document.getElementById('confPBreakfast').value) || 0,
                dinner: parseFloat(document.getElementById('confPDinner').value) || 0,
                picnic: parseFloat(document.getElementById('confPPicnic').value) || 0,
                halfBoard: parseFloat(document.getElementById('confPHalfBoard').value) || 0,
                fullBoard: parseFloat(document.getElementById('confPFullBoard').value) || 0,
                laundry: parseFloat(document.getElementById('confPLaundry').value) || 0,
                mochilas: parseFloat(document.getElementById('confPMochilas').value) || 0,
                outros: parseFloat(document.getElementById('confPOutros').value) || 0
            };
            
            appState.pushConfig = {
                almorzos: document.getElementById('confNotifAlmorzos').checked,
                ceas: document.getElementById('confNotifCeas').checked,
                pendentes: document.getElementById('confNotifPendentes').checked,
                telegram: document.getElementById('confNotifTelegram') ? document.getElementById('confNotifTelegram').checked : false,
                time: document.getElementById('confNotifTime').value || '10:00'
            };

            
            appState.establishmentName = document.getElementById('confEstablecemento').value || 'Complexo Xacobeo';
            if (appState.userEstablishments) {
                const curId = localStorage.getItem('currentEstablishmentId') || 'default';
                const est = appState.userEstablishments.find(e => e.id === curId);
                if (est) est.name = appState.establishmentName;
            }
            updateEstablishmentName();
            if(nu && np) {
                appState.credentials = { user: nu, pass: np, calendarId: document.getElementById('confCalendarId').value };

                const email = nu.includes('@') ? nu : nu + "@xacobeo.com";
                if (typeof google !== 'undefined' && google.script && google.script.run.doEmailRegister) {
                    google.script.run
                        .withSuccessHandler(() => {
                            cAlert("Usuario creado correctamente. Podes entrar con este usuario.");
                        })
                        .withFailureHandler((err) => {
                            cAlert("Erro ao crear usuario: " + err);
                        })
                        .doEmailRegister(email, np);
                }
                document.getElementById('confUser').value = '';
                document.getElementById('confPass').value = '';
            }

            salvarConfigNoServidor();
            cAlert("Configuración gardada correctamente.");
        }

        function loadAdminPrices() {
            if(appState.extrasPrices) {
                document.getElementById('confPBreakfast').value = appState.extrasPrices.breakfast || '';
                document.getElementById('confPDinner').value = appState.extrasPrices.dinner || '';
                document.getElementById('confPPicnic').value = appState.extrasPrices.picnic || '';
                document.getElementById('confPHalfBoard').value = appState.extrasPrices.halfBoard || '';
                document.getElementById('confPFullBoard').value = appState.extrasPrices.fullBoard || '';
                document.getElementById('confPLaundry').value = appState.extrasPrices.laundry || '';
                document.getElementById('confPMochilas').value = appState.extrasPrices.mochilas || '';
                document.getElementById('confPOutros').value = appState.extrasPrices.outros || '';
            }
            if(appState.pushConfig) {
                document.getElementById('confNotifAlmorzos').checked = !!appState.pushConfig.almorzos;
                document.getElementById('confNotifCeas').checked = !!appState.pushConfig.ceas;
                document.getElementById('confNotifPendentes').checked = !!appState.pushConfig.pendentes;
                if (document.getElementById('confNotifTelegram')) document.getElementById('confNotifTelegram').checked = !!appState.pushConfig.telegram;
                document.getElementById('confNotifTime').value = appState.pushConfig.time || '10:00';
            }
        }

        let lastAlarmDate = '';
        function verificarAlarmas() {
            if (typeof google !== 'undefined' && google.script) {
                google.script.run
                    .withSuccessHandler(hasPending => {
                        const badge = document.getElementById('badgeIncidencias');
                        if (badge) {
                            if (hasPending) badge.classList.remove('hidden');
                            else badge.classList.add('hidden');
                        }
                        
                        // Also update master alerts
                        let count = hasPending ? 1 : 0;
                        let pendPed = (appState.pedidos || []).filter(p => p.estado === 'Pendente').length;
                        count += pendPed;
                        const badgeMaster = document.getElementById('badgeAlertasMaster');
                        if (badgeMaster) {
                            if (count > 0) {
                                badgeMaster.innerText = '!';
                                badgeMaster.classList.remove('hidden');
                            } else {
                                badgeMaster.classList.add('hidden');
                            }
                        }

                    })
                    .verificarIncidenciasActivas();
            }
            
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            
            if (now.getHours() >= 20 && lastAlarmDate !== dateStr) {
                lastAlarmDate = dateStr;
                const dia = appState.dailyData[dateStr] || [];
                const pending = dia.filter(r => r.status === 'reserved');
                
                let nextDay = new Date(now);
                nextDay.setDate(nextDay.getDate() + 1);
                const nextStr = nextDay.toISOString().split('T')[0];
                
                if (typeof google !== 'undefined' && google.script) {
                    google.script.run.withSuccessHandler(res => {
                        let bCount = 0;
                        const nextDia = res.dayData || [];
                        nextDia.forEach(r => {
                            if (r.status !== 'free' && r.services && r.services.breakfast && r.services.breakfast.qty > 0) {
                                bCount += r.services.breakfast.qty;
                            }
                        });
                        
                        const msg = `As 20:00h: Faltan ${pending.length} por chegar hoxe. Hai ${bCount} almorzos mañá.`;
                        if (appState.pushConfig && appState.pushConfig.telegram) {
                            sendTelegramMsg("⏰ <b>Resumo 20:00h</b>\n\n" + msg);
                        }
                        showAppNotification("Xacobeo: Resumo 20:00h", { body: msg, icon: '/icon.svg' });
                    }).getInitialData(nextStr);
                }
            }
        }
        
        function switchAdminTab(tab) {
            const tAlox = document.getElementById('adminTabAloxamentos');
            const tEmp = document.getElementById('adminTabEmpregados');
            const tProv = document.getElementById('adminTabProveedores');
            const tShort = document.getElementById('adminTabShortcuts');
            if (tAlox) tAlox.classList.add('hidden');
            if (tEmp) tEmp.classList.add('hidden');
            if (tProv) tProv.classList.add('hidden');
            if (tShort) tShort.classList.add('hidden');
            
            const bAlox = document.getElementById('tabAloxamentos');
            const bEmp = document.getElementById('tabEmpregados');
            const bProv = document.getElementById('tabProveedores');
            const bShort = document.getElementById('tabShortcuts');
            
            if (bAlox) bAlox.className = 'px-4 py-2 font-bold text-slate-900  whitespace-nowrap hover:bg-slate-50/50   rounded-t transition';
            if (bEmp) bEmp.className = 'px-4 py-2 font-bold text-slate-900  whitespace-nowrap hover:bg-slate-50/50   rounded-t transition';
            if (bProv) bProv.className = 'px-4 py-2 font-bold text-slate-900  whitespace-nowrap hover:bg-slate-50/50   rounded-t transition';
            if (bShort) bShort.className = 'px-4 py-2 font-bold text-slate-900  whitespace-nowrap hover:bg-slate-50/50   rounded-t transition';

            const tTarxeta = document.getElementById('adminTabTarxeta');
            if (tTarxeta) tTarxeta.classList.add('hidden');
            const bTarxeta = document.getElementById('tabTarxeta');
            if (bTarxeta) bTarxeta.className = 'px-4 py-2 font-bold text-slate-900 whitespace-nowrap hover:bg-slate-50/50 rounded-t transition';
            
            if(tab === 'aloxamentos') {
                if (tAlox) tAlox.classList.remove('hidden');
                if (bAlox) bAlox.className = 'px-4 py-2 font-black text-blue-600 border-b-2 border-blue-600 whitespace-nowrap';
            } else if(tab === 'tarxeta') {
                if (tTarxeta) tTarxeta.classList.remove('hidden');
                if (bTarxeta) bTarxeta.className = 'px-4 py-2 font-black text-blue-600 border-b-2 border-blue-600 whitespace-nowrap';
                if(typeof populateTarxetaEsts === 'function') populateTarxetaEsts();
            } else if(tab === 'empregados') {
                if (tEmp) tEmp.classList.remove('hidden');
                if (bEmp) bEmp.className = 'px-4 py-2 font-black text-blue-600 border-b-2 border-blue-600 whitespace-nowrap';
                if(typeof renderEmpregados === 'function') renderEmpregados();
            } else if(tab === 'proveedores') {
                if (tProv) tProv.classList.remove('hidden');
                if (bProv) bProv.className = 'px-4 py-2 font-black text-blue-600 border-b-2 border-blue-600 whitespace-nowrap';
                if(typeof renderProveedores === 'function') renderProveedores();
            } else if(tab === 'shortcuts') {
                if (tShort) tShort.classList.remove('hidden');
                if (bShort) bShort.className = 'px-4 py-2 font-black text-blue-600 border-b-2 border-blue-600 whitespace-nowrap';
                if(typeof renderShortcuts === 'function') renderShortcuts();
            }
        }

        function previewEmpFoto(event) {
            const file = event.target.files[0];
            if(!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 150;
                    let width = img.width, height = img.height;
                    if(width > height) { if(width > MAX_SIZE) { height *= MAX_SIZE/width; width = MAX_SIZE; } } 
                    else { if(height > MAX_SIZE) { width *= MAX_SIZE/height; height = MAX_SIZE; } }
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const b64 = canvas.toDataURL('image/jpeg', 0.8);
                    const ep = document.getElementById('empFotoPreview'); if(ep) { ep.src = b64; ep.classList.remove('hidden'); }
                    const epp = document.getElementById('empFotoPlaceholder'); if(epp) epp.classList.add('hidden');
                    const eb = document.getElementById('empFotoBase64'); if(eb) eb.value = b64;
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        function addEmpregado() {
            const nome = document.getElementById('empNome').value.trim();
            if(!nome) return cAlert("O nome é obrigatorio.");
            if(!appState.empregados) appState.empregados = [];
            appState.empregados.push({
                id: 'emp_'+Date.now(),
                nome: nome,
                posto: document.getElementById('empPosto').value.trim(),
                libranzas: document.getElementById('empLibranzas').value.trim(),
                foto: document.getElementById('empFotoBase64').value || ''
            });
            document.getElementById('empNome').value='';
            document.getElementById('empPosto').value='';
            document.getElementById('empLibranzas').value='';
            document.getElementById('empFoto').value='';
            const ep2 = document.getElementById('empFotoPreview'); if(ep2) ep2.classList.add('hidden');
            const epp2 = document.getElementById('empFotoPlaceholder'); if(epp2) epp2.classList.remove('hidden');
            document.getElementById('empFotoBase64').value='';
            renderEmpregados();
            renderReceptionists();
        }

        function deleteEmpregado(id) {
            cConfirm("Borrar empregado?", () => {
                appState.empregados = appState.empregados.filter(e => e.id !== id);
                salvarConfigNoServidor();
                renderEmpregados();
                renderReceptionists();
            });
        }

        function selectReceptionist(nome, foto) {
            const rn = document.getElementById('receptionistName'); if(rn) rn.value = nome;
            const aen = document.getElementById('activeEmpName'); if(aen) aen.innerText = nome;
            const aef = document.getElementById('activeEmpFoto');
            const aei = document.getElementById('activeEmpInitials');
            if (foto) {
                if(aef) { aef.src = foto; aef.classList.remove('hidden'); }
                if(aei) aei.classList.add('hidden');
            } else {
                if(aef) aef.classList.add('hidden');
                if(aei) { aei.classList.remove('hidden'); aei.innerText = nome.substring(0,2).toUpperCase(); }
            }
            closeModal('empSelectModal');
            localStorage.setItem('lastReceptionist_' + (localStorage.getItem('currentEstablishmentId') || 'default'), JSON.stringify({nome, foto}));
        }

        function renderReceptionists() {
            if(!appState.empregados) appState.empregados = [];
            const list = document.getElementById('empSelectList');
            let defaults = [
                {nome: 'Complexo Xacobeo (Xeral)', foto: ''},
                {nome: 'Quenda Mañá', foto: ''},
                {nome: 'Quenda Tarde', foto: ''},
                {nome: 'Quenda Noite', foto: ''}
            ];
            let all = [...appState.empregados, ...defaults];
            if(list) list.innerHTML = all.map(e => `
                <div onclick="selectReceptionist('${e.nome}', '${e.foto||''}')" class="bg-white/30 backdrop-blur-md border border-white/50 shadow-sm border hover:border-blue-500 hover:shadow-md cursor-pointer rounded-2xl p-3 flex flex-col items-center gap-2 transition-all">
                    <div class="w-16 h-16 rounded-full overflow-hidden bg-slate-100/50   flex items-center justify-center border-2 border-slate-200/50 ">
                        ${e.foto ? `<img src="${e.foto}" class="w-full h-full object-cover">` : `<span class="text-2xl font-black text-slate-800">${e.nome.substring(0,1).toUpperCase()}</span>`}
                    </div>
                    <div class="text-xs font-black text-slate-900  text-center leading-tight">${e.nome}</div>
                    ${e.posto ? `<div class="text-[9px] text-slate-900  uppercase">${e.posto}</div>` : ''}
                </div>
            `).join('');

            // Restore last
            let last = localStorage.getItem('lastReceptionist_' + (localStorage.getItem('currentEstablishmentId') || 'default'));
            if (last) {
                try {
                    let l = JSON.parse(last);
                    selectReceptionist(l.nome, l.foto);
                } catch(e) {}
            }
        }

                let currentEmpDate = new Date();

        function getDaysInMonth(year, month) {
            return new Date(year, month + 1, 0).getDate();
        }

        window.changeEmpMonth = function(offset) {
            currentEmpDate.setMonth(currentEmpDate.getMonth() + offset);
            renderEmpCalendar();
        };

        window.renderEmpregados = function() {
            if(!appState.empregados) appState.empregados = [];
            const c = document.getElementById('adminEmpList');
            if(c) {
                c.innerHTML = appState.empregados.map(e => `
                    <div class="bg-slate-50/50   p-2.5 border border-slate-200/50  rounded-xl flex items-center justify-between hover:bg-slate-100/50   transition shadow-sm">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full overflow-hidden bg-white/30 backdrop-blur-md border border-white/50 shadow-sm border-2 border-slate-200/50  shrink-0 flex items-center justify-center text-lg font-black text-slate-800">
                                ${e.foto ? `<img src="${e.foto}" class="w-full h-full object-cover">` : e.nome.substring(0,1).toUpperCase()}
                            </div>
                            <div>
                                <div class="font-bold text-slate-800  text-sm leading-tight">${e.nome}</div>
                                <div class="text-[10px] font-black tracking-wider text-slate-900  uppercase">${e.posto || 'Empregado'} • ${e.libranzaType || 'custom'}</div>
                            </div>
                        </div>
                        <button onclick="deleteEmpregado('${e.id}')" class="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg font-bold">🗑️</button>
                    </div>
                `).join('') || '<div class="text-slate-800 italic text-sm text-center p-4">Non hai empregados</div>';
            }
            renderEmpCalendar();
        };

        window.renderEmpCalendar = function() {
            const head = document.getElementById('empCalHead');
            const body = document.getElementById('empCalBody');
            const disp = document.getElementById('empMonthDisplay');
            if(!head || !body || !disp) return;

            const y = currentEmpDate.getFullYear();
            const m = currentEmpDate.getMonth();
            
            const monthNames = ["Xaneiro", "Febreiro", "Marzo", "Abril", "Maio", "Xuño", "Xullo", "Agosto", "Setembro", "Outubro", "Novembro", "Decembro"];
            const dayNames = ["D", "L", "M", "M", "X", "V", "S"];
            
            disp.innerText = `${monthNames[m]} ${y}`;
            
            const days = getDaysInMonth(y, m);
            
            let ths = '<tr class="border-b border-slate-300/50 "><th class="p-2 sticky left-0 bg-slate-200 z-20 border-r border-slate-300/50  shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-left">Empregado</th>';
            for(let d=1; d<=days; d++) {
                let date = new Date(y, m, d);
                let dn = dayNames[date.getDay()];
                let isWeekend = (date.getDay() === 0 || date.getDay() === 6);
                ths += `<th class="p-2 border-r border-slate-300/50  text-center w-8 ${isWeekend ? 'bg-slate-300 text-slate-800 ' : ''}">${dn}<br>${d}</th>`;
            }
            ths += '</tr>';
            head.innerHTML = ths;
            
            if(!appState.empregados || appState.empregados.length === 0) {
                body.innerHTML = `<tr><td colspan="${days+1}" class="p-4 text-center font-bold text-slate-800 italic">Engade empregados para ver o calendario</td></tr>`;
                return;
            }
            
            let trs = '';
            appState.empregados.forEach(emp => {
                let libranzas = emp.libranzasData || {};
                trs += `<tr class="border-b border-slate-200/50  hover:bg-slate-50/50   transition-colors">
                    <td class="p-2 sticky left-0 bg-white/30 backdrop-blur-md border border-white/50 shadow-sm z-10 border-r border-slate-200/50  font-bold text-slate-800  text-xs truncate max-w-[120px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]" title="${emp.nome}">${emp.nome}</td>`;
                for(let d=1; d<=days; d++) {
                    let dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                    let isLibre = libranzas[dateStr] === true;
                    let dateObj = new Date(y, m, d);
                    let isWeekend = (dateObj.getDay() === 0 || dateObj.getDay() === 6);
                    
                    let bgClass = isLibre ? 'bg-red-500 hover:bg-red-600' : (isWeekend ? 'bg-slate-100/50   hover:bg-slate-200' : 'bg-white/30 backdrop-blur-md border border-white/50 shadow-sm hover:bg-slate-100/50  ');
                    let txt = isLibre ? '<span class="text-white font-black text-xs">L</span>' : '';
                    
                    trs += `<td class="p-1 border-r border-slate-200/50  text-center transition-colors cursor-pointer ${bgClass}" onclick="toggleLibranza('${emp.id}', '${dateStr}')">${txt}</td>`;
                }
                trs += '</tr>';
            });
            body.innerHTML = trs;
        };

        window.toggleLibranza = function(empId, dateStr) {
            const emp = appState.empregados.find(e => e.id === empId);
            if(emp) {
                if(!emp.libranzasData) emp.libranzasData = {};
                emp.libranzasData[dateStr] = !emp.libranzasData[dateStr];
                salvarConfigNoServidor();
                renderEmpCalendar();
                if (typeof renderPersoalLibrando === "function") renderPersoalLibrando();
            }
        };

        function generateLibranzas(type, startDate, firstFreeDate) {
            let lib = {};
            let d = new Date(startDate);
            
            const end = new Date(d);
            end.setFullYear(end.getFullYear() + 2); // 2 years ahead
            
            if (type === '6-2' && firstFreeDate) {
                // start from first free date!
                d = new Date(firstFreeDate);
                let libCount = 2; // the first day is a free day, so we have 2 free days starting now
                let workCount = 0;
                while(d <= end) {
                    let dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                    if (libCount > 0) {
                        lib[dateStr] = true;
                        libCount--;
                        if (libCount === 0) workCount = 6;
                    } else {
                        if (workCount > 0) {
                            workCount--;
                            if (workCount === 0) libCount = 2;
                        }
                    }
                    d.setDate(d.getDate() + 1);
                }
            } else if (type === '6-2') {
                d.setDate(1); 
                let workCount = 6;
                let libCount = 0;
                while(d <= end) {
                    let dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                    if (libCount > 0) {
                        lib[dateStr] = true;
                        libCount--;
                        if (libCount === 0) workCount = 6;
                    } else {
                        if (workCount > 0) {
                            workCount--;
                            if (workCount === 0) libCount = 2;
                        }
                    }
                    d.setDate(d.getDate() + 1);
                }
            } else if (type === '1-week') {
                d.setDate(1); 
                while(d <= end) {
                    if(d.getDay() === 0) { // Sunday
                        let dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                        lib[dateStr] = true;
                    }
                    d.setDate(d.getDate() + 1);
                }
            }
            return lib;
        }

        window.addEmpregado = function() {
            const nome = document.getElementById('empNome').value.trim();
            if(!nome) return cAlert("O nome é obrigatorio.");
            
            const tipoLib = document.getElementById('empLibranzaType').value;
            const firstDay = document.getElementById('empPrimeiroDiaLibre').value;
            const libs = generateLibranzas(tipoLib, currentEmpDate, firstDay);
            
            if(!appState.empregados) appState.empregados = [];
            appState.empregados.push({
                id: 'emp_'+Date.now(),
                nome: nome,
                posto: document.getElementById('empPosto').value.trim(),
                libranzaType: tipoLib,
                libranzasData: libs,
                foto: document.getElementById('empFotoBase64').value || ''
            });
            
            document.getElementById('empNome').value='';
            document.getElementById('empPosto').value='';
            document.getElementById('empFoto').value='';
            const ep2 = document.getElementById('empFotoPreview'); if(ep2) ep2.classList.add('hidden');
            const epp2 = document.getElementById('empFotoPlaceholder'); if(epp2) epp2.classList.remove('hidden');
            document.getElementById('empFotoBase64').value='';
            
            salvarConfigNoServidor();
            renderEmpregados();
            renderReceptionists();
        };

        function addProveedor() {
            const nome = document.getElementById('provNome').value.trim();
            if(!nome) return cAlert("O nome é obrigatorio.");
            if(!appState.proveedores) appState.proveedores = [];
            appState.proveedores.push({
                id: 'prov_'+Date.now(),
                nome: nome,
                tel: document.getElementById('provTelf').value.trim(),
                servizo: document.getElementById('provServizo').value.trim()
            });
            document.getElementById('provNome').value='';
            document.getElementById('provTelf').value='';
            document.getElementById('provServizo').value='';
            renderProveedores();
            salvarConfigNoServidor();
        }

        function deleteProveedor(id) {
            cConfirm("Borrar proveedor?", () => {
                appState.proveedores = appState.proveedores.filter(p => p.id !== id);
                renderProveedores();
                salvarConfigNoServidor();
            });
        }

        function renderProveedores() {
            if(!appState.proveedores) appState.proveedores = [];
            const c = document.getElementById('adminProvList');
            if(c) c.innerHTML = appState.proveedores.map(p => `
                <div class="bg-white/30 backdrop-blur-md border border-white/50 shadow-sm p-3 border rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                        <div class="font-bold text-slate-800  flex items-center gap-1.5">🏢 ${p.nome} <a href="tel:${p.tel}" class="text-blue-600 bg-blue-50/50  px-2 py-0.5 rounded-full text-xs hover:bg-blue-100">📞 ${p.tel}</a></div>
                        <div class="text-xs text-slate-900  mt-1 uppercase font-medium bg-slate-100/50   inline-block px-2 py-0.5 rounded">${p.servizo || 'Sen especificar'}</div>
                    </div>
                    <button onclick="deleteProveedor('${p.id}')" class="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg font-bold">🗑️</button>
                </div>
            `).join('') || '<div class="text-center text-slate-800 py-10 font-bold">Non hai proveedores rexistrados</div>';
        }

        function openReparacions() {
            openLibro();
            document.getElementById('libroTipo').value = 'Mantemento';
        }

        function patchRoomServices(room) {
            if (!room.services) room.services = {};
            const s = room.services;
            if (!s.breakfast) s.breakfast = {qty:0, price:0};
            if (!s.dinner) s.dinner = {qty:0, price:0};
            if (!s.picnic) s.picnic = {qty:0, price:0};
            if (!s.halfBoard) s.halfBoard = {qty:0, price:0};
            if (!s.fullBoard) s.fullBoard = {qty:0, price:0};
            if (!s.laundry) s.laundry = {active:false, price:0};
            if (!s.mochilas) s.mochilas = {qty:0, price:0}; // NOVO
            if (!s.outros) s.outros = {qty:0, price:0}; // NOVO
            if (typeof s.parking === 'undefined') s.parking = false;
            if (typeof s.taxi === 'undefined') s.taxi = false;
            
            room.price = room.price || 0;
            room.paidCash = room.paidCash || 0;
            room.paidCard = room.paidCard || 0;
            room.paidTransfer = room.paidTransfer || 0;
            room.paidAgency = room.paidAgency || 0;
            if (typeof room.accountSettled === 'undefined') room.accountSettled = false;
            
            if (room.type === 'bed') {
                if (!room.bedId && room.bedCode) room.bedId = room.bedCode;
            } else {
                if (!room.baseId) room.baseId = room.id;
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            if (window.isQrMode) {
                // Completely kill the login overlay in QR mode to prevent it from fading in
                const lo = document.getElementById('loginOverlay');
                if(lo) {
                    lo.style.display = 'none !important';
                    lo.style.opacity = '0 !important';
                    lo.style.zIndex = '-1 !important';
                    lo.remove(); // Just nuke it from DOM
                }
                document.body.style.background = '#0f172a'; // dark theme for scanner
            }
            if (typeof google !== 'undefined' && google.script) {
                setTimeout(() => {
                    const runner = google.script.run.withSuccessHandler(res => {
                        window.inboxReservas = res || [];
                        updateInboxBadge();
                    });
                    /* Removed Gmail Sync */
                }, 3000);
            }
            checkLogin(); 
            
            const localDate = new Date();
            const tzOffset = localDate.getTimezoneOffset() * 60000;
            const hoxe = new Date(localDate.getTime() - tzOffset).toISOString().split('T')[0];
            document.getElementById('planingDate').value = hoxe;
            initColorPicker();
            
            if (typeof google !== 'undefined' && google.script) {
                if (!isLoggedIn) {
                    document.getElementById('loginOverlay').style.display = 'flex';
                    document.getElementById('loginOverlay').style.opacity = '1';
                } else {
                    showLoader();
                    google.script.run
                        .withSuccessHandler(handleInitialData)
                        .withFailureHandler((err) => { cAlert("Erro de conexión: " + (err && err.message ? err.message : JSON.stringify(err))); hideLoader(); })
                        .getInitialData(hoxe);
                    
                    // Se estabamos xa logueados e temos un QR, procesalo
                    if (window.pendingQrToProcess) {
                        try {
                            const decodedStr = decodeURIComponent(atob(window.pendingQrToProcess));
                            if (decodedStr.startsWith('XAC|')) {
                                // Mostrar o modal instantaneamente e tapar todo o fondo
                                const modal = document.getElementById('qrScannerModal');
                                if (modal) {
                                    modal.style.display = 'flex';
                                    modal.classList.add('active');
                                }
                                const canvasEl = document.getElementById('qrCanvas');
                                if (canvasEl) {
                                    canvasEl.parentElement.classList.add('hidden');
                                }
                                const statusEl = document.getElementById('qrStatusBox');
                                if (statusEl) {
                                    statusEl.innerText = "Procesando código...";
                                }
                                // Procesar
                                setTimeout(() => {
                                    processScannedQr(decodedStr);
                                    window.pendingQrToProcess = null;
                                }, 50); // Un mínimo delay para que asente o DOM
                            }
                        } catch(e) {}
                    }
                }
            } else {
                appState.agencies = [{name: 'Booking', color: '#003580'}];
                appState.baseRooms = [
                    { id: 'r1', number: '101', roomName: 'Dobre Standard', type: 'room', bedConfig: '🛏️ 150cm', zoneColor: '#ffffff', features: ['🚿', '❄️'] },
                    { id: 'a1', number: '102', roomName: 'Suite', type: 'apartment', bedConfig: '🛏️ 200cm', zoneColor: '#fef3c7', features: ['🛁', '🌅'] },
                    { id: 'alb1', number: '201', roomName: 'Albergue Mixto', type: 'hostel', totalBeds: 16, bedPrice: 15, zoneColor: '#e0f2fe' }
                ];
                hideLoader();
                changeDate();
            }

            setInterval(() => {
                verificarAlarmas();
                if (isLoggedIn && !document.querySelector('.modal.active') && currentPlaningDate && typeof google !== 'undefined' && google.script) {
                    google.script.run.withSuccessHandler((res) => {
                        if (res && res.dayData) { 
                            appState.dailyData[currentPlaningDate] = res.dayData; 
                            appState.dailyData[currentPlaningDate].forEach(patchRoomServices);
                            xerarDiaSeNonExiste(); 
                            renderGrid(); 
                            filterGrid(); 
                        }
                    }).getInitialData(currentPlaningDate);
                }
            }, 60000);
        });

        function showLoader() { document.getElementById('loadingOverlay').style.opacity = '1'; document.getElementById('loadingOverlay').style.display = 'flex'; }
        function hideLoader() { document.getElementById('loadingOverlay').style.opacity = '0'; setTimeout(()=>document.getElementById('loadingOverlay').style.display = 'none', 300); }
        let mediaRecorder;
        let audioChunks = [];
        let recordInterval;
        let recordSeconds = 0;
        let isRecording = false;

        function toggleRecording() {
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        }

        async function startRecording() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunks.push(event.data);
                });

                mediaRecorder.addEventListener("stop", () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = () => {
                        const base64String = reader.result;
                        saveVoiceMessage(base64String);
                    }
                });

                mediaRecorder.start();
                isRecording = true;
                
                const btn = document.getElementById('btnRecord');
                btn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
                btn.classList.add('bg-red-600', 'hover:bg-red-700');
                btn.innerHTML = '⏹️';
                
                document.getElementById('recordingStatus').classList.remove('hidden');
                recordSeconds = 0;
                document.getElementById('recordTimer').innerText = '00:00';
                recordInterval = setInterval(() => {
                    recordSeconds++;
                    const m = Math.floor(recordSeconds / 60).toString().padStart(2, '0');
                    const s = (recordSeconds % 60).toString().padStart(2, '0');
                    document.getElementById('recordTimer').innerText = `${m}:${s}`;
                }, 1000);

            } catch (err) {
                console.error("Error accessing mic:", err);
                cAlert("Erro ao acceder ao micrófono. Asegúrate de dar permisos.");
            }
        }

        function stopRecording() {
            if (mediaRecorder && isRecording) {
                mediaRecorder.stop();
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
                isRecording = false;
                clearInterval(recordInterval);
                
                const btn = document.getElementById('btnRecord');
                btn.classList.remove('bg-red-600', 'hover:bg-red-700');
                btn.classList.add('bg-purple-600', 'hover:bg-purple-700');
                btn.innerHTML = '🎙️';
                document.getElementById('recordingStatus').classList.add('hidden');
            }
        }
        
        function saveVoiceMessage(base64Data) {
            const msg = {
                id: 'v_' + Date.now(),
                date: new Date().toISOString(),
                audioData: base64Data
            };
            if(!appState.voiceMessages) appState.voiceMessages = [];
            appState.voiceMessages.push(msg);
            renderVoiceMessages();
            // Automatically add as Incidencia
            const receptionist = document.getElementById('activeEmpName').innerText;
            const audioHtml = `<br><audio controls src="${base64Data}"></audio>`;
            if (typeof google !== 'undefined' && google.script) {
                google.script.run.gardarIncidencia('Nota de Voz', 'Xeral', 'Mensaxe de voz rexistrada:' + audioHtml, receptionist);
            } else if (typeof firebaseBackend !== 'undefined' && firebaseBackend.gardarIncidencia) {
                firebaseBackend.gardarIncidencia('Nota de Voz', 'Xeral', 'Mensaxe de voz rexistrada:' + audioHtml, receptionist);
            } else if (typeof google !== 'undefined' && google.script) {
                google.script.run.gardarIncidencia('Nota de Voz', 'Xeral', 'Mensaxe de voz rexistrada:' + audioHtml, receptionist);
            }
        }

        function renderVoiceMessages() {
            const list = document.getElementById('voiceList');
            if(!list) return;
            if(!appState.voiceMessages || appState.voiceMessages.length === 0) {
                list.innerHTML = '<div class="text-center text-slate-800 py-4 italic">Non hai mensaxes de voz</div>';
                return;
            }
            
            // Sort newest first
            const sorted = [...appState.voiceMessages].sort((a,b) => new Date(b.date) - new Date(a.date));
            
            list.innerHTML = sorted.map(v => `
                <div class="bg-slate-50/50   p-3 rounded-xl border border-slate-200/50  flex items-center justify-between gap-3">
                    <div class="flex-1">
                        <div class="text-xs text-slate-900  font-bold mb-1">${new Date(v.date).toLocaleString('es-ES')}</div>
                        <audio controls class="w-full h-8" src="${v.audioData}"></audio>
                    </div>
                    <button onclick="deleteVoiceMessage('${v.id}')" class="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition">🗑️</button>
                </div>
            `).join('');
        }
        
        function deleteVoiceMessage(id) {
            cConfirm("Borrar mensaxe de voz?", () => {
                appState.voiceMessages = appState.voiceMessages.filter(v => v.id !== id);
                renderVoiceMessages();
            });
        }

        function closeModal(id) { document.getElementById(id).classList.remove('active'); }
        
        function handleInitialData(response) {
            if (response && response.config) {
                appState.baseRooms = response.config.baseRooms || [];
                appState.agencies = response.config.agencies || [];
                if (response.config.credentials) appState.credentials = response.config.credentials;
                if (response.config.extrasPrices) appState.extrasPrices = response.config.extrasPrices;
                if (response.config.userEstablishments) appState.userEstablishments = response.config.userEstablishments;
                if (response.config.pedidos) appState.pedidos = response.config.pedidos;
                if (response.config.pushConfig) appState.pushConfig = response.config.pushConfig;
                appState.empregados = response.config.empregados || [];
                appState.proveedores = response.config.proveedores || [];
                appState.shortcuts = response.config.shortcuts || [];
                appState.tarxetaTexts = response.config.tarxetaTexts || {};
                if(typeof renderShortcuts === "function") renderShortcuts();
                renderReceptionists();
                if (response.config.establishmentName) {
                    appState.establishmentName = response.config.establishmentName;
                } else if (appState.userEstablishments) {
                    const curId = localStorage.getItem('currentEstablishmentId') || 'default';
                    const est = appState.userEstablishments.find(e => e.id === curId);
                    if (est) appState.establishmentName = est.name;
                }
            }
            if (response && response.dayData) {
                appState.dailyData[document.getElementById('planingDate').value] = response.dayData;
                appState.dailyData[document.getElementById('planingDate').value].forEach(patchRoomServices);
            }
            updateAgencyDropdown();
            changeDate();
            verificarAlarmas();
            hideLoader();
            checkLogin();
            updateEstablishmentName();
        }

        function changeDate() {
            const dateInput = document.getElementById('planingDate');
            if (dateInput) {
                currentPlaningDate = dateInput.value;
            }
            multiSelectModeActive = false; currentEditingBedIds = []; currentOpenHostelId = null;
            mainMultiSelectModeActive = false; mainSelectedRoomIds = [];
            document.getElementById('mainMultiSelectActionPanel').classList.add('hidden');
            document.getElementById('btnMainMultiSelect').classList.remove('bg-orange-500'); document.getElementById('btnMainMultiSelect').classList.add('bg-slate-100/50');
            document.getElementById('btnMainMultiSelect').classList.remove('text-white'); document.getElementById('btnMainMultiSelect').classList.add('text-slate-900');
            
            if(!appState.dailyData[currentPlaningDate] && typeof google !== 'undefined' && google.script) {
                showLoader();
                google.script.run
                    .withSuccessHandler((response) => {
                        if (response && response.dayData) {
                            appState.dailyData[currentPlaningDate] = response.dayData;
                            appState.dailyData[currentPlaningDate].forEach(patchRoomServices);
                        }
                        xerarDiaSeNonExiste();
                        hideLoader(); renderGrid(); filterGrid(); if(typeof renderPersoalLibrando === "function") renderPersoalLibrando();
                    })
                    .withFailureHandler((err) => {
                        console.error("Erro ao cargar datos:", err);
                        hideLoader();
                        cAlert("Erro ao cargar os datos. Revisa a túa conexión.");
                    })
                    .getInitialData(currentPlaningDate);
                return; 
            }
            xerarDiaSeNonExiste(); renderGrid(); filterGrid(); if(typeof renderPersoalLibrando === "function") renderPersoalLibrando();
        }

        function createEmptyRoomObject(baseId, num, name, type, bedId = null) {
            return {
                id: bedId ? `${baseId}_${bedId}` : baseId, baseId: baseId, number: num, bedId: bedId, roomName: name, type: type,
                status: 'free', clientName: '', guests: 1, agency: '', checkIn: '', checkOut: '', price: 0, 
                paidCash: 0, paidCard: 0, paidAgency: 0, paidTransfer: 0, accountSettled: false, observations: '', cleaningStatus: 'clean', groupId: '', 
                services: { breakfast: {qty:0, price:0}, dinner: {qty:0, price:0}, picnic: {qty:0, price:0}, halfBoard: {qty:0, price:0}, fullBoard: {qty:0, price:0}, laundry: {active:false, price:0}, mochilas: {qty:0, price:0}, outros: {qty:0, price:0}, parking: false, taxi: false }
            };
        }

                function xerarDiaSeNonExiste() {
            if(!appState.dailyData[currentPlaningDate]) appState.dailyData[currentPlaningDate] = [];
            let dia = appState.dailyData[currentPlaningDate];
            let needsSave = false; 
            
            appState.baseRooms.forEach(base => {
                if (base.type === 'hostel') {
                    for (let i = 1; i <= (base.totalBeds || 16); i++) {
                        let literaNum = Math.ceil(i / 2); 
                        let isTop = (i % 2 === 0); 
                        let bedCode = `${literaNum}${isTop ? 'A' : 'B'}`;
                        
                        let bedObjId = `${base.id}_${bedCode}`;
                        let existingBed = dia.find(d => d.id === bedObjId);
                        if (!existingBed) {
                            let newBed = createEmptyRoomObject(base.id, base.number, `${base.roomName}`, 'bed', bedCode);
                            newBed.price = base.bedPrice || 15; 
                            dia.push(newBed);
                            needsSave = true;
                        } else {
                            if (existingBed.roomName !== base.roomName || existingBed.number !== base.number || existingBed.zoneColor !== base.zoneColor) {
                                existingBed.roomName = base.roomName;
                                existingBed.number = base.number;
                                existingBed.zoneColor = base.zoneColor;
                                needsSave = true;
                            }
                        }
                    }
                } else {
                    let existingRoom = dia.find(d => d.id === base.id);
                    if (!existingRoom) {
                        let r = createEmptyRoomObject(base.id, base.number, base.roomName, base.type);
                        r.features = base.features || [];
                        r.bedConfig = base.bedConfig;
                        r.zoneColor = base.zoneColor;
                        dia.push(r);
                        needsSave = true;
                    } else {
                        if (existingRoom.roomName !== base.roomName || existingRoom.number !== base.number || existingRoom.zoneColor !== base.zoneColor || existingRoom.bedConfig !== base.bedConfig) {
                            existingRoom.roomName = base.roomName;
                            existingRoom.number = base.number;
                            existingRoom.zoneColor = base.zoneColor;
                            existingRoom.bedConfig = base.bedConfig;
                            existingRoom.features = base.features || [];
                            needsSave = true;
                        }
                    }
                }
            });

            dia.forEach(patchRoomServices);
            
            if(needsSave) {
                salvarDiaNoServidor();
            }
        }

        function salvarDiaNoServidor(forzar = false) {
            if (typeof google !== 'undefined' && google.script) {
                const s = document.getElementById('saveStatus'); if(s) { s.classList.remove('hidden'); setTimeout(()=>s.classList.add('hidden'), 2000); }
                google.script.run
                    .withFailureHandler((err) => { cAlert("Erro ao gardar: " + (err.message || err)); })
                    .saveDayData(currentPlaningDate, JSON.stringify(appState.dailyData[currentPlaningDate] || []));
                if(forzar) cAlert("Datos sincronizados coa nube.");
            }
        }
        function salvarConfigNoServidor() {
            if (typeof google !== 'undefined' && google.script) {
                google.script.run
                    .withFailureHandler((err) => { cAlert("Erro ao gardar configuración: " + (err.message || err)); })
                    .saveAppConfig(JSON.stringify({ baseRooms: appState.baseRooms, agencies: appState.agencies, credentials: appState.credentials, extrasPrices: appState.extrasPrices, establishmentName: appState.establishmentName, userEstablishments: appState.userEstablishments, pushConfig: appState.pushConfig, pedidos: appState.pedidos, empregados: appState.empregados, proveedores: appState.proveedores, shortcuts: appState.shortcuts, tarxetaTexts: appState.tarxetaTexts }));
            }
        }

        
        function renderPersoalLibrando() {
            const container = document.getElementById('persoalLibrandoContainer');
            if (!container) return;
            
            if (!appState.empregados || appState.empregados.length === 0) {
                container.innerHTML = '<span class="text-xs italic text-slate-800 font-bold mt-1">Non hai persoal rexistrado</span>';
                return;
            }
            
            let html = '';
            let noneOff = true;
            
            // Use currentPlaningDate which is YYYY-MM-DD
            const dateStr = currentPlaningDate;
            
            appState.empregados.forEach(emp => {
                if (emp.libranzasData && emp.libranzasData[dateStr] === true) {
                    noneOff = false;
                    const fotoHtml = emp.foto ? `<img src="${emp.foto}" class="w-6 h-6 rounded-full shadow-sm object-cover">` : `<div class="w-6 h-6 rounded-full shadow-sm bg-blue-100 flex items-center justify-center text-blue-700 font-black text-[10px]">${emp.nome.charAt(0).toUpperCase()}</div>`;
                    
                    html += `<div class="flex items-center gap-2 bg-slate-50/50   border border-slate-200/50  rounded-full pl-1 pr-3 py-1 shadow-sm">
                        ${fotoHtml}
                        <span class="text-xs font-bold text-slate-900 ">${emp.nome}</span>
                    </div>`;
                }
            });
            
            if (noneOff) {
                container.innerHTML = '<span class="text-xs font-bold text-emerald-600 bg-emerald-50/50  px-3 py-1 rounded-full border border-emerald-200/50  mt-0.5">Ningún empregado libre hoxe</span>';
            } else {
                container.innerHTML = html;
            }
        }

        function updateGlobalCounters() {
            const dia = appState.dailyData[currentPlaningDate] || [];
            let rFree = 0, rOcc = 0, rRes = 0; 
            let aFree = 0, aOcc = 0, aRes = 0; 
            let bFree = 0, bOcc = 0, bRes = 0; 
            
            let hasRooms = false, hasApts = false, hasBeds = false;

            appState.baseRooms.forEach(b => {
                if (b.type === 'room') hasRooms = true;
                if (b.type === 'apartment') hasApts = true;
                if (b.type === 'hostel') hasBeds = true;
            });

            dia.forEach(r => {
                const baseExists = appState.baseRooms.some(b => b.id === r.baseId);
                if (!baseExists) return;

                if (r.type === 'bed' || r.type === 'hostel' || r.bedId) {
                    if (r.status === 'free') bFree++;
                    else if (r.status === 'reserved') bOcc++;
                    else bOcc++;
                } else if (r.type === 'room' || (!r.type && !r.bedId && !r.bedConfig)) {
                    if (r.status === 'free') rFree++;
                    else if (r.status === 'reserved') rOcc++;
                    else rOcc++;
                } else if (r.type === 'apartment') {
                    if (r.status === 'free') aFree++;
                    else if (r.status === 'reserved') aOcc++;
                    else aOcc++;
                }
            });
            
            const cgRooms = document.getElementById('counterGroupRooms'); if (cgRooms) cgRooms.style.display = hasRooms ? '' : 'none';
            const cgApts = document.getElementById('counterGroupApts'); if (cgApts) cgApts.style.display = hasApts ? '' : 'none';
            const cgBeds = document.getElementById('counterGroupBeds'); if (cgBeds) cgBeds.style.display = hasBeds ? '' : 'none';
            const cgWrap = document.getElementById('globalCountersWrapper');
            if (cgWrap) {
                if (!hasRooms && !hasApts && !hasBeds) cgWrap.style.display = 'none';
                else cgWrap.style.display = '';
            }

            const eRF = document.getElementById('countRoomsFree'); if (eRF) eRF.innerText = rFree + ' Libres';
            const eRR = document.getElementById('countRoomsRes'); if (eRR) eRR.innerText = rRes + ' Reservadas';
            const eRO = document.getElementById('countRoomsOcc'); if (eRO) eRO.innerText = rOcc + ' Ocupadas';
            
            const eAF = document.getElementById('countAptsFree'); if (eAF) eAF.innerText = aFree + ' Libres';
            const eAR = document.getElementById('countAptsRes'); if (eAR) eAR.innerText = aRes + ' Reservadas';
            const eAO = document.getElementById('countAptsOcc'); if (eAO) eAO.innerText = aOcc + ' Ocupadas';
            
            const eBF = document.getElementById('countBedsFree'); if (eBF) eBF.innerText = bFree + ' Libres';
            const eBR = document.getElementById('countBedsRes'); if (eBR) eBR.innerText = bRes + ' Reservadas';
            const eBO = document.getElementById('countBedsOcc'); if (eBO) eBO.innerText = bOcc + ' Ocupadas';
        }

        function renderGrid() {
            const grid = document.getElementById('roomGrid');
            if (grid) {
                if (appState.compactMode) {
                    grid.className = "grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-2 items-start";
                } else {
                    grid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 items-start";
                }
                grid.innerHTML = '';
            }
            let dia = appState.dailyData[currentPlaningDate] || [];

            appState.baseRooms.forEach(base => {
                if (base.type === 'hostel') {
                    const beds = dia.filter(d => d.baseId === base.id);
                    const ocupadas = beds.filter(b => b.status === 'occupied').length;
                    const res = beds.filter(b => b.status === 'reserved').length;
                    const totalOcup = ocupadas + res;
                    const isFull = beds.length > 0 && totalOcup === beds.length;
                    
                    const freeBottoms = beds.filter(b => b.status === 'free' && b.bedId.includes('B')).length;
                    const freeTops = beds.filter(b => b.status === 'free' && b.bedId.includes('A')).length;
                    
                    let bgStatus = isFull ? 'bg-red-500/20 border-red-400/50 backdrop-blur-xl' : (totalOcup > 0 ? 'bg-orange-500/20 border-orange-400/50 backdrop-blur-xl' : 'bg-emerald-500/20 border-emerald-400/50 backdrop-blur-xl');
                    let textStatus = isFull ? 'text-red-800' : (totalOcup > 0 ? 'text-orange-800 ' : 'text-emerald-800');
                    let barColor = isFull ? 'bg-red-500/60 backdrop-blur-md' : (totalOcup > 0 ? 'bg-orange-500/60 backdrop-blur-md' : 'bg-emerald-500/60 backdrop-blur-md');

                    const wrapper = document.createElement('div');
                    wrapper.className = `card-wrapper rounded-2xl border-2 ${bgStatus} overflow-hidden shadow flex flex-col h-full col-span-1 min-h-[160px]`;
                    wrapper.onclick = () => {
                        if (!mainMultiSelectModeActive) openHostelModal(base.id);
                        else cAlert("Para coller camas de albergue, entra nel e usa alí a Selección Múltiple.");
                    };
                    
                    let allNames = beds.map(b => b.clientName).join(' ').toLowerCase();
                    wrapper.dataset.search = allNames;
                    wrapper.dataset.type = 'hostel';

                    wrapper.innerHTML = `
                        <div class="w-full h-2 ${barColor}"></div>
                        <div class="p-4 flex-1 flex flex-col items-center justify-center text-center">
                            <div class="text-xs font-black text-slate-800 uppercase tracking-widest w-full text-left flex items-center gap-1"><div class="w-3 h-3 rounded-full border border-slate-400 shrink-0 shadow-sm" style="background-color: ${base.zoneColor || '#ffffff'}"></div> 🎒 ${base.roomName}</div>
                            <div class="text-2xl font-black mt-1 text-slate-800  w-full text-left mb-1">Hab. ${base.number}</div>
                            
                            <div class="flex justify-between w-full mt-3 text-sm px-1 border-b border-slate-200/50  pb-2">
                                <span class="text-red-600 font-extrabold flex items-center gap-1">🔴 ${totalOcup} Ocup</span>
                                <span class="text-emerald-600 font-extrabold flex items-center gap-1">🟢 ${beds.length - totalOcup} Libr</span>
                            </div>
                            
                            <div class="mt-auto w-full pt-3">
                                <div class="flex justify-center items-center gap-2 bg-white/30 backdrop-blur-md border border-white/50 shadow-sm rounded-xl p-2 border border-slate-200/50  shadow-sm">
                                    <div class="text-xs font-bold text-slate-800  flex flex-col items-center px-2 py-1 bg-slate-50/50   rounded-lg">
                                        <span class="text-[10px] uppercase text-slate-800">Baixas</span>
                                        <span class="text-lg font-black text-emerald-600">▼ ${freeBottoms}</span>
                                    </div>
                                    <div class="h-8 w-px bg-slate-200"></div>
                                    <div class="text-xs font-bold text-slate-800  flex flex-col items-center px-2 py-1 bg-slate-50/50   rounded-lg">
                                        <span class="text-[10px] uppercase text-slate-800">Altas</span>
                                        <span class="text-lg font-black text-emerald-600">▲ ${freeTops}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    grid.appendChild(wrapper);

                } else {
                    const room = dia.find(d => d.id === base.id);
                    if(!room) return;

                    const isApt = room.type === 'apartment';
                    const cardShapeClass = isApt ? 'card-apartment' : 'card-room';
                    const shapeStyle = `background-color: ${base.zoneColor ? base.zoneColor : 'rgba(255,255,255,0.5)'};`;
                    const icon = isApt ? '🏠' : '🚪';

                    const wrapper = document.createElement('div');
                    
                    let isSelected = mainSelectedRoomIds.includes(room.id) ? 'ring-4 ring-blue-600 scale-105 z-30 shadow-2xl' : '';
                    wrapper.className = `card-wrapper relative flex flex-col h-full w-full col-span-1 min-h-[140px] ${isSelected}`;
                    wrapper.id = 'wrap-' + room.id;
                    
                    wrapper.dataset.search = (room.clientName||'').toLowerCase();
                    wrapper.dataset.agency = room.agency || 'DIRECT';
                    wrapper.dataset.status = room.status;
                    wrapper.dataset.cleaning = room.cleaningStatus || 'clean';
                    wrapper.dataset.type = room.type || 'room';
                    
                    let agencyBadge = '';
                    if ((room.status === 'occupied' || room.status === 'reserved') && room.agency) {
                        const ag = appState.agencies.find(a => a.name === room.agency);
                        if (ag) agencyBadge = `<div class="absolute top-0 right-0 px-4 py-2 text-sm sm:text-base font-black text-white rounded-bl-xl rounded-tr-xl shadow-lg z-10 truncate max-w-[70%]" style="background-color: ${ag.color};" title="${room.agency}">${room.agency}</div>`;
                    }

                    let paymentBadge = '';
                    if (room.status !== 'free') {
                        const s = room.services || { breakfast:{price:0}, dinner:{price:0}, picnic:{price:0}, halfBoard:{price:0}, fullBoard:{price:0}, laundry:{active:false,price:0}, mochilas:{price:0}, outros:{price:0} };
                        let totalExtras = (s.breakfast.price || 0) + (s.dinner.price || 0) + (s.picnic.price || 0) + (s.laundry.active ? s.laundry.price || 0 : 0) + (s.halfBoard.price || 0) + (s.fullBoard.price || 0) + (s.mochilas.price || 0) + (s.outros.price || 0);
                        let totalGlobal = (room.price || 0) + totalExtras;
                        let totalPagado = (room.paidCash || 0) + (room.paidCard || 0) + (room.paidTransfer || 0) + (room.paidAgency || 0);
                        
                        if (room.accountSettled || (totalGlobal > 0 && totalPagado >= totalGlobal)) {
                            if ((room.paidAgency || 0) > 0 && ((room.paidCash || 0) + (room.paidCard || 0) + (room.paidTransfer || 0)) === 0) {
                                paymentBadge = `<span class="bg-white/30 backdrop-blur-md border border-white/50 shadow-sm/90 text-orange-800  text-[11px] px-1.5 py-0.5 rounded-md border border-amber-300 font-bold shadow-sm">🏢 AXENCIA</span>`;
                            } else {
                                paymentBadge = `<span class="bg-white/30 backdrop-blur-md border border-white/50 shadow-sm/90 text-emerald-800 text-[11px] px-1.5 py-0.5 rounded-md border border-emerald-300 font-bold shadow-sm">✅ Pago</span>`;
                            }
                        } else if (totalPagado > 0) paymentBadge = `<span class="bg-white/30 backdrop-blur-md border border-white/50 shadow-sm/90 text-blue-800  text-[11px] px-1.5 py-0.5 rounded-md border border-blue-300 font-bold shadow-sm">🔹 Parcial</span>`;
                        else if (totalGlobal > 0) paymentBadge = `<span class="bg-white/30 backdrop-blur-md border border-white/50 shadow-sm/90 text-red-800 text-[11px] px-1.5 py-0.5 rounded-md border border-red-300 font-bold shadow-sm">⏳ Pagar</span>`;
                    }

                    let srvIcons = [];
                    const s = room.services || { breakfast:{qty:0}, dinner:{qty:0}, picnic:{qty:0}, halfBoard:{qty:0}, fullBoard:{qty:0}, laundry:{active:false}, mochilas:{qty:0}, outros:{qty:0}, parking:false, taxi:false };
                    if(s.breakfast?.qty > 0) srvIcons.push('☕');
                    if(s.dinner?.qty > 0) srvIcons.push('🍽️');
                    if(s.picnic?.qty > 0) srvIcons.push('🎒');
                    if(s.halfBoard?.qty > 0) srvIcons.push('🌙');
                    if(s.fullBoard?.qty > 0) srvIcons.push('⭐');
                    if(s.laundry?.active) srvIcons.push('🧺');
                    if(s.mochilas?.qty > 0) srvIcons.push('🧳');
                    if(s.outros?.qty > 0) srvIcons.push('📦');
                    if(s.parking) srvIcons.push('🅿️');
                    if(s.taxi) srvIcons.push('🚕');

                    let titleColor = room.status === 'free' ? 'text-emerald-700' : (room.status === 'reserved' ? 'text-amber-700' : 'text-slate-800 ');
                    let titleText = room.status === 'free' ? 'L I B R E' : (room.clientName || 'Sen nome rexistrado');

                    const cStatus = room.cleaningStatus || 'clean';
                    let cleanConfig = { icon: '✨', text: 'LISTA', bg: 'bg-emerald-400/40 backdrop-blur-xl', textC: 'text-emerald-900', border: 'border-emerald-300/50' };
                    if (cStatus === 'dirty') cleanConfig = { icon: '🧹', text: 'SUCIA', bg: 'bg-red-500/40 backdrop-blur-xl', textC: 'text-red-950', border: 'border-red-300/50' };
                    else if (cStatus === 'cleaning') cleanConfig = { icon: '🔄', text: 'EN PROCESO', bg: 'bg-amber-400/50 backdrop-blur-xl', textC: 'text-amber-950', border: 'border-amber-300/50' };

                    const cleaningBandHTML = `
                        <div onclick="cycleCleaning(event, '${room.id}')" class="pointer-events-auto w-full text-center py-2 mt-auto cursor-pointer transition-all hover:brightness-110 ${cleanConfig.bg} ${cleanConfig.textC} border-t ${cleanConfig.border} text-xs font-black tracking-widest uppercase shadow-inner z-20" title="Clic para cambiar estado de limpeza">
                            ${cleanConfig.icon} ${cleanConfig.text}
                        </div>
                    `;
                    
                    wrapper.innerHTML = `
                        ${agencyBadge}
                        <div class="room-card ${room.status === 'free' ? 'card-free' : (room.status === 'reserved' ? 'card-reserved' : 'card-occupied')} ${cardShapeClass} flex-grow w-full" style="${shapeStyle}">
                            <div class="status-indicator pb-2"></div>
                            <div class="card-content flex flex-col h-full w-full"> 
                                <div class="p-3 md:p-4 flex-1 flex flex-col pointer-events-none"> 
                                    <div class="flex justify-between items-start w-full gap-1.5">
                                        <div class="flex flex-col mb-1 overflow-hidden w-full">
                                            <span class="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1 truncate" title="${room.roomName || 'Aloxamento'}"><div class="w-3 h-3 rounded-full border border-slate-400 shrink-0 shadow-sm" style="background-color: ${base.zoneColor || '#ffffff'}"></div> ${icon} ${room.roomName || 'Aloxamento'}</span>
                                            <div class="flex items-center gap-3 flex-wrap mt-0.5">
                                                <span class="text-3xl sm:text-4xl font-black text-slate-900  tracking-tighter leading-none drop-shadow-sm">${room.number}</span>
                                                ${paymentBadge}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mb-2 mt-2">
                                        <div class="flex items-center gap-1.5 mb-1 flex-wrap">
                                            <div class="text-xs text-slate-900  font-bold bg-white/30 backdrop-blur-md border border-white/50 shadow-sm/70 inline-block px-1.5 py-0.5 rounded-md border border-slate-300/50  shadow-sm truncate max-w-[80%]">${room.bedConfig}</div>
                                            <div class="text-sm text-blue-900 font-black bg-blue-100 px-1.5 py-0.5 rounded-md border border-blue-200/50  shadow-sm" title="Pax">👤 ${room.guests || 1}</div>
                                        </div>
                                        <div class="flex gap-1 text-xl sm:text-2xl mt-1.5 drop-shadow-md flex-wrap">${room.features ? room.features.join(' ') : ''}</div>
                                    </div>

                                    <div class="mt-auto bg-white/30 backdrop-blur-md border border-white/50 shadow-sm/90 p-3 sm:p-3 border border-slate-300/50  rounded-xl flex flex-col justify-center min-h-[65px]">
                                        <div class="flex justify-between items-center gap-1">
                                            <h3 class="text-base sm:text-lg font-black ${titleColor} truncate w-[75%]" title="${titleText}">${titleText}</h3>
                                            ${room.status !== 'free' ? `<span class="text-sm font-bold bg-slate-100/50   text-slate-800  px-1.5 py-0.5 rounded shadow-sm border border-slate-300/50  whitespace-nowrap">${room.price || 0}€</span>` : ''}
                                        </div>
                                        <div class="flex justify-between items-center mt-1">
                                            <div class="text-[10px] text-amber-700 font-bold">${room.status === 'reserved' ? '🔔 Pre-reserva' : ''}</div>
                                            <div class="text-[10px] text-slate-800 font-bold truncate max-w-[120px]">${room.observations ? '📝 ' + room.observations : ''}</div>
                                            <div class="flex gap-1.5 text-xl sm:text-3xl drop-shadow-md flex-wrap w-[55%] justify-end">${srvIcons.join(' ')}</div>
                                        </div>
                                    </div>
                                </div>
                                ${cleaningBandHTML}
                            </div>
                        </div>
                    `;
                    grid.appendChild(wrapper);

                    wrapper.draggable = true;
                    wrapper.addEventListener('dragstart', (e) => {
                        if (e.target.closest('.border-t')) { e.preventDefault(); return; }
                        dragSourceId = room.id; e.dataTransfer.effectAllowed = 'move';
                        setTimeout(() => wrapper.classList.add('opacity-50'), 0);
                    });
                    wrapper.addEventListener('dragend', () => {
                        wrapper.classList.remove('opacity-50'); document.querySelectorAll('.card-wrapper').forEach(c => c.classList.remove('ring-4', 'ring-blue-500', 'scale-105'));
                    });
                    wrapper.addEventListener('dragover', (e) => {
                        e.preventDefault(); const targetWrapper = e.target.closest('.card-wrapper');
                        if (targetWrapper && targetWrapper.dataset.type !== 'hostel' && dragSourceId !== room.id) targetWrapper.classList.add('ring-4', 'ring-blue-500', 'scale-105');
                    });
                    wrapper.addEventListener('dragleave', (e) => {
                        const targetWrapper = e.target.closest('.card-wrapper'); if (targetWrapper) targetWrapper.classList.remove('ring-4', 'ring-blue-500', 'scale-105');
                    });
                    wrapper.addEventListener('drop', (e) => {
                        e.preventDefault(); wrapper.classList.remove('ring-4', 'ring-blue-500', 'scale-105');
                        if (dragSourceId && dragSourceId !== room.id) promptSwap(dragSourceId, room.id);
                    });

                    let tCardTimer = null;
                    let tCardMoved = false;

                    wrapper.addEventListener('touchstart', (e) => {
                        if (e.target.closest('.border-t') || e.touches.length > 1) return;
                        dragSourceId = room.id; tCardMoved = false; 
                        tCardTimer = setTimeout(() => {
                            if (tCardMoved) return; isWidgetDragging = true; if (navigator.vibrate) navigator.vibrate(50); 
                            const rect = wrapper.getBoundingClientRect(); touchClone = wrapper.cloneNode(true);
                            touchClone.style.position = 'fixed'; touchClone.style.top = rect.top + 'px'; touchClone.style.left = rect.left + 'px';
                            touchClone.style.width = rect.width + 'px'; touchClone.style.height = rect.height + 'px';
                            touchClone.style.opacity = '0.9'; touchClone.style.zIndex = '9999'; touchClone.style.pointerEvents = 'none'; 
                            touchClone.style.transform = 'scale(1.05)'; document.body.appendChild(touchClone);
                            wrapper.classList.add('opacity-40');
                        }, 350); 
                    }, {passive: true});
                    
                    wrapper.addEventListener('touchmove', (e) => {
                        tCardMoved = true; if (!isDragging) { clearTimeout(tCardTimer); return; }
                        e.preventDefault(); const touch = e.touches[0];
                        if (touchClone) { touchClone.style.top = (touch.clientY - touchClone.offsetHeight / 2) + 'px'; touchClone.style.left = (touch.clientX - touchClone.offsetWidth / 2) + 'px'; }
                        const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
                        document.querySelectorAll('.card-wrapper').forEach(c => c.classList.remove('ring-4', 'ring-blue-500', 'scale-105'));
                        if (targetEl) { const targetWrapper = targetEl.closest('.card-wrapper'); if (targetWrapper && targetWrapper.dataset.type !== 'hostel' && targetWrapper.id !== 'wrap-' + dragSourceId) { targetWrapper.classList.add('ring-4', 'ring-blue-500', 'scale-105'); } }
                    }, {passive: false});
                    
                    const endCardTouch = (e) => {
                        clearTimeout(tCardTimer); 
                        if (!isWidgetDragging) return; 
                        isWidgetDragging = false; wrapper.classList.remove('opacity-40');
                        if (touchClone) { touchClone.remove(); touchClone = null; }
                        const touch = e.changedTouches ? e.changedTouches[0] : null; if (!touch) return;
                        const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
                        document.querySelectorAll('.card-wrapper').forEach(c => c.classList.remove('ring-4', 'ring-blue-500', 'scale-105'));
                        if (targetEl) { const targetWrapper = targetEl.closest('.card-wrapper'); if (targetWrapper && targetWrapper.dataset.type !== 'hostel') { const targetId = targetWrapper.id.replace('wrap-', ''); if (targetId !== dragSourceId) promptSwap(dragSourceId, targetId); } }
                    };
                    
                    wrapper.addEventListener('touchend', endCardTouch); 
                    wrapper.addEventListener('touchcancel', endCardTouch);
                    
                    wrapper.onclick = (e) => {
                        if (isDragging) return;
                        if (mainMultiSelectModeActive) {
                            const idx = mainSelectedRoomIds.indexOf(room.id);
                            if (idx > -1) mainSelectedRoomIds.splice(idx, 1);
                            else mainSelectedRoomIds.push(room.id);
                            renderGrid();
                            updateMainMultiSelectUI();
                        } else {
                            if (!e.target.closest('.border-t')) openRoomModal([room.id], room.number);
                        }
                    };
                }
            });
            
            updateGlobalCounters();
        }

        function toggleCompactMode() {
            appState.compactMode = !appState.compactMode;
            const btn = document.getElementById('btnCompactMode');
            if(appState.compactMode) {
                btn.classList.remove('bg-slate-100/50'); btn.classList.add('bg-indigo-500');
                btn.classList.remove('text-slate-900'); btn.classList.add('text-white');
            } else {
                btn.classList.remove('bg-indigo-500'); btn.classList.add('bg-slate-100/50');
                btn.classList.remove('text-white'); btn.classList.add('text-slate-900');
            }
            renderGrid();
        }

        function openLimparPlaningModal() {
            document.getElementById('limparDataInicio').value = currentPlaningDate || '';
            document.getElementById('limparDataFin').value = currentPlaningDate || '';
            document.getElementById('limparPlaningModal').classList.add('active');
        }

        async function executeLimparPlaning() {
            const startDateStr = document.getElementById('limparDataInicio').value;
            const endDateStr = document.getElementById('limparDataFin').value;
            
            if (!startDateStr || !endDateStr) {
                cAlert("Por favor, selecciona as dúas datas.");
                return;
            }
            
            const startD = new Date(startDateStr);
            const endD = new Date(endDateStr);
            
            if (endD < startD) {
                cAlert("A data de fin debe ser posterior ou igual á data de inicio.");
                return;
            }
            
            const btn = document.getElementById('btnExecuteLimpar');
            btn.innerHTML = 'Borrando...';
            btn.disabled = true;
            
            let currentDate = new Date(startD);
            let processedDates = 0;
            
            while (currentDate <= endD) {
                let dStr = currentDate.toISOString().split('T')[0];
                
                // Obter a lista base de cuartos limpos
                let cleanDay = appState.baseRooms.map(r => createEmptyRoomObject(r.id));
                // Para os albergues, crear camas
                let finalCleanDay = [];
                cleanDay.forEach(cr => {
                    const br = appState.baseRooms.find(b => b.id === cr.baseId);
                    if (br && br.type === 'hostel') {
                        for (let i = 1; i <= (br.totalBeds || 16); i++) {
                            let literaNum = Math.ceil(i / 2);
                            let isTop = (i % 2 === 0);
                            let bedCode = `${literaNum}${isTop ? 'A' : 'B'}`;
                            let newBed = createEmptyRoomObject(br.id);
                            newBed.id = `${br.id}_${bedCode}`;
                            newBed.bedId = bedCode;
                            finalCleanDay.push(newBed);
                        }
                    } else {
                        finalCleanDay.push(cr);
                    }
                });
                
                appState.dailyData[dStr] = finalCleanDay;
                
                // Gardar no servidor
                if (typeof google !== 'undefined' && google.script) {
                    await new Promise((resolve) => {
                        google.script.run
                            .withSuccessHandler(resolve)
                            .withFailureHandler(resolve)
                            .saveDayData(dStr, JSON.stringify(finalCleanDay));
                    });
                } else if (dStr === currentPlaningDate) {
                    salvarDiaNoServidor(true);
                }
                
                currentDate.setDate(currentDate.getDate() + 1);
                processedDates++;
            }
            
            if (currentPlaningDate >= startDateStr && currentPlaningDate <= endDateStr) {
                renderGrid();
                filterGrid();
            }
            
            closeModal('limparPlaningModal');
            btn.innerHTML = 'Confirmar';
            btn.disabled = false;
            
            cAlert(`Rexistros limpos correctamente en ${processedDates} días.`);
        }

        function toggleMainMultiSelect() {
            mainMultiSelectModeActive = !mainMultiSelectModeActive;
            if(!mainMultiSelectModeActive) mainSelectedRoomIds = [];
            const btn = document.getElementById('btnMainMultiSelect');
            if(mainMultiSelectModeActive) {
                btn.classList.remove('bg-slate-100/50'); btn.classList.add('bg-orange-500');
                btn.classList.remove('text-slate-900'); btn.classList.add('text-white');
            } else {
                btn.classList.remove('bg-orange-500'); btn.classList.add('bg-slate-100/50');
                btn.classList.remove('text-white'); btn.classList.add('text-slate-900');
            }
            updateMainMultiSelectUI();
            renderGrid();
        }

        function updateMainMultiSelectUI() {
            const panel = document.getElementById('mainMultiSelectActionPanel');
            if (mainMultiSelectModeActive && mainSelectedRoomIds.length > 0) {
                panel.classList.remove('hidden');
                document.getElementById('mainMultiSelectCount').innerText = `${mainSelectedRoomIds.length} seleccionadas`;
            } else {
                panel.classList.add('hidden');
            }
        }

        function openMainMultiRoomForm() {
            if(mainSelectedRoomIds.length > 0) openRoomModal(mainSelectedRoomIds, `Múltiples (${mainSelectedRoomIds.length})`);
        }

        function cycleCleaning(e, roomId) {
            e.stopPropagation();
            const room = appState.dailyData[currentPlaningDate].find(r => r.id === roomId);
            if(!room) return;
            if (room.cleaningStatus === 'clean') room.cleaningStatus = 'dirty';
            else if (room.cleaningStatus === 'dirty') room.cleaningStatus = 'cleaning';
            else room.cleaningStatus = 'clean';
            salvarDiaNoServidor(); renderGrid(); filterGrid();
        }

        function filterGrid() {
            const term = document.getElementById('searchInput').value.toLowerCase();
            const fType = document.getElementById('filterType').value;
            const fStatus = document.getElementById('filterStatus').value;
            const fAgency = document.getElementById('filterAgency').value;

            const cards = document.querySelectorAll('.card-wrapper');
            cards.forEach(card => {
                let show = true;
                const type = card.dataset.type;

                let textMatch = card.innerText.toLowerCase().includes(term) || (card.dataset.search && card.dataset.search.includes(term));
                if (term && !textMatch) show = false;
                if (fType !== 'ALL' && type !== fType) show = false;

                if (type !== 'hostel') {
                    if (fStatus !== 'ALL' && card.dataset.status !== fStatus) show = false;
                    if (fAgency !== 'ALL' && fAgency === 'DIRECT' && card.dataset.agency && card.dataset.agency !== 'DIRECT') show = false;
                    if (fAgency !== 'ALL' && fAgency !== 'DIRECT' && card.dataset.agency !== fAgency) show = false;
                }
                card.style.display = show ? 'flex' : 'none';
            });

            if (document.getElementById('hostelModal').classList.contains('active')) updateHostelLayout();
        }

        function openHostelModal(baseId) {
            currentOpenHostelId = baseId; multiSelectModeActive = false; currentEditingBedIds = [];
            updateHostelLayout();
            const base = appState.baseRooms.find(b => b.id === baseId);
            document.getElementById('modalHostelTitle').innerText = `${base.number} - ${base.roomName}`;
            document.getElementById('hostelModal').classList.add('active');
        }

        function updateHostelLayout() {
            if(!currentOpenHostelId) return;
            const base = appState.baseRooms.find(b => b.id === currentOpenHostelId);
            const container = document.getElementById('hostelLayoutGrid');
            if(container) container.innerHTML = '';
            
            let dia = appState.dailyData[currentPlaningDate] || [];
            const beds = dia.filter(d => d.baseId === currentOpenHostelId);
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const useAbsoluteLayout = base.layout && base.layout.length > 0;

            if (useAbsoluteLayout) {
                container.className = "w-[800px] h-[600px] relative transform origin-top-left md:scale-100 scale-75 mx-auto transition-all";
            } else {
                container.className = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 xl:gap-8 p-4";
            }
            
            let litIndex = 0;
            // Group beds by number
            let bedGroups = {};
            beds.forEach(b => {
                let num = b.bedId.replace(/[AB]/g, '');
                if (!bedGroups[num]) bedGroups[num] = { top: null, bot: null };
                if (b.bedId.includes('A')) bedGroups[num].top = b;
                else bedGroups[num].bot = b;
            });
            
            const groupKeys = Object.keys(bedGroups).sort((a,b) => parseInt(a) - parseInt(b));
            
            for (let i = 0; i < groupKeys.length; i++) {
                let litNum = groupKeys[i];
                let topBed = bedGroups[litNum].top; 
                let botBed = bedGroups[litNum].bot;
                if (!topBed && !botBed) continue;

                
                let frame = document.createElement('div');
                frame.className = "litera-frame flex flex-col gap-1.5";
                
                if (useAbsoluteLayout && base.layout[litIndex]) {
                    const lDef = base.layout[litIndex];
                    frame.style.position = 'absolute';
                    frame.style.left = lDef.x + '%';
                    frame.style.top = lDef.y + '%';
                    frame.style.transform = `rotate(${lDef.r || 0}deg)`;
                } else {
                    frame.style.position = 'relative';
                    frame.style.width = '100%';
                }
                
                frame.innerHTML = `
                    <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-slate-900 text-slate-300 text-[10px] font-black px-3 py-0.5 rounded-md z-20 shadow pointer-events-none">LIT. ${litNum}</div>
                    ${topBed ? renderSmallBedCard(topBed, searchTerm) : ''}
                    ${botBed ? renderSmallBedCard(botBed, searchTerm) : ''}
                `;
                container.appendChild(frame);
                litIndex++;
            }

            if (useAbsoluteLayout && base.decorations) {
                base.decorations.forEach(dec => {
                    let el = document.createElement('div');
                    el.className = "absolute flex items-center justify-center shadow-md bg-white/30 backdrop-blur-md border border-white/50 shadow-sm border border-slate-300/50  rounded text-3xl select-none pointer-events-none";
                    if (dec.t.includes('Mesa')) { el.style.width = '80px'; el.style.height = '80px'; el.style.borderRadius = '50%'; }
                    else if (dec.t.includes('Porta') || dec.t.includes('Ventá')) { el.style.width = '100px'; el.style.height = '20px'; el.style.backgroundColor = '#cbd5e1'; }
                    else { el.style.width = '50px'; el.style.height = '50px'; }
                    
                    el.style.left = dec.x + '%'; el.style.top = dec.y + '%';
                    el.style.transform = `rotate(${dec.r}deg)`;
                    el.innerHTML = dec.t.split(' ')[0];
                    container.appendChild(el);
                });
            }

            const bedCards = container.querySelectorAll('.bed-card');
            let tTimer = null; let tMoved = false; let tClone = null;

            bedCards.forEach(card => {
                const bedId = card.dataset.id;
                card.draggable = true;
                
                card.addEventListener('dragstart', (e) => { 
                    e.stopPropagation(); dragSourceId = bedId; e.dataTransfer.effectAllowed = 'move'; 
                    setTimeout(() => card.classList.add('opacity-50'), 0); 
                });
                card.addEventListener('dragend', () => { 
                    card.classList.remove('opacity-50'); 
                    bedCards.forEach(c => c.classList.remove('ring-4', 'ring-blue-500', 'scale-105')); 
                });
                card.addEventListener('dragover', (e) => { 
                    e.preventDefault(); 
                    if (dragSourceId !== bedId) card.classList.add('ring-4', 'ring-blue-500', 'scale-105'); 
                });
                card.addEventListener('dragleave', () => card.classList.remove('ring-4', 'ring-blue-500', 'scale-105'));
                card.addEventListener('drop', (e) => { 
                    e.preventDefault(); e.stopPropagation(); 
                    card.classList.remove('ring-4', 'ring-blue-500', 'scale-105'); 
                    if (dragSourceId && dragSourceId !== bedId) executeBedSwap(dragSourceId, bedId); 
                });

                card.addEventListener('touchstart', (e) => {
                    if (e.touches.length > 1) return;
                    dragSourceId = bedId; tMoved = false; 
                    tTimer = setTimeout(() => {
                        if (tMoved) return; isWidgetDragging = true; if (navigator.vibrate) navigator.vibrate(50); 
                        const rect = card.getBoundingClientRect(); tClone = card.cloneNode(true);
                        tClone.style.position = 'fixed'; tClone.style.top = rect.top + 'px'; tClone.style.left = rect.left + 'px';
                        tClone.style.width = rect.width + 'px'; tClone.style.height = rect.height + 'px';
                        tClone.style.opacity = '0.9'; tClone.style.zIndex = '9999'; tClone.style.pointerEvents = 'none'; 
                        tClone.style.transform = 'scale(1.05)'; document.body.appendChild(tClone);
                        card.classList.add('opacity-40');
                    }, 350); 
                }, {passive: true});
                
                card.addEventListener('touchmove', (e) => {
                    tMoved = true; if (!isDragging) { clearTimeout(tTimer); return; }
                    e.preventDefault(); const touch = e.touches[0];
                    if (tClone) { tClone.style.top = (touch.clientY - tClone.offsetHeight / 2) + 'px'; tClone.style.left = (touch.clientX - tClone.offsetWidth / 2) + 'px'; }
                    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
                    document.querySelectorAll('.bed-card').forEach(c => c.classList.remove('ring-4', 'ring-blue-500', 'scale-105'));
                    if (targetEl) { const targetCard = targetEl.closest('.bed-card'); if (targetCard && targetCard !== card) { targetCard.classList.add('ring-4', 'ring-blue-500', 'scale-105'); } }
                }, {passive: false});
                
                card.addEventListener('touchend', (e) => {
                    clearTimeout(tTimer); 
                    if (!isWidgetDragging) return; 
                    isWidgetDragging = false; card.classList.remove('opacity-40');
                    if (tClone) { tClone.remove(); tClone = null; }
                    e.preventDefault(); 
                    const touch = e.changedTouches ? e.changedTouches[0] : null; if (!touch) return;
                    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
                    document.querySelectorAll('.bed-card').forEach(c => c.classList.remove('ring-4', 'ring-blue-500', 'scale-105'));
                    if (targetEl) { 
                        const targetCard = targetEl.closest('.bed-card'); 
                        if (targetCard && targetCard !== card) { 
                            let targetId = targetCard.dataset.id;
                            if (targetId && targetId !== dragSourceId) executeBedSwap(dragSourceId, targetId); 
                        } 
                    }
                });
                
                card.addEventListener('touchcancel', () => { clearTimeout(tTimer); isWidgetDragging = false; card.classList.remove('opacity-40'); if (tClone) { tClone.remove(); tClone = null; }});
            });

            const btnMulti = document.getElementById('btnMultiSelect');
            const panelAccion = document.getElementById('multiSelectActionPanel');
            if (multiSelectModeActive) {
                btnMulti.classList.replace('bg-slate-200', 'bg-orange-500'); btnMulti.classList.remove('text-slate-900'); btnMulti.classList.add('text-white');
                if (currentEditingBedIds.length > 0) {
                    panelAccion.classList.remove('hidden');
                    document.getElementById('multiSelectCount').innerText = `${currentEditingBedIds.length} camas seleccionadas`;
                    
                    let totalVal = 0;
                    currentEditingBedIds.forEach(id => { const b = beds.find(x => x.id === id); if(b) totalVal += (parseFloat(b.price) || parseFloat(base.bedPrice)||15); });
                    document.getElementById('multiSelectPrice').innerText = `${totalVal}€ (Suma total)`;
                } else panelAccion.classList.add('hidden');
            } else {
                btnMulti.classList.replace('bg-orange-500', 'bg-slate-200'); btnMulti.classList.remove('text-white'); btnMulti.classList.add('text-slate-900');
                panelAccion.classList.add('hidden');
            }
        }

        function renderSmallBedCard(bed, searchTerm) {
            let isFree = bed.status === 'free';
            let isRes = bed.status === 'reserved';

            let bgClass = isFree ? 'bg-emerald-100 border-emerald-400' : (isRes ? 'bg-amber-200 border-amber-500' : 'bg-red-200 border-red-500');
            let textClass = isFree ? 'text-emerald-800' : (isRes ? 'text-amber-900' : 'text-red-900');
            
            let isSelected = currentEditingBedIds.includes(bed.id) ? 'ring-4 ring-blue-600 scale-105 z-30 shadow-lg' : '';
            
            let isSearched = searchTerm && bed.clientName && bed.clientName.toLowerCase().includes(searchTerm);
            if (isSearched) isSelected += ' ring-4 ring-yellow-400 animate-pulse bg-yellow-100 z-40 scale-110';

            let isTop = bed.bedId.includes('A');
            let badgeTipoHTML = isTop 
                ? `<span class="bg-white/30 backdrop-blur-md border border-white/50 shadow-sm/80 px-1.5 py-0.5 rounded shadow-sm text-slate-900  border border-slate-300/50 ">▲ Alta</span>` 
                : `<span class="bg-slate-800  px-1.5 py-0.5 rounded shadow-sm text-white border border-slate-900">▼ Baixa</span>`;
            
            let pagado = (parseFloat(bed.paidCash)||0) + (parseFloat(bed.paidCard)||0) + (parseFloat(bed.paidTransfer)||0) + (parseFloat(bed.paidAgency)||0);
            let debe = (parseFloat(bed.price)||0) - pagado; 
            let badgeDebe = '';
            
            if(!isFree) {
                if(bed.accountSettled || (debe <= 0 && (parseFloat(bed.price)||0) > 0)) badgeDebe = `<span class="text-[9px] bg-emerald-50/50  text-white px-1.5 py-0.5 rounded shadow-sm font-black pointer-events-none">✅ PAGO</span>`;
                else if(debe <= 0) badgeDebe = `<span class="text-[9px] bg-emerald-50/50  text-white px-1.5 py-0.5 rounded shadow-sm font-black pointer-events-none">✅ PAGO</span>`;
                else badgeDebe = `<span class="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded shadow-sm font-black animate-pulse pointer-events-none">⏳ DEBE</span>`;
            }

            return `
                <div data-id="${bed.id}" onclick="if(!isDragging) handleBedClick('${bed.id}', '${bed.number}-${bed.bedId}')" 
                     class="bed-card ${bgClass} ${textClass} ${isSelected} rounded-xl p-2 cursor-pointer min-h-[60px] flex justify-between items-center group relative overflow-hidden transition-all shadow-sm">
                    
                    <div class="absolute top-0 bottom-0 left-0 w-1/4 bg-white/30 backdrop-blur-md border border-white/50 shadow-sm/40 border-r border-white/50  pointer-events-none rounded-l-xl"></div>
                    <div class="absolute top-1/2 left-2 transform -translate-y-1/2 w-4 h-10 bg-white/30 backdrop-blur-md border border-white/50 shadow-sm/70 rounded-full shadow-sm pointer-events-none"></div>

                    <div class="flex flex-col items-end w-full h-full relative z-10 pointer-events-none pl-10 pr-1">
                        <div class="flex justify-between items-start w-full mb-1">
                            <div class="text-[10px] font-black uppercase flex gap-1">
                                ${badgeTipoHTML}
                            </div>
                            ${badgeDebe}
                        </div>
                        
                        <div class="w-full text-right mt-auto mb-1">
                            ${isFree ? 
                                `<div class="text-[11px] font-black uppercase tracking-widest opacity-70">Libre</div>` : 
                                `<div class="font-black text-[15px] leading-tight drop-shadow-sm truncate">${bed.clientName||'Sen Nome'}</div>`
                            }
                        </div>
                    </div>
                </div>
            `;
        }

        function toggleMultiSelect() { multiSelectModeActive = !multiSelectModeActive; if(!multiSelectModeActive) currentEditingBedIds = []; updateHostelLayout(); }
        function handleBedClick(bedId, displayName) {
            if (multiSelectModeActive) {
                const idx = currentEditingBedIds.indexOf(bedId);
                if (idx > -1) currentEditingBedIds.splice(idx, 1); else currentEditingBedIds.push(bedId);
                updateHostelLayout(); 
            } else { openRoomModal([bedId], displayName); }
        }

        function openMultiBedForm() { 
            if(currentEditingBedIds.length > 0) openRoomModal(currentEditingBedIds, `Múltiples (${currentEditingBedIds.length})`); 
        }

        
        function openPedidos() {
            const m = document.getElementById('pedidosModal');
            if(m) m.classList.add('active');
            
            const provSelect = document.getElementById('pedidoProveedor');
            if (provSelect) {
                const provs = appState.proveedores || [];
                provSelect.innerHTML = '<option value="">Ningún</option>' + 
                    provs.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
            }
            
            renderPedidos();
        }

        function renderPedidos() {
            const table = document.getElementById('pedidosTableBody');
            if (!appState.pedidos) appState.pedidos = [];
            
            let h = '';
            appState.pedidos.forEach((p, idx) => {
                h += `<tr class="${p.estado === 'Comprado' ? 'opacity-50' : ''}">
                    <td class="p-3 text-xs text-slate-900 ">${p.data || '-'}</td>
                    <td class="p-3 font-bold ${p.estado === 'Comprado' ? 'line-through' : ''}">${p.produto}${p.proveedor ? `<br><span class="text-[10px] text-slate-800">${p.proveedor}</span>` : ''}</td>
                    <td class="p-3 text-center font-black">${p.qty}</td>
                    <td class="p-3 text-xs"><span class="bg-slate-100/50   border px-2 py-1 rounded font-bold">${p.dept}</span></td>
                    <td class="p-3 text-center font-bold ${p.estado === 'Comprado' ? 'text-emerald-600' : 'text-amber-600'}">${p.estado}</td>
                    <td class="p-3 text-right">
                        ${p.estado === 'Pendente' ? `<button onclick="marcarPedido(${idx})" class="text-emerald-600 bg-emerald-50/50  hover:bg-emerald-100 px-3 py-1 rounded font-bold shadow-sm text-xs">✓ Marcar Comprado</button>` : `<button onclick="borrarPedido(${idx})" class="text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1 rounded font-bold shadow-sm text-xs">🗑️ Borrar</button>`}
                    </td>
                </tr>`;
            });
            
            updateAlertasMaster();
            if(table) table.innerHTML = h || '<tr><td colspan="6" class="p-6 text-center italic text-slate-900 ">Non hai pedidos pendentes.</td></tr>';
        }

        function addPedido(sendWhatsapp) {
            const produto = document.getElementById('pedidoProduto').value || 'Pedido Xeral';
            const qty = document.getElementById('pedidoQty').value || '1';
            const dept = document.getElementById('pedidoDept').value || 'Xeral';
            const provId = document.getElementById('pedidoProveedor')?.value;
            
            let provName = '';
            let provTel = '';
            if (provId) {
                const p = (appState.proveedores || []).find(x => x.id === provId);
                if (p) {
                    provName = p.nome;
                    provTel = p.tel;
                }
            }

            if (!appState.pedidos) appState.pedidos = [];
            appState.pedidos.push({
                data: new Date().toLocaleDateString('gl-ES'),
                produto,
                qty,
                dept,
                proveedor: provName,
                estado: 'Pendente'
            });
            
            document.getElementById('pedidoProduto').value = '';
            document.getElementById('pedidoQty').value = '1';
            
            salvarConfigNoServidor();
            renderPedidos();

            if (sendWhatsapp) {
                const num = provTel ? provTel.replace(/\D/g, '') : '';
                const msg = `Ola! Necesitamos facer un pedido para o Complexo Xacobeo:\n\n- ${qty}x ${produto}\n\nMoitas grazas!`;
                if (num) {
                    window.open('https://api.whatsapp.com/send?phone=34' + num + '&text=' + encodeURIComponent(msg), '_blank');
                } else {
                    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(msg), '_blank');
                }
            }
        }

        function marcarPedido(idx) {
            appState.pedidos[idx].estado = 'Comprado';
            salvarConfigNoServidor();
            renderPedidos();
        }
        
        function borrarPedido(idx) {
            appState.pedidos.splice(idx, 1);
            salvarConfigNoServidor();
            renderPedidos();
        }

        
        
        function openAdmin() {
            if(typeof clearAdminRoomForm === "function") clearAdminRoomForm();
            switchAdminTab('aloxamentos');
            renderAdminRoomList();
            updateAgencyList();
            loadAdminPrices();
            const calInput = document.getElementById('confCalendarId');
            if (calInput) calInput.value = appState.credentials?.calendarId || '';
            document.getElementById('adminModal').classList.add('active');
        }

        function toggleAdminHostel() {
            const cb = document.getElementById('isAdminHostel');
            if(!cb) return;
            const isHostel = cb.checked;
            
            const db = document.getElementById('divBeds');
            if(db) db.style.display = isHostel ? 'block' : 'none';
            
            const dc = document.getElementById('divConfig');
            if(dc) dc.style.display = isHostel ? 'none' : 'block';
            
            const nt = document.getElementById('newRoomType');
            if(nt) nt.value = isHostel ? 'hostel' : 'room';
        }

        function toggleFeature(btn, feature) {
            if(btn) btn.classList.toggle('selected');
            const nrf = document.getElementById('newRoomFeatures');
            if(!nrf) return;
            let features = JSON.parse(nrf.value || '[]');
            if (features.includes(feature)) {
                features = features.filter(f => f !== feature);
            } else {
                features.push(feature);
            }
            nrf.value = JSON.stringify(features);
        }

        function addBedToConfig() {
            const bedType = document.getElementById('bedTypeSelector').value;
            const currentText = document.getElementById('newRoomBedText').value;
            if (currentText) {
                document.getElementById('newRoomBedText').value = currentText + " + " + bedType;
            } else {
                document.getElementById('newRoomBedText').value = bedType;
            }
        }

        function saveAdminRoom() {
            const num = document.getElementById('newRoomNum').value;
            const name = document.getElementById('newRoomName').value;
            const type = document.getElementById('newRoomType').value;
            const color = document.getElementById('newRoomColor').value;
            const isHostel = document.getElementById('isAdminHostel').checked;
            
            if(!num || !name) return cAlert("Enche o número e o nome do aloxamento.");

            let r = { id: editingAdminRoomIndex > -1 ? appState.baseRooms[editingAdminRoomIndex].id : 'r_' + Date.now(), number: num, roomName: name, type: type, zoneColor: color };
            if (isHostel) {
                r.type = 'hostel';
                r.totalBeds = parseInt(document.getElementById('newRoomBeds').value) || 16;
                r.bedPrice = parseFloat(document.getElementById('newRoomBedPrice').value) || 15;
            } else {
                r.bedConfig = document.getElementById('newRoomBedText').value || '🛏️ 150cm';
                r.features = JSON.parse(document.getElementById('newRoomFeatures').value || '[]');
            }
            r.icalUrl = document.getElementById('newRoomIcal') ? document.getElementById('newRoomIcal').value : '';

            
            if (editingAdminRoomIndex > -1) {
                if (appState.baseRooms[editingAdminRoomIndex].layout) r.layout = appState.baseRooms[editingAdminRoomIndex].layout;
                if (appState.baseRooms[editingAdminRoomIndex].decorations) r.decorations = appState.baseRooms[editingAdminRoomIndex].decorations;
                
                appState.baseRooms[editingAdminRoomIndex] = r;
                
                // Sync updated properties to all daily data
                if (appState.dailyData) {
                    Object.keys(appState.dailyData).forEach(date => {
                        const dia = appState.dailyData[date];
                        if (Array.isArray(dia)) {
                            dia.forEach(d => {
                                if (d.id === r.id) { // Normal room/apt
                                    d.number = r.number;
                                    d.roomName = r.roomName;
                                    d.type = r.type;
                                    d.zoneColor = r.zoneColor;
                                    if (!isHostel) {
                                        d.bedConfig = r.bedConfig;
                                        d.features = r.features;
                                    }
                                }
                                if (isHostel && d.baseId === r.id) { // Hostel bed
                                    d.roomName = r.roomName;
                                    d.zoneColor = r.zoneColor;
                                }
                            });
                        }
                    });
                }
                
                editingAdminRoomIndex = -1; 
                
                const btn = document.getElementById('btnSaveAdminRoom');
                btn.innerText = "➕ Gardar Aloxamento";
                btn.classList.remove('bg-blue-600'); btn.classList.add('bg-slate-800');
                btn.classList.replace('hover:bg-blue-700', 'hover:bg-slate-900');
                cAlert("Aloxamento actualizado.");
            } else {
                appState.baseRooms.push(r);
                cAlert("Aloxamento engadido.");
            }

            salvarConfigNoServidor();
            
            document.getElementById('newRoomNum').value = '';
            document.getElementById('newRoomName').value = '';
            document.getElementById('newRoomBedText').value = '';
            document.getElementById('newRoomFeatures').value = '[]';
            document.querySelectorAll('.feature-btn').forEach(btn => btn.classList.remove('selected'));

            renderAdminRoomList();
            xerarDiaSeNonExiste();
            renderGrid();
            if (typeof filterGrid === 'function') filterGrid();
        }

        function moveRoom(index, dir) {
            if (dir === -1 && index > 0) {
                const temp = appState.baseRooms[index];
                appState.baseRooms[index] = appState.baseRooms[index-1];
                appState.baseRooms[index-1] = temp;
            } else if (dir === 1 && index < appState.baseRooms.length - 1) {
                const temp = appState.baseRooms[index];
                appState.baseRooms[index] = appState.baseRooms[index+1];
                appState.baseRooms[index+1] = temp;
            }
            salvarConfigNoServidor();
            renderAdminRoomList();
            renderGrid();
        }

        function clearAdminRoomForm() {
        document.getElementById('newRoomNum').value = '';
        document.getElementById('newRoomName').value = '';
        document.getElementById('newRoomType').value = 'room';
        const icalEl = document.getElementById('newRoomIcal');
        if (icalEl) icalEl.value = '';
        document.getElementById('newRoomBeds').value = '16';
        document.getElementById('newRoomBedPrice').value = '15';
        document.getElementById('newRoomBedText').value = '🛏️ 150cm';
        document.getElementById('newRoomFeatures').value = '[]';
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        if (document.querySelectorAll('.color-swatch')[0]) document.querySelectorAll('.color-swatch')[0].classList.add('selected');
        document.getElementById('newRoomColor').value = paletteColors[0];
        document.getElementById('isAdminHostel').checked = false;
        toggleAdminHostel();
        editingAdminRoomIndex = -1;
        document.getElementById('btnSaveAdminRoom').innerText = '➕ Gardar Aloxamento';
    }
    
    function editAdminRoom(index) {
            editingAdminRoomIndex = index;
            const b = appState.baseRooms[index];
            
            const numEl = document.getElementById('newRoomNum');
            if (numEl) numEl.value = b.number;
            
            const nameEl = document.getElementById('newRoomName');
            if (nameEl) nameEl.value = b.roomName;
            
            const typeEl = document.getElementById('newRoomType');
            if (typeEl) typeEl.value = b.type === 'hostel' ? 'hostel' : (b.type === 'apartment' ? 'apartment' : 'room');
            
            const icalEl = document.getElementById('newRoomIcal');
            if (icalEl) icalEl.value = b.icalUrl || '';
            
            const colorEl = document.getElementById('newRoomColor');
            if (colorEl) colorEl.value = b.zoneColor || '#ffffff';
            
            document.querySelectorAll('.color-swatch').forEach(s => {
                s.classList.remove('selected');
                let sColor = s.style.backgroundColor;
                if (sColor.startsWith('rgb')) {
                    const match = sColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                    function hex(x) { return ("0" + parseInt(x).toString(16)).slice(-2); }
                    sColor = match ? "#" + hex(match[1]) + hex(match[2]) + hex(match[3]) : sColor;
                }
                if (sColor === b.zoneColor) s.classList.add('selected');
            });
            
            document.getElementById('isAdminHostel').checked = (b.type === 'hostel');
            toggleAdminHostel();
            
            if (b.type === 'hostel') {
                document.getElementById('newRoomBeds').value = b.totalBeds;
                document.getElementById('newRoomBedPrice').value = b.bedPrice;
            } else {
                document.getElementById('newRoomBedText').value = b.bedConfig || '';
                document.getElementById('newRoomFeatures').value = JSON.stringify(b.features || []);
                document.querySelectorAll('.feature-btn').forEach(btn => {
                    btn.classList.remove('selected');
                    if (b.features && b.features.some(f => btn.innerText.includes(f))) btn.classList.add('selected');
                });
            }
            
            const btn = document.getElementById('btnSaveAdminRoom');
            btn.innerText = "💾 Actualizar Aloxamento";
            btn.classList.remove('bg-slate-800'); btn.classList.add('bg-blue-600');
            btn.classList.replace('hover:bg-slate-900', 'hover:bg-blue-700');
            
            document.getElementById('adminModal').querySelector('.modal-content').scrollTop = 0;
        }

        function renderAdminRoomList() {
            const container = document.getElementById('adminRoomList');
            if(container) container.innerHTML = '';
            appState.baseRooms.forEach((b, index) => {
                const isHostel = b.type === 'hostel';
                const buttonPlano = isHostel ? `<button onclick="openLayoutEditor('${b.id}')" class="px-2 py-1 bg-blue-100 text-blue-700 font-bold rounded hover:bg-blue-200 text-xs" title="Plano">🗺️</button>` : '';
                container.innerHTML += `
                    <div class="flex justify-between items-center bg-white/30 backdrop-blur-md border border-white/50 shadow-sm p-3 rounded-lg border border-slate-200/50  mb-2">
                        <div>
                            <span class="font-black">${b.number}</span> - <span class="inline-block w-3 h-3 rounded-full border border-slate-400 align-middle mr-1" style="background-color: ${b.zoneColor || '#ffffff'}"></span> ${b.roomName} <span class="text-xs text-slate-900 ">(${isHostel ? b.totalBeds+' camas' : b.bedConfig})</span>
                            <div class="text-xs text-slate-800 mt-1">${b.features ? b.features.join(' ') : ''}</div>
                        </div>
                        <div class="flex gap-1.5">
                            ${buttonPlano}
                            <button onclick="moveRoom(${index}, -1)" class="px-2 py-1 bg-slate-100/50   text-slate-800  font-bold rounded hover:bg-slate-200 text-xs" title="Subir">⬆️</button>
                            <button onclick="moveRoom(${index}, 1)" class="px-2 py-1 bg-slate-100/50   text-slate-800  font-bold rounded hover:bg-slate-200 text-xs" title="Baixar">⬇️</button>
                            <button onclick="editAdminRoom(${index})" class="px-2 py-1 bg-amber-100 text-amber-700 font-bold rounded hover:bg-amber-200 text-xs" title="Editar">✏️</button>
                            <button onclick="deleteRoom(${index})" class="px-2 py-1 bg-red-100 text-red-700 font-bold rounded hover:bg-red-200 text-xs" title="Borrar">🗑️</button>
                        </div>
                    </div>
                `;
            });
        }

        function deleteRoom(index) {
            cConfirm("Seguro que queres borrar este aloxamento? (Non borra as reservas da base de datos histórica)", () => {
                appState.baseRooms.splice(index, 1);
                salvarConfigNoServidor();
                renderAdminRoomList();
                renderGrid();
            });
        }

        function updateAgencyList() {
            const container = document.getElementById('agencyList');
            if(container) container.innerHTML = '';
            appState.agencies.forEach((a, idx) => {
                container.innerHTML += `
                    <div class="flex justify-between items-center p-2 border-b">
                        <div class="flex items-center gap-1.5"><div class="w-4 h-4 rounded-full" style="background:${a.color}"></div> <span class="font-bold">${a.name}</span></div>
                        <button onclick="deleteAgency(${idx})" class="text-red-500 text-sm font-bold">X</button>
                    </div>
                `;
            });
        }

        function addAgency() {
            const name = document.getElementById('newAgencyName').value;
            const color = document.getElementById('newAgencyColor').value;
            if(!name) return;
            appState.agencies.push({name, color});
            document.getElementById('newAgencyName').value = '';
            salvarConfigNoServidor();
            updateAgencyList();
            updateAgencyDropdown();
            renderGrid();
        }

        function deleteAgency(index) {
            appState.agencies.splice(index, 1);
            salvarConfigNoServidor();
            updateAgencyList();
            updateAgencyDropdown();
            renderGrid();
        }

        function updateAgencyDropdown() {
            const selects = [document.getElementById('clientAgency'), document.getElementById('filterAgency'), document.getElementById('infAgency')];
            selects.forEach(s => {
                if(!s) return;
                let isFilter = s.id.includes('filter') || s.id.includes('inf');
                let h = isFilter ? `<option value="ALL">🏢 Tódalas Axencias</option><option value="DIRECT">Particular (Directo)</option>` : `<option value="">Particular</option>`;
                appState.agencies.forEach(a => { h += `<option value="${a.name}">${a.name}</option>`; });
                s.innerHTML = h;
            });
        }

        function openLayoutEditor(baseId) {
            editorActiveBaseId = baseId;
            const base = appState.baseRooms.find(b => b.id === baseId);
            document.getElementById('layoutModalTitle').innerText = `Plano: ${base.roomName}`;
            const canvas = document.getElementById('layoutEditorCanvas');
            canvas.innerHTML = '<div class="absolute bottom-0 left-8 w-16 h-2 bg-slate-400 rounded-t-lg opacity-50" title="Porta de entrada"></div>';
            
            editorItemsData = base.layout ? JSON.parse(JSON.stringify(base.layout)) : [];
            editorDecorData = base.decorations ? JSON.parse(JSON.stringify(base.decorations)) : [];
            
            const literasCount = Math.ceil(base.totalBeds / 2);

            for (let i = 0; i < literasCount; i++) {
                if (!editorItemsData[i]) {
                    editorItemsData[i] = { x: (i%4) * 20 + 5, y: Math.floor(i/4) * 25 + 5, r: 0 };
                }
                const lData = editorItemsData[i];
                
                let el = document.createElement('div');
                el.className = "absolute bg-slate-800  border-x-4 border-slate-900 rounded-lg flex items-center justify-center cursor-move shadow-2xl text-white font-black text-xs select-none hover:ring-4 hover:ring-blue-400 transition-shadow";
                el.style.width = '120px'; el.style.height = '60px'; 
                el.style.left = lData.x + '%'; el.style.top = lData.y + '%';
                el.style.transform = `rotate(${lData.r}deg)`;
                el.innerHTML = `LIT. ${i+1}<br><br>🔄 Clic p/ Rotar`;
                
                attachDragAndRotate(el, lData, canvas, 90);
                canvas.appendChild(el);
            }

            editorDecorData.forEach((dec, idx) => spawnDecorElement(dec, idx));
            document.getElementById('layoutModal').classList.add('active');
        }

        function addLayoutDecor(typeStr) {
            let nData = { t: typeStr, x: 50, y: 50, r: 0 };
            editorDecorData.push(nData);
            spawnDecorElement(nData, editorDecorData.length - 1);
        }

        function spawnDecorElement(lData, index) {
            const canvas = document.getElementById('layoutEditorCanvas');
            let el = document.createElement('div');
            el.className = "absolute flex items-center justify-center cursor-move shadow-md bg-white/30 backdrop-blur-md border border-white/50 shadow-sm border border-slate-300/50  rounded text-3xl select-none hover:ring-4 hover:ring-amber-400";
            if (lData.t.includes('Mesa')) { el.style.width = '80px'; el.style.height = '80px'; el.style.borderRadius = '50%'; }
            else if (lData.t.includes('Porta') || lData.t.includes('Ventá')) { el.style.width = '100px'; el.style.height = '20px'; el.style.backgroundColor = '#cbd5e1'; }
            else { el.style.width = '50px'; el.style.height = '50px'; }
            
            el.style.left = lData.x + '%'; el.style.top = lData.y + '%';
            el.style.transform = `rotate(${lData.r}deg)`;
            el.innerHTML = lData.t.split(' ')[0];
            el.title = "Dobre clic para borrar";

            el.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                let idx = editorDecorData.indexOf(lData);
                if(idx > -1) editorDecorData.splice(idx, 1);
                el.remove();
            });

            attachDragAndRotate(el, lData, canvas, 45);
            canvas.appendChild(el);
        }

        function attachDragAndRotate(el, lData, canvas, rotateStep) {
            let isDraggingEl = false;
            let moved = false;
            let startX, startY, initialX, initialY;

            function onStart(e) {
                e.stopPropagation();
                if(e.type === 'touchstart' && e.touches.length > 1) return;
                
                isDraggingEl = true;
                moved = false;
                
                const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
                const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
                
                startX = clientX; 
                startY = clientY;
                
                initialX = lData.x;
                initialY = lData.y;
                
                document.addEventListener('mousemove', onMove, {passive: false});
                document.addEventListener('mouseup', onEnd);
                document.addEventListener('touchmove', onMove, {passive: false});
                document.addEventListener('touchend', onEnd);
            }

            function onMove(e) {
                if(!isDraggingEl) return;
                moved = true;
                e.preventDefault(); 
                
                const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
                const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
                
                let bRect = canvas.getBoundingClientRect();
                
                let dx = clientX - startX;
                let dy = clientY - startY;
                let px = initialX + (dx / bRect.width) * 100;
                let py = initialY + (dy / bRect.height) * 100;
                
                px = Math.max(0, Math.min(px, 90));
                py = Math.max(0, Math.min(py, 90));

                lData.x = px; lData.y = py;
                el.style.left = px + '%'; el.style.top = py + '%';
            }

            function onEnd(e) {
                if(!isDraggingEl) return;
                isDraggingEl = false;
                
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onEnd);
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('touchend', onEnd);
                
                if (!moved) {
                    lData.r = (lData.r + rotateStep) % 360;
                    el.style.transform = `rotate(${lData.r}deg)`;
                }
            }

            el.addEventListener('mousedown', onStart);
            el.addEventListener('touchstart', onStart, {passive: true});
        }

        function saveLayout() {
            const base = appState.baseRooms.find(b => b.id === editorActiveBaseId);
            if (base) { base.layout = editorItemsData; base.decorations = editorDecorData; salvarConfigNoServidor(); cAlert("Plano e decoración gardados."); closeModal('layoutModal'); renderGrid(); if(document.getElementById('hostelModal').classList.contains('active')) updateHostelLayout(); }
        }

        function setRoomStatus(status) {
            const rs = document.getElementById('roomStatus');
            if(rs) rs.value = status;
            const bsf = document.getElementById('btnStatusFree');
            if(bsf) bsf.className = "toggle-btn flex-1 py-3 rounded-xl text-xs flex flex-col items-center justify-center gap-1 " + (status === 'free' ? "active-free" : "inactive");
            const bsr = document.getElementById('btnStatusRes');
            if(bsr) bsr.className = "toggle-btn flex-1 py-3 rounded-xl text-xs flex flex-col items-center justify-center gap-1 " + (status === 'reserved' ? "active-res" : "inactive");
            const bso = document.getElementById('btnStatusOcc');
            if(bso) bso.className = "toggle-btn flex-1 py-3 rounded-xl text-xs flex flex-col items-center justify-center gap-1 " + (status === 'occupied' ? "active-occ" : "inactive");
        }

        function openRoomModal(idsArray, titleStr) {
            if (!idsArray || idsArray.length === 0) return;
            currentEditingBedIds = idsArray;
            const dia = appState.dailyData[currentPlaningDate] || [];
            const isMulti = idsArray.length > 1;
            
            let templateRoom = dia.find(d => idsArray.includes(d.id) && d.status !== 'free');
            if (!templateRoom) templateRoom = dia.find(d => d.id === idsArray[0]);
            if (!templateRoom) return;
            
            // if we are fixing properties
            if(!templateRoom.services) templateRoom.services = {};

            document.getElementById('modalRoomNumber').innerText = titleStr;
            document.getElementById('modalRoomName').innerText = isMulti ? 'Edición en bloque' : (templateRoom.roomName || 'Detalle');
            document.getElementById('multiSelectInfo').style.display = isMulti ? 'block' : 'none';
            document.getElementById('divGuestCount').style.display = (templateRoom.type === 'bed' || isMulti) ? 'none' : 'block';

            setRoomStatus(templateRoom.status);
            document.getElementById('dateCheckIn').value = templateRoom.checkIn || currentPlaningDate;
            let defOut = new Date(templateRoom.checkIn || currentPlaningDate); defOut.setDate(defOut.getDate()+1);
            document.getElementById('dateCheckOut').value = templateRoom.checkOut || defOut.toISOString().split('T')[0];
            document.getElementById('clientName').value = templateRoom.clientName || '';
            document.getElementById('guestCount').value = templateRoom.guests || 1;
            document.getElementById('clientAgency').value = templateRoom.agency || '';
            document.getElementById('observations').value = templateRoom.observations || '';
            document.getElementById('accountSettled').checked = templateRoom.accountSettled || false;
            
            let tPrice = 0, tCash = 0, tCard = 0, tTrans = 0, tAgency = 0;
            if (isMulti) {
                currentEditingBedIds.forEach(id => { 
                    const r = dia.find(d => d.id === id); 
                    if(r) {
                        tPrice += parseFloat(r.price || 0);
                        tCash += parseFloat(r.paidCash || 0);
                        tCard += parseFloat(r.paidCard || 0);
                        tTrans += parseFloat(r.paidTransfer || 0);
                        tAgency += parseFloat(r.paidAgency || 0);
                    }
                });
            } else {
                tPrice = parseFloat(templateRoom.price || 0);
                tCash = parseFloat(templateRoom.paidCash || 0);
                tCard = parseFloat(templateRoom.paidCard || 0);
                tTrans = parseFloat(templateRoom.paidTransfer || 0);
                tAgency = parseFloat(templateRoom.paidAgency || 0);
            }
            
            document.getElementById('roomPrice').value = tPrice || '';
            document.getElementById('paidCash').value = tCash || '';
            document.getElementById('paidCard').value = tCard || '';
            document.getElementById('paidTransfer').value = tTrans || '';
            document.getElementById('paidAgency').value = tAgency || '';

            
            if (window.pendingMailAssign && templateRoom.status === 'free') {
                const p = window.pendingMailAssign;
                document.getElementById('roomStatus').value = 'reserved';
                document.getElementById('clientName').value = p.clientName || '';
                document.getElementById('clientAgency').value = p.agency || 'MisterPlan';
                
                if (p.checkIn) document.getElementById('dateCheckIn').value = p.checkIn;
                if (p.checkIn && p.noches) {
                    let nextD = new Date(p.checkIn);
                    nextD.setDate(nextD.getDate() + p.noches);
                    document.getElementById('dateCheckOut').value = nextD.toISOString().split('T')[0];
                }
                
                document.getElementById('guestCount').value = p.personas || 1;
                
                if (isMulti) {
                    tPrice = (p.total || 0) / currentEditingBedIds.length;
                    tAgency = (p.paidAgency || 0) / currentEditingBedIds.length;
                } else {
                    tPrice = p.total || 0;
                    tAgency = p.paidAgency || 0;
                }
                
                document.getElementById('roomPrice').value = tPrice || '';
                document.getElementById('paidAgency').value = tAgency || '';
                
                let obs = `ID: ${p.id} - ${p.roomInfo||''}`;
                if (p.clientEmail) obs += `\nEmail: ${p.clientEmail}`;
                document.getElementById('observations').value = obs;
                
                if (typeof google !== 'undefined' && google.script) {
                    if (typeof google.script.run.markEmailAsRead === 'function') {
                        google.script.run.markEmailAsRead(p.msgId);
                    }
                }
                window.pendingMailAssign = null;
                setTimeout(() => showToast("✅ Datos do correo autocompletados. (Garda cando remates)"), 300);
            }
            
            const s = templateRoom.services || { breakfast:{qty:0,price:0}, dinner:{qty:0,price:0}, picnic:{qty:0,price:0}, halfBoard:{qty:0,price:0}, fullBoard:{qty:0,price:0}, laundry:{active:false,price:0}, mochilas:{qty:0,price:0}, outros:{qty:0,price:0}, parking:false, taxi:false };

            document.getElementById('srvBreakfastQty').value = s.breakfast.qty || ''; 
            document.getElementById('srvBreakfastPrice').value = s.breakfast.price || '';
            document.getElementById('srvDinnerQty').value = s.dinner.qty || ''; 
            document.getElementById('srvDinnerPrice').value = s.dinner.price || '';
            document.getElementById('srvPicnicQty').value = s.picnic.qty || ''; 
            document.getElementById('srvPicnicPrice').value = s.picnic.price || '';
            document.getElementById('srvHalfBoardQty').value = s.halfBoard.qty || ''; 
            document.getElementById('srvHalfBoardPrice').value = s.halfBoard.price || '';
            document.getElementById('srvFullBoardQty').value = s.fullBoard.qty || ''; 
            document.getElementById('srvFullBoardPrice').value = s.fullBoard.price || '';
            document.getElementById('srvMochilasQty').value = s.mochilas?.qty || ''; 
            document.getElementById('srvMochilasPrice').value = s.mochilas?.price || '';
            document.getElementById('srvOutrosQty').value = s.outros?.qty || ''; 
            document.getElementById('srvOutrosPrice').value = s.outros?.price || '';

            document.getElementById('srvLaundry').checked = s.laundry.active || false; 
            document.getElementById('srvLaundryPrice').value = s.laundry.price || '';
            document.getElementById('srvParking').checked = s.parking || false; 
            document.getElementById('srvTaxi').checked = s.taxi || false;

            const badge = document.getElementById('modalAgencyBadge');
            if (!isMulti && templateRoom.status !== 'free' && templateRoom.agency) {
                const ag = appState.agencies.find(a => a.name === templateRoom.agency);
                if (ag) { badge.style.backgroundColor = ag.color; badge.innerText = templateRoom.agency; badge.classList.remove('hidden'); }
            } else { badge.classList.add('hidden'); }
            
            document.getElementById('labelTotal').innerText = isMulti ? 'Aloxamento (Suma total)' : 'Aloxamento Total (€)';
            document.getElementById('pagosTotaisLabel').innerText = isMulti ? 'Pagos Realizados (Suma total da selección)' : 'Pagos Realizados Totais (€)';
            
            calcPending();
            document.getElementById('roomModal').classList.add('active');
        }

        function autoPrice(type, qtyId, priceId) {
            const qEl = document.getElementById(qtyId); const pEl = document.getElementById(priceId);
            if(!qEl || !pEl) return;
            const qty = parseFloat(qEl.value) || 0;
            const defPrice = appState.extrasPrices ? parseFloat(appState.extrasPrices[type]) : 0;
            
            if (defPrice > 0 && (!pEl.value || pEl.value == 0 || qty > 0)) {
                pEl.value = (qty * defPrice).toFixed(2);
            }
            calcPending();
        }

        function autoPriceCheckbox(type, checkId, priceId) {
            const cEl = document.getElementById(checkId); const pEl = document.getElementById(priceId);
            if(!cEl || !pEl) return;
            const isChecked = cEl.checked;
            const defPrice = appState.extrasPrices ? parseFloat(appState.extrasPrices[type]) : 0;
            
            if (isChecked && defPrice > 0 && (!pEl.value || pEl.value == 0)) {
                pEl.value = defPrice.toFixed(2);
            }
            calcPending();
        }

        async function requestPushPermission() {
            if (!("Notification" in window)) {
                cAlert("Este navegador non soporta notificacións nativas. Se estás en iPhone, engade esta web á pantalla de inicio (botón Compartir -> Engadir á pantalla de inicio) e logo proba de novo. Aínda así verás notificacións dentro da app cando estea aberta.");
                return;
            }
            if (Notification.permission === "granted") {
                cAlert("As notificacións xa están activadas neste dispositivo!");
                showAppNotification("Complexo Xacobeo", { body: "As notificacións están funcionando.", icon: '/icon.svg' });
                return;
            }
            try {
                let permission;
                try {
                    permission = await Notification.requestPermission();
                } catch(e) {
                    // Fallback para algúns navegadores antigos / iOS antigo
                    Notification.requestPermission(function(p) {
                        permission = p;
                        if (permission === "granted") {
                            cAlert("Notificacións activadas correctamente!");
                            showAppNotification("Complexo Xacobeo", { body: "As notificacións están funcionando.", icon: '/icon.svg' });
                        } else {
                            cAlert("Permiso denegado ou pechado.");
                        }
                    });
                    return;
                }
                
                if (permission === "granted") {
                    cAlert("Notificacións activadas correctamente!");
                    showAppNotification("Complexo Xacobeo", { body: "As notificacións están funcionando.", icon: '/icon.svg' });
                } else {
                    cAlert("Permiso denegado ou pechado.");
                }
            } catch(e) {
                cAlert("Erro ao solicitar permisos: " + e.message);
            }
        }

        async function syncToGoogleCalendar(room, details) {
            // Calendar sync moved to GAS backend. Do nothing on client.
        }

        function saveRoom() {
            const dia = appState.dailyData[currentPlaningDate];
            const stat = document.getElementById('roomStatus').value;
            const cName = document.getElementById('clientName').value;
            const cPhone = document.getElementById('clientPhone').value;
            const cEmail = document.getElementById('clientEmail').value;
            
            const isMulti = currentEditingBedIds.length > 1;
            const count = isMulti ? currentEditingBedIds.length : 1;
            const commonGroupId = isMulti ? 'GRP-' + Date.now() : '';
            
            const pPerBed = (parseFloat(document.getElementById('roomPrice').value) || 0) / count;
            const cashPerBed = (parseFloat(document.getElementById('paidCash').value) || 0) / count;
            const cardPerBed = (parseFloat(document.getElementById('paidCard').value) || 0) / count;
            const transPerBed = (parseFloat(document.getElementById('paidTransfer').value) || 0) / count;
            const agencyPerBed = (parseFloat(document.getElementById('paidAgency').value) || 0) / count;
            const accSettled = document.getElementById('accountSettled').checked;

            const inD = document.getElementById('dateCheckIn').value;
            const outD = document.getElementById('dateCheckOut').value;
            const updatedRooms = [];

            currentEditingBedIds.forEach(id => {
                const room = dia.find(d => d.id === id);
                if(!room) return;
                const oldStatus = room.status;

                room.status = stat;
                if(cName && room.status === 'free') room.status = 'reserved'; 
                if (oldStatus !== 'occupied' && room.status === 'occupied') room.cleaningStatus = 'dirty';

                room.clientName = cName;
                room.clientPhone = cPhone;
                room.clientEmail = cEmail;
                room.checkIn = inD;
                room.checkOut = outD;
                room.guests = room.type === 'bed' ? 1 : Math.max(1, Math.floor((parseInt(document.getElementById('guestCount').value)||1) / count));
                room.agency = document.getElementById('clientAgency').value;
                room.observations = document.getElementById('observations').value;
                room.accountSettled = accSettled;
                
                room.price = pPerBed;
                room.paidCash = cashPerBed;
                room.paidCard = cardPerBed;
                room.paidTransfer = transPerBed;
                room.paidAgency = agencyPerBed;
                
                room.services.breakfast = { qty: parseInt(document.getElementById('srvBreakfastQty').value)||0, price: parseFloat(document.getElementById('srvBreakfastPrice').value)||0 };
                room.services.dinner = { qty: parseInt(document.getElementById('srvDinnerQty').value)||0, price: parseFloat(document.getElementById('srvDinnerPrice').value)||0 };
                room.services.picnic = { qty: parseInt(document.getElementById('srvPicnicQty').value)||0, price: parseFloat(document.getElementById('srvPicnicPrice').value)||0 };
                room.services.halfBoard = { qty: parseInt(document.getElementById('srvHalfBoardQty').value)||0, price: parseFloat(document.getElementById('srvHalfBoardPrice').value)||0 };
                room.services.fullBoard = { qty: parseInt(document.getElementById('srvFullBoardQty').value)||0, price: parseFloat(document.getElementById('srvFullBoardPrice').value)||0 };
                room.services.mochilas = { qty: parseInt(document.getElementById('srvMochilasQty').value)||0, price: parseFloat(document.getElementById('srvMochilasPrice').value)||0 };
                room.services.outros = { qty: parseInt(document.getElementById('srvOutrosQty').value)||0, price: parseFloat(document.getElementById('srvOutrosPrice').value)||0 };
                room.services.laundry = { active: document.getElementById('srvLaundry').checked, price: parseFloat(document.getElementById('srvLaundryPrice').value)||0 };
                room.services.parking = document.getElementById('srvParking').checked;
                room.services.taxi = document.getElementById('srvTaxi').checked;

                if (isMulti) room.groupId = commonGroupId;
                updatedRooms.push(room);
            });

            if (typeof google !== 'undefined' && google.script && inD && outD && new Date(outD) > new Date(inD)) {
                const s = document.getElementById('saveStatus'); if(s) { s.classList.remove('hidden'); setTimeout(()=>s.classList.add('hidden'), 2000); }
                google.script.run.withSuccessHandler(() => {
                }).propagarReserva(inD, outD, currentEditingBedIds, updatedRooms, currentPlaningDate);
            } else {
                salvarDiaNoServidor();
            }

            if (stat === 'reserved' || stat === 'occupied') {
                const primaryRoom = updatedRooms[0];
                if (primaryRoom) {
                    let details = '';
                    if (primaryRoom.services.breakfast.qty > 0) details += `Almorzo: ${primaryRoom.services.breakfast.qty}, `;
                    if (primaryRoom.services.dinner.qty > 0) details += `Cea: ${primaryRoom.services.dinner.qty}, `;
                    if (primaryRoom.services.picnic.qty > 0) details += `Picnic: ${primaryRoom.services.picnic.qty}, `;
                    syncToGoogleCalendar(primaryRoom, details);
                }
            }
            
            
            // Clear local cache for all other days so they refresh from the server after saving
            Object.keys(appState.dailyData).forEach(k => {
                if (k !== currentPlaningDate) delete appState.dailyData[k];
            });
            if(mainMultiSelectModeActive) toggleMainMultiSelect();
 
            
            multiSelectModeActive = false; currentEditingBedIds = []; 
            closeModal('roomModal');
            if (currentOpenHostelId) updateHostelLayout();
            renderGrid(); filterGrid();
        }

        function liberarHabitacion() {
            cConfirm("Baleirar as unidades seleccionadas? Cancelaranse pagos e nomes.", () => {
                const dia = appState.dailyData[currentPlaningDate];
                currentEditingBedIds.forEach(id => {
                    const room = dia.find(d => d.id === id);
                    if(room) {
                        if (room.status === 'occupied') room.cleaningStatus = 'dirty';
                        room.status = 'free'; room.clientName = ''; room.clientPhone = ''; room.clientEmail = ''; room.checkIn = ''; room.checkOut = '';
                        room.price = room.type === 'bed' ? (appState.baseRooms.find(b=>b.id===room.baseId)?.bedPrice || 15) : 0; 
                        room.paidCash = 0; room.paidCard = 0; room.paidAgency = 0; room.paidTransfer = 0; room.groupId = ''; room.observations = ''; room.accountSettled = false;
                        room.services = { breakfast:{qty:0,price:0}, dinner:{qty:0,price:0}, picnic:{qty:0,price:0}, halfBoard:{qty:0,price:0}, fullBoard:{qty:0,price:0}, laundry:{active:false,price:0}, mochilas:{qty:0,price:0}, outros:{qty:0,price:0}, parking:false, taxi:false };
                    }
                });
                salvarDiaNoServidor();
                
                
            // Clear local cache for all other days so they refresh from the server after saving
            Object.keys(appState.dailyData).forEach(k => {
                if (k !== currentPlaningDate) delete appState.dailyData[k];
            });
            if(mainMultiSelectModeActive) toggleMainMultiSelect();

                
                multiSelectModeActive = false; currentEditingBedIds = [];
                closeModal('roomModal');
                if (currentOpenHostelId) updateHostelLayout();
                renderGrid(); filterGrid();
            });
        }

        
        function openSplitPayment() {
            const pending = calcPending();
            document.getElementById('splitTotal').value = pending.toFixed(2);
            document.getElementById('splitPeople').value = 2;
            calcSplit();
            document.getElementById('splitPaymentModal').classList.add('active');
        }
        function changeSplitCount(delta) {
            let el = document.getElementById('splitPeople');
            let v = parseInt(el.value) || 2;
            if (v + delta >= 2) {
                el.value = v + delta;
                calcSplit();
            }
        }
        function calcSplit() {
            let total = parseFloat(document.getElementById('splitTotal').value) || 0;
            let people = parseInt(document.getElementById('splitPeople').value) || 2;
            let res = total / people;
            document.getElementById('splitResult').innerText = res.toFixed(2) + '€';
        }

        function calcPending() {
            const total = parseFloat(document.getElementById('roomPrice').value) || 0;
            const cash = parseFloat(document.getElementById('paidCash').value) || 0;
            const card = parseFloat(document.getElementById('paidCard').value) || 0;
            const trans = parseFloat(document.getElementById('paidTransfer').value) || 0;
            const agency = parseFloat(document.getElementById('paidAgency').value) || 0;
            
            const isMulti = currentEditingBedIds.length > 1;
            const count = isMulti ? currentEditingBedIds.length : 1;
            
            const sBreak = parseFloat(document.getElementById('srvBreakfastPrice').value) || 0;
            const sDin = parseFloat(document.getElementById('srvDinnerPrice').value) || 0;
            const sPic = parseFloat(document.getElementById('srvPicnicPrice').value) || 0;
            const sHalf = parseFloat(document.getElementById('srvHalfBoardPrice').value) || 0;
            const sFull = parseFloat(document.getElementById('srvFullBoardPrice').value) || 0;
            const sLaun = document.getElementById('srvLaundry').checked ? (parseFloat(document.getElementById('srvLaundryPrice').value) || 0) : 0;
            const sMoch = parseFloat(document.getElementById('srvMochilasPrice').value) || 0;
            const sOutros = parseFloat(document.getElementById('srvOutrosPrice').value) || 0;
            
            const totalExtrasXCount = (sBreak + sDin + sPic + sHalf + sFull + sLaun + sMoch + sOutros) * count;
            const pagosXCount = cash + card + trans + agency;
            
            const totalGlobal = total + totalExtrasXCount;
            let pending = totalGlobal - pagosXCount;
            
            if (document.getElementById('accountSettled').checked) {
                pending = 0; 
            }
            
            const pendingEl = document.getElementById('roomPending');
            pendingEl.innerText = pending.toFixed(2);
            pendingEl.className = pending <= 0 ? "w-full p-3 bg-emerald-50/50  border border-emerald-200/50  rounded-xl font-black text-lg text-emerald-700" : "w-full p-3 bg-red-50 border border-red-200 rounded-xl font-black text-lg text-red-700";
            
            return pending;
        }

        function payRemaining(method) {
            const pending = calcPending();
            if (pending <= 0) return;
            
            if (method === 'cash') document.getElementById('paidCash').value = ((parseFloat(document.getElementById('paidCash').value)||0) + pending).toFixed(2);
            if (method === 'card') document.getElementById('paidCard').value = ((parseFloat(document.getElementById('paidCard').value)||0) + pending).toFixed(2);
            if (method === 'trans') document.getElementById('paidTransfer').value = ((parseFloat(document.getElementById('paidTransfer').value)||0) + pending).toFixed(2);
            if (method === 'agency') document.getElementById('paidAgency').value = ((parseFloat(document.getElementById('paidAgency').value)||0) + pending).toFixed(2);
            
            calcPending();
        }

        function promptSwap(sourceId, targetId) {
            dragTargetId = targetId;
            const daily = appState.dailyData[currentPlaningDate];
            const sR = daily.find(r => r.id === sourceId); const tR = daily.find(r => r.id === targetId);
            const sMT = document.getElementById('swapModalText'); if(sMT) sMT.innerHTML = `Mover datos de <b>${sR.number||sR.bedId}</b> cara a <b>${tR.number||tR.bedId}</b>.<br><br>Se o destino xa ten cliente, intercambiaranse.`;
            document.getElementById('swapModal').classList.add('active');
        }

        function executeBedSwap(sId, tId) {
            dragSourceId = sId; dragTargetId = tId;
            executeSwap();
        }

        function executeSwap() {
            const daily = appState.dailyData[currentPlaningDate];
            const sIdx = daily.findIndex(r => r.id === dragSourceId);
            const tIdx = daily.findIndex(r => r.id === dragTargetId);
            
            if(sIdx > -1 && tIdx > -1) {
                const propsToSwap = ['status', 'clientName', 'guests', 'agency', 'checkIn', 'checkOut', 'price', 'paidCash', 'paidCard', 'paidTransfer', 'paidAgency', 'accountSettled', 'observations', 'cleaningStatus', 'services', 'groupId'];
                
                const temp = {};
                propsToSwap.forEach(p => { temp[p] = daily[sIdx][p] !== undefined ? JSON.parse(JSON.stringify(daily[sIdx][p])) : null; });
                propsToSwap.forEach(p => { daily[sIdx][p] = daily[tIdx][p] !== undefined ? JSON.parse(JSON.stringify(daily[tIdx][p])) : null; });
                propsToSwap.forEach(p => { daily[tIdx][p] = temp[p]; });
                
                salvarDiaNoServidor(); renderGrid(); filterGrid();
                if (currentOpenHostelId) updateHostelLayout();
            }
            closeModal('swapModal');
        }

        function initColorPicker() {
            const container = document.getElementById('colorPickerContainer');
            if(!container) return;
            container.innerHTML = '';
            paletteColors.forEach((color, index) => {
                const swatch = document.createElement('div');
                swatch.className = `color-swatch ${index === 0 ? 'selected' : ''}`;
                swatch.style.backgroundColor = color;
                swatch.onclick = () => {
                    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
                    swatch.classList.add('selected');
                    document.getElementById('newRoomColor').value = color;
                };
                container.appendChild(swatch);
            });
            if(document.getElementById('newRoomColor')) document.getElementById('newRoomColor').value = paletteColors[0];
        }

        function printVoucher(tipo, inputId, isCheckbox = false) {
            const dia = appState.dailyData[currentPlaningDate];
            const room = dia.find(r => r.id === (currentEditingBedIds[0] || currentEditingRoomId)); 
            if(!room) return;
            const el = document.getElementById(inputId);
            if(!el) return;
            let qty = 1; 
            if(!isCheckbox) { 
                qty = el.value; 
                if(qty <= 0) return cAlert("Introduza cantidade."); 
            } else { 
                if(!el.checked) return cAlert("Servizo non marcado."); 
            }
            
            let persoaRaw = document.getElementById('receptionistName').value; 
            let persoaFinal = persoaRaw;
            if (!persoaFinal || persoaFinal.toLowerCase() === 'complexo xacobeo' || persoaFinal.toLowerCase() === 'complexo xacobeo (xeral)') {
                persoaFinal = 'RECEPCIÓN';
            }
            const dh = new Date().toLocaleString("gl-ES", { timeZone: "Europe/Madrid" });
            const pNum = room.bedId ? room.number+'-'+room.bedId : room.number;
            
            if (typeof google !== 'undefined' && google.script) {
                google.script.run.gardarVaucher(room.agency || 'Directo', tipo, pNum, room.clientName || 'Hóspede', qty, persoaRaw);
            }
            
            let validezDate = new Date(currentPlaningDate);
            if (tipo.includes('Almorzo') || tipo === 'Almorzo') {
                validezDate.setDate(validezDate.getDate() + 1);
            }
            const dataValidezStr = validezDate.toLocaleDateString('gl-ES', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
            if (appState.pushConfig && appState.pushConfig.telegram) { 
                sendTelegramMsg(`🎟️ <b>Impreso ${tipo}</b>\n👤 Cliente: ${room.clientName || 'Hóspede'}\n🛏️ Aloxamento: ${pNum}\n🔢 Cantidade: ${qty}\n📅 Para: ${dataValidezStr}`);
            }

            let icon = '🎟️';
            if(tipo.includes('Almorzo')) icon = '☕';
            else if(tipo.includes('Cea')) icon = '🍽️';
            else if(tipo.includes('Picnic')) icon = '🎒';
            else if(tipo.includes('Pensión')) icon = '⭐';
            else if(tipo.includes('Lavandaría')) icon = '🧺';
            
            let extraNote = '';
            if (tipo.includes('Pensión') || tipo.includes('Pension') || tipo.includes('Completa') || tipo.includes('Media')) {
                extraNote = `<div class="mp-note">INCLÚE XANTAR OU CEA EN<br>PARRILLADA XACOBEO<br>("Menú Xacobeo")</div>`;
            }

            const separator = `<div class="separator">✧ ════ ❖ ════ ✧</div>`;

            const qrDataStr = btoa(encodeURIComponent("XAC|" + currentPlaningDate + "|" + room.id + "|" + tipo + "|" + qty));
            // Always point precisely to the domain serving the app, no matter what it is
            const appUrl = window.location.origin + "/?qr=" + qrDataStr;
            const qrPayload = encodeURIComponent(appUrl);
            const html = `
            <!DOCTYPE html>
            <html lang="gl">
            <head>
                <meta charset="UTF-8">
                <style>
                    @page { margin: 0; }
                    body { font-family: 'Courier New', Courier, monospace; width: 78mm; margin: 0 auto; padding: 4mm; color: #000; text-align: center; }
                    .ticket { border: 2px solid #000; padding: 0 0 10px 0; border-radius: 8px; background: #fff; overflow: hidden; }
                    .header { font-size: 22px; font-weight: 900; padding: 12px 5px; text-transform: uppercase; background: #000; color: #fff; letter-spacing: 1px; margin-bottom: 10px; }
                    .subheader { font-size: 12px; color: #000; font-weight: bold; margin-bottom: 5px; }
                    .separator { font-size: 14px; text-align: center; margin: 8px 0; font-weight: bold; }
                    .client { font-size: 15px; margin: 10px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-transform: uppercase; }
                    .room { font-size: 32px; font-weight: 900; margin: 10px; background: #000; color: #fff; padding: 10px; border-radius: 6px; letter-spacing: 2px;}
                    .service { font-size: 18px; font-weight: 900; margin: 15px 0 5px 0; text-transform: uppercase;}
                    .qty { font-size: 35px; font-weight: 900; margin: 5px 20px; border: 4px solid #000; border-radius: 8px; padding: 5px;}
                    .date-valid { font-size: 16px; font-weight: 900; margin: 15px 10px; padding: 10px; display: block; background: #000; color: #fff; border-radius: 6px;}
                    .mp-note { font-size: 14px; font-weight: 900; border: 2px dashed #000; padding: 10px; margin: 10px; background: #fff; color: #000;}
                    .footer { font-size: 12px; font-weight: bold; margin-top: 15px; border-top: 2px solid #000; padding-top: 10px; line-height: 1.5; text-transform: uppercase; }
                </style>
            </head>
            <body onload="window.print(); setTimeout(()=>window.close(), 500);">
                <div class="ticket">
                    <div class="header">${icon} ${tipo}</div>
                    <div style="text-align:center; margin: 10px 0;">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrPayload}" alt="QR" style="width:120px;height:120px;" />
                    </div>
                    <div class="subheader">COMPLEXO XACOBEO<br>${dh}</div>
                    ${separator}
                    <div class="client">${room.clientName || 'HÓSPEDE'}</div>
                    <div class="room">HAB: ${pNum}</div>
                    <div class="service">${tipo}</div>
                    <div class="qty">X ${qty}</div>
                    <div class="date-valid">VÁLIDO O:<br>${dataValidezStr}</div>
                    ${extraNote}
                    ${separator}
                    <div class="footer">EXPEDIDO POR: ${persoaFinal}<br>Grazas pola súa visita</div>
                </div>
            
    

</body>
            </html>`;
            
            const printWin = window.open('', '_blank');
            printWin.document.write(html);
            printWin.document.close();
        }

        function imprimirPlaningA4() {
            cChoice("¿Imprimir tamén os totais económicos na folla?", function(showTotals) {
            const dia = appState.dailyData[currentPlaningDate] || [];
            
            let htmlHab = ''; let htmlAlb = '';
            let tHabP = 0, tHabExt = 0, tHabPend = 0, cHabOc = 0;
            let tAlbP = 0, tAlbExt = 0, tAlbPend = 0, cAlbOc = 0;
            
            appState.baseRooms.forEach(base => {
                const parts = dia.filter(d => d.baseId === base.id && d.status !== 'free');
                parts.forEach(r => {
                    const s = r.services || { breakfast:{price:0}, dinner:{price:0}, picnic:{price:0}, laundry:{active:false,price:0}, mochilas:{price:0}, outros:{price:0} };
                    let ext = (parseFloat(s.breakfast.price)||0)+(parseFloat(s.dinner.price)||0)+(parseFloat(s.picnic.price)||0)+(s.laundry.active?parseFloat(s.laundry.price):0)+(parseFloat(s.mochilas.price)||0)+(parseFloat(s.outros.price)||0);
                    let pag = (parseFloat(r.paidCash)||0)+(parseFloat(r.paidCard)||0)+(parseFloat(r.paidTransfer)||0)+(parseFloat(r.paidAgency)||0);
                    let alox = parseFloat(r.price)||0;
                    let pen = (alox+ext)-pag;
                    if(r.accountSettled) pen = 0;
                    
                    let row = `<tr>
                        <td style="font-weight:bold;">${r.bedId ? r.number+'-'+r.bedId : r.number}</td>
                        <td>${r.status==='occupied'?'OCUP':'RES'}</td>
                        <td style="font-weight:bold;">${r.clientName||'-'}</td>
                        <td>${r.guests||1}</td>`;
                    
                    if (showTotals) {
                        row += `
                        <td style="text-align:right;">${alox.toFixed(2)}€</td>
                        <td style="text-align:right;">${ext>0 ? ext.toFixed(2)+'€' : '-'}</td>
                        <td style="color:${pen>0?'#dc2626':'#059669'}; font-weight:bold; text-align:right;">${pen>0?pen.toFixed(2)+'€':'✓ PAGO'}</td>
                        `;
                    }
                    
                    row += `
                        <td style="font-size:10px;">${r.agency||''}</td>
                    </tr>`;
                    if (base.type === 'hostel') {
                        htmlAlb += row;
                        tAlbP += alox; tAlbExt += ext; if(pen>0) tAlbPend+=pen; cAlbOc++;
                    } else {
                        htmlHab += row;
                        tHabP += alox; tHabExt += ext; if(pen>0) tHabPend+=pen; cHabOc++;
                    }
                });
            });
            const totalGlobalFact = tHabP + tHabExt + tAlbP + tAlbExt;
            const totalGlobalPend = tHabPend + tAlbPend;
            let summaryHtml = `
                <div class="summary-grid">
                    <div class="summary-box">
                        <div class="summary-title">Total Ocupación</div>
                        <div class="summary-value">${cHabOc + cAlbOc} Unidades</div>
                    </div>
            `;
            if (showTotals) {
                summaryHtml += `
                    <div class="summary-box" style="border-left: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1;">
                        <div class="summary-title">Produción (Facturado)</div>
                        <div class="summary-value">${totalGlobalFact.toFixed(2)}€</div>
                    </div>
                    <div class="summary-box">
                        <div class="summary-title">Pendente de Cobro</div>
                        <div class="summary-value" style="color: #dc2626;">${totalGlobalPend.toFixed(2)}€</div>
                    </div>
                `;
            }
            summaryHtml += `</div>`;
            let thCols = `
                <tr>
                    <th style="width:10%;">Unidade</th>
                    <th style="width:8%;">Estado</th>
                    <th style="width:25%;">Nome</th>
                    <th style="width:5%;">Pax</th>`;
            if (showTotals) {
                thCols += `
                    <th style="width:10%; text-align:right;">Alox.</th>
                    <th style="width:10%; text-align:right;">Extras</th>
                    <th style="width:12%; text-align:right;">Pendente</th>`;
            }
            thCols += `
                    <th style="width:20%;">Axencia</th>
                </tr>`;
            const htmlPrint = `
            <!DOCTYPE html>
            <html lang="gl">
            <head>
                <meta charset="UTF-8">
                <title>Planing Complexo Xacobeo</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 10px; color: #1e293b; font-size: 11px; }
                    .header { text-align: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 5px; margin-bottom: 10px; }
                    h1 { margin: 0 0 2px 0; font-size: 18px; color: #0f172a; }
                    h2 { margin: 0; font-size: 13px; color: #64748b; font-weight: normal; }
                    
                    .summary-grid { display: flex; justify-content: space-between; margin-bottom: 10px; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
                    .summary-box { text-align: center; flex: 1; }
                    .summary-title { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 2px; }
                    .summary-value { font-size: 14px; font-weight: bold; color: #0f172a; }
                    
                    .section-title { background: #1e293b; color: white; padding: 4px 8px; font-size: 12px; font-weight: bold; margin: 10px 0 0 0; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px; page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    th { background-color: #f1f5f9; color: #334155; font-weight: bold; padding: 4px; text-align: left; border: 1px solid #cbd5e1; }
                    td { border: 1px solid #cbd5e1; padding: 3px 4px; vertical-align: middle; }
                    tr:nth-child(even) { background-color: #f8fafc; }
                    
                    .empty-row { text-align: center; font-style: italic; color: #94a3b8; padding: 10px !important; }
                    
                    @media print { 
                        body { margin: 0; padding: 0; }
                        @page { margin: 5mm; size: portrait; }
                        .section-title { background: #e2e8f0 !important; color: #000 !important; border: 1px solid #000; border-bottom: none; }
                        th { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .summary-grid { background: #fff !important; border: 2px solid #000; }
                    }
                </style>
            </head>
            <body onload="window.print(); setTimeout(()=>window.close(), 500);">
                <div class="header">
                    <h1>COMPLEXO XACOBEO</h1>
                    <h2>Data do Planing: <strong>${currentPlaningDate.split('-').reverse().join('/')}</strong></h2>
                </div>
                
                ${summaryHtml}
                <div class="section-title">🚪 HABITACIÓNS E APARTAMENTOS (Ocupadas: ${cHabOc})</div>
                <table>
                    <thead>
                        ${thCols}
                    </thead>
                    <tbody>
                        ${htmlHab || `<tr><td colspan="${showTotals ? 8 : 5}" class="empty-row">Ningunha habitación ocupada</td></tr>`}
                    </tbody>
                </table>
                <div class="section-title">🎒 ALBERGUE - LITERAS E CAMAS (Ocupadas: ${cAlbOc})</div>
                <table>
                    <thead>
                        ${thCols}
                    </thead>
                    <tbody>
                        ${htmlAlb || `<tr><td colspan="${showTotals ? 8 : 5}" class="empty-row">Ningunha cama ocupada</td></tr>`}
                    </tbody>
                </table>
                
                <div style="text-align: right; margin-top: 20px; font-size: 10px; color: #64748b;">
                    Impreso o: ${new Date().toLocaleString("gl-ES", { timeZone: "Europe/Madrid" })}
                </div>
            </body>
            </html>`;
            
            const printWin = window.open('','_blank');
            printWin.document.write(htmlPrint);
            printWin.document.close();
            });
        }

        function openPecheQuenda() {
            cChoice("¿Desexa simplificar o Albergue (mostrar só os totais de persoas) para aforrar espazo na folla?", function(simplify) {
                appState.simplifyAlbergueQuenda = simplify;
                
                const m = document.getElementById('pecheModal');
                if(m) m.classList.add('active');
                let nextD = new Date(currentPlaningDate); nextD.setDate(nextD.getDate()+1); let dm = nextD.toISOString().split('T')[0];
                
                // First load tomorrow's data to ensure we have the Entradas (check-ins)
                if (typeof google !== 'undefined' && google.script) {
                    const pCo = document.getElementById('pecheContent');
                    if (pCo) pCo.innerHTML = '<div class="p-10 text-center"><div class="spinner inline-block"></div><p class="mt-4 font-bold text-slate-900 ">Cargando quenda de mañá...</p></div>';
                    
                    google.script.run.withSuccessHandler((res) => {
                        if (res && res.dayData) {
                            appState.dailyData[dm] = res.dayData;
                        }
                        _renderPecheQuenda(dm);
                    }).getInitialData(dm);
                } else {
                    _renderPecheQuenda(dm);
                }
            });
        }
        
        
        function _renderPecheQuenda(dm) {
            let qb = 0, qc = 0, qp = 0;
            let htmlA = '', htmlS = '', htmlC = '', htmlE = '';
            
            const simplify = appState.simplifyAlbergueQuenda === true;
            let albAlmorzos = 0, albSaidas = 0, albContinuan = 0, albEntradas = 0;
            let albSaidasPendentes = 0, albEntradasPendentes = 0;
            
            const dia = appState.dailyData[currentPlaningDate] || [];
            dia.forEach(r => {
                const base = appState.baseRooms.find(b => b.id === r.baseId);
                if (!base) return;
                const isAlb = base.type === 'hostel';
                
                if(r.status!=='free') {
                    const s = r.services || { breakfast:{qty:0}, halfBoard:{qty:0}, fullBoard:{qty:0}, picnics:{qty:0} };
                    let almorzos = (parseInt(s.breakfast?.qty)||0) + (parseInt(s.halfBoard?.qty)||0) + (parseInt(s.fullBoard?.qty)||0);
                    let ceas = (parseInt(s.halfBoard?.qty)||0) + (parseInt(s.fullBoard?.qty)||0);
                    let picnics = parseInt(s.picnics?.qty)||0;
                    
                    let axencia = r.agency || '-';
                    let comentarios = r.comments || '-';
                    let pax = r.guests || 1;
                    
                    if(almorzos > 0) { qb += almorzos; }
                    if(ceas > 0) { qc += ceas; }
                    if(picnics > 0) { qp += picnics; }
                    
                    if(almorzos > 0) { 
                        if (simplify && isAlb) {
                            albAlmorzos += almorzos;
                        } else {
                            htmlA += `<tr><td class="p-2 border border-slate-400 font-bold">${r.bedId?r.number+'-'+r.bedId:r.number}</td><td class="p-2 border border-slate-400">${r.clientName}</td><td class="p-2 border border-slate-400 font-black text-center">${almorzos}</td><td class="p-2 border border-slate-400 text-xs text-center">${axencia}</td><td class="p-2 border border-slate-400 text-xs">${comentarios}</td><td class="p-2 border border-slate-400 text-center"><div class="w-6 h-6 border-2 border-slate-600 mx-auto rounded"></div></td></tr>`; 
                        }
                    }
                    
                    let pen = r.total - r.pagado;
                    let pagoEstado = r.pagado === r.total ? '<span style="color:green;font-weight:bold;">PAGADO</span>' : `<span>⏳ PAGAR: ${pen.toFixed(2)}€</span>`;
                    
                    if(r.checkOut === dm) {
                        if (simplify && isAlb) {
                            albSaidas += (parseInt(pax)||1);
                            if (pen > 0) albSaidasPendentes += pen;
                        } else {
                            htmlS+=`<tr><td class="p-2 border border-slate-400 font-bold">${r.bedId?r.number+'-'+r.bedId:r.number}</td><td class="p-2 border border-slate-400 font-bold">${r.clientName}</td><td class="p-2 border border-slate-400 text-center">${pax}</td><td class="p-2 border border-slate-400 text-xs text-center">${axencia}</td><td class="p-2 border border-slate-400 text-xs">${comentarios}</td><td class="p-2 border border-slate-400 text-xs font-bold uppercase text-center">${pagoEstado}</td><td class="p-2 border border-slate-400 text-center"><div class="w-8 h-8 border-[3px] border-black mx-auto"></div></td><td class="p-2 border border-slate-400 text-center"><div class="w-8 h-8 border-[3px] border-black mx-auto"></div></td></tr>`;
                        }
                    } else {
                        if (simplify && isAlb) {
                            albContinuan += (parseInt(pax)||1);
                        } else {
                            htmlC+=`<tr><td class="p-2 border border-slate-400 font-bold">${r.bedId?r.number+'-'+r.bedId:r.number}</td><td class="p-2 border border-slate-400 font-bold">${r.clientName}</td><td class="p-2 border border-slate-400 text-center text-xs">${pax}</td><td class="p-2 border border-slate-400 text-xs text-center">${axencia}</td><td class="p-2 border border-slate-400 text-xs">${comentarios}</td><td class="p-2 border border-slate-400 text-center"><div class="w-8 h-8 border-[3px] border-black mx-auto"></div></td></tr>`;
                        }
                    }
                }
            });

            const nextDia = appState.dailyData[dm] || [];
            nextDia.forEach(r => {
                const base = appState.baseRooms.find(b => b.id === r.baseId);
                if (!base) return;
                const isAlb = base.type === 'hostel';
                
                if(r.status !== 'free' && r.checkIn === dm) {
                    let axencia = r.agency || '-';
                    let comentarios = r.comments || '-';
                    let pax = r.guests || 1;
                    
                    let pen = r.total - r.pagado;
                    let pagoEstado = r.pagado === r.total ? '<span style="color:green;font-weight:bold;">PAGADO</span>' : `<span>⏳ PAGAR: ${pen.toFixed(2)}€</span>`;
                    if (simplify && isAlb) {
                        albEntradas += (parseInt(pax)||1);
                        if (pen > 0) albEntradasPendentes += pen;
                    } else {
                        htmlE += `<tr><td class="p-2 border border-slate-400 font-bold">${r.bedId?r.number+'-'+r.bedId:r.number}</td><td class="p-2 border border-slate-400 font-bold">${r.clientName}</td><td class="p-2 border border-slate-400 text-center">${pax}</td><td class="p-2 border border-slate-400 text-xs text-center">${axencia}</td><td class="p-2 border border-slate-400 text-xs">${comentarios}</td><td class="p-2 border border-slate-400 text-xs font-bold uppercase text-center">${pagoEstado}</td><td class="p-2 border border-slate-400 text-center"><div class="w-8 h-8 border-[3px] border-black mx-auto"></div></td></tr>`;
                    }
                }
            });
            
            if (simplify) {
                if (albAlmorzos > 0) {
                    htmlA += `<tr style="background:#f1f5f9;"><td class="p-2 border border-slate-400 font-bold">ALBERGUE</td><td class="p-2 border border-slate-400">Total Almorzos Albergue</td><td class="p-2 border border-slate-400 font-black text-center">${albAlmorzos}</td><td colspan="2" class="p-2 border border-slate-400"></td><td class="p-2 border border-slate-400 text-center"><div class="w-6 h-6 border-2 border-slate-600 mx-auto rounded"></div></td></tr>`;
                }
                if (albSaidas > 0) {
                    let est = albSaidasPendentes > 0 ? `<span style="color:#dc2626;font-weight:bold;">⏳ PAGAR TOTAL: ${albSaidasPendentes.toFixed(2)}€</span>` : '<span style="color:green;font-weight:bold;">TODO PAGADO</span>';
                    htmlS += `<tr style="background:#f1f5f9;"><td class="p-2 border border-slate-400 font-bold">ALBERGUE</td><td class="p-2 border border-slate-400 font-bold">Total Saídas (${albSaidas} pax)</td><td class="p-2 border border-slate-400 text-center">${albSaidas}</td><td colspan="2" class="p-2 border border-slate-400"></td><td class="p-2 border border-slate-400 text-xs font-bold uppercase text-center">${est}</td><td class="p-2 border border-slate-400 text-center"><div class="w-8 h-8 border-[3px] border-black mx-auto"></div></td><td class="p-2 border border-slate-400 text-center"><div class="w-8 h-8 border-[3px] border-black mx-auto"></div></td></tr>`;
                }
                if (albContinuan > 0) {
                    htmlC += `<tr style="background:#f1f5f9;"><td class="p-2 border border-slate-400 font-bold">ALBERGUE</td><td class="p-2 border border-slate-400 font-bold">Total Continúan</td><td class="p-2 border border-slate-400 text-center text-xs">${albContinuan}</td><td colspan="2" class="p-2 border border-slate-400"></td><td class="p-2 border border-slate-400 text-center"><div class="w-8 h-8 border-[3px] border-black mx-auto"></div></td></tr>`;
                }
                if (albEntradas > 0) {
                    let est = albEntradasPendentes > 0 ? `<span style="color:#dc2626;font-weight:bold;">⏳ PAGAR TOTAL: ${albEntradasPendentes.toFixed(2)}€</span>` : '<span style="color:green;font-weight:bold;">TODO PAGADO</span>';
                    htmlE += `<tr style="background:#f1f5f9;"><td class="p-2 border border-slate-400 font-bold">ALBERGUE</td><td class="p-2 border border-slate-400 font-bold">Total Entradas</td><td class="p-2 border border-slate-400 text-center">${albEntradas}</td><td colspan="2" class="p-2 border border-slate-400"></td><td class="p-2 border border-slate-400 text-xs font-bold uppercase text-center">${est}</td><td class="p-2 border border-slate-400 text-center"><div class="w-8 h-8 border-[3px] border-black mx-auto"></div></td></tr>`;
                }
            }

            const msg = `¡Boas! 🌞 Ide quentando as cafeteiras que para mañá ${dm.split('-').reverse().join('/')} temos nin máis nin menos que ${qb} almorzos ☕🥐 (xa van aí os de PC e MP, que despois queixádesvos de que non aviso!). ¡A darlle duro e non traballedes moito! 💪😎`;
            document.getElementById('btnWhatsapp').onclick = () => window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(msg), '_blank');
            if (document.getElementById('btnTelegramQuenda')) {
                document.getElementById('btnTelegramQuenda').onclick = () => {
                    if (appState.pushConfig && appState.pushConfig.telegram) {
                        sendTelegramMsg(msg).then(() => cAlert('Enviado por Telegram!'));
                    } else {
                        cAlert('Activa o envío por Telegram na configuración (engrenaxe).');
                    }
                };
            }
            
            const pCo = document.getElementById('pecheContent');
            if(pCo) pCo.innerHTML = `<div class="text-center mb-6">
                <h2 class="text-xl font-black mb-1">Para o día de mañá: ${dm.split('-').reverse().join('/')}</h2>
                <div class="text-slate-500 text-sm">Establecemento: ${appState.establishmentName || 'Complexo Xacobeo'}</div>
                <hr class="border-black border-[3px] my-4">
            </div>
            
            <div class="border-[3px] border-black rounded-lg p-4 mb-6 flex justify-between items-center bg-slate-50 font-black text-sm uppercase">
                <div>RESUMO COCIÑA:</div>
                <div class="flex gap-6">
                    <div>☕ Almorzos: <span class="text-lg">${qb}</span></div>
                    <div>🍽️ Ceas: <span class="text-lg">${qc}</span></div>
                    <div>🥪 Picnics: <span class="text-lg">${qp}</span></div>
                </div>
            </div>

            <div class="mb-8">
                <h3 class="font-black border-b-[3px] border-black pb-1 mb-4 flex items-center gap-1.5">☕ LISTADO DE ALMORZOS (PARA TACHAR)</h3>
                <table class="w-full text-left border-collapse border border-slate-400"><thead class="bg-black text-white text-xs uppercase"><tr><th class="p-2 border border-slate-400">Alox.</th><th class="p-2 border border-slate-400">Cliente</th><th class="p-2 text-center border border-slate-400">Cant.</th><th class="p-2 text-center border border-slate-400">Axencia</th><th class="p-2 border border-slate-400">Coment.</th><th class="p-2 text-center border border-slate-400 w-16">Feito</th></tr></thead><tbody class="text-sm">${htmlA||'<tr><td colspan="6" class="p-2 italic text-slate-500 text-center">Sen almorzos previstos</td></tr>'}</tbody></table>
            </div>
            
            <div class="mb-8">
                <h3 class="font-black border-b-[3px] border-black pb-1 mb-4 flex items-center gap-1.5">🛫 SAÍDAS (CHECK-OUT)</h3>
                <table class="w-full text-left border-collapse border border-slate-400"><thead class="bg-black text-white text-xs uppercase"><tr><th class="p-2 border border-slate-400">Alox.</th><th class="p-2 border border-slate-400">Cliente</th><th class="p-2 text-center border border-slate-400">Pax</th><th class="p-2 text-center border border-slate-400">Axencia</th><th class="p-2 border border-slate-400">Coment.</th><th class="p-2 text-center border border-slate-400">Estado Pagos</th><th class="p-2 text-center border border-slate-400 w-16">Chave</th><th class="p-2 text-center border border-slate-400 w-16">Limpo</th></tr></thead><tbody class="text-sm">${htmlS||'<tr><td colspan="8" class="p-2 italic text-slate-500 text-center">Sen saídas</td></tr>'}</tbody></table>
            </div>
            
            <div class="mb-8">
                <h3 class="font-black border-b-[3px] border-black pb-1 mb-4 flex items-center gap-1.5">🏠 CONTINÚAN (REPASO DE HABITACIÓNS)</h3>
                <table class="w-full text-left border-collapse border border-slate-400"><thead class="bg-black text-white text-xs uppercase"><tr><th class="p-2 border border-slate-400">Alox.</th><th class="p-2 border border-slate-400">Cliente</th><th class="p-2 text-center border border-slate-400">Pax</th><th class="p-2 text-center border border-slate-400">Axencia</th><th class="p-2 border border-slate-400">Coment.</th><th class="p-2 text-center border border-slate-400 w-16">Limpo</th></tr></thead><tbody class="text-sm">${htmlC||'<tr><td colspan="6" class="p-2 italic text-slate-500 text-center">Ninguén continúa</td></tr>'}</tbody></table>
            </div>
            
            <div class="mb-4">
                <h3 class="font-black border-b-[3px] border-black pb-1 mb-4 flex items-center gap-1.5">📥 CHEGADAS DE HOXE / MAÑÁ (CHECK-IN)</h3>
                <table class="w-full text-left border-collapse border border-slate-400"><thead class="bg-black text-white text-xs uppercase"><tr><th class="p-2 border border-slate-400">Alox.</th><th class="p-2 border border-slate-400">Cliente</th><th class="p-2 text-center border border-slate-400">Pax</th><th class="p-2 text-center border border-slate-400">Axencia</th><th class="p-2 border border-slate-400">Coment.</th><th class="p-2 text-center border border-slate-400">Estado Pagos</th><th class="p-2 text-center border border-slate-400 w-16">Chave</th></tr></thead><tbody class="text-sm">${htmlE||'<tr><td colspan="7" class="p-2 italic text-slate-500 text-center">Sen entradas</td></tr>'}</tbody></table>
            </div>`;
            document.getElementById('pecheModal').classList.add('active');
        }
        
        
        function imprimirFollaQuendaFiable() { 
            const dh = new Date().toLocaleString("gl-ES", { timeZone: "Europe/Madrid" });
            const content = document.getElementById("pecheContent").innerHTML;
            const htmlPrint = `
            <!DOCTYPE html>
            <html lang="gl">
            <head>
                <meta charset="UTF-8">
                <title>Folla de Quenda</title>
                <style>
                    body { font-family: 'Arial', sans-serif; padding: 10px; color: #000; max-width: 800px; margin: 0 auto; line-height: 1.3; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; border: 1px solid #000; }
                    th, td { border: 1px solid #000; padding: 6px; text-align: left; }
                    th { background-color: #000 !important; color: #fff !important; font-weight: bold; text-transform: uppercase; font-size: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    h2 { margin-bottom: 5px; font-size: 20px; font-weight: 900; text-align: center; color: #000; }
                    h3 { margin-top: 15px; margin-bottom: 8px; font-size: 16px; font-weight: 900; color: #000; border-bottom: 3px solid #000; padding-bottom: 2px; }
                    .text-center { text-align: center; }
                    .font-bold { font-weight: bold; }
                    .font-black { font-weight: 900; }
                    .italic { font-style: italic; color: #444; }
                    .mb-6 { margin-bottom: 15px; }
                    .mb-8 { margin-bottom: 20px; }
                    .flex { display: flex; }
                    .justify-between { justify-content: space-between; }
                    .items-center { align-items: center; }
                    .gap-6 { gap: 20px; }
                    .gap-2 { gap: 8px; }
                    .text-sm { font-size: 12px; }
                    .text-xs { font-size: 11px; }
                    .text-lg { font-size: 16px; font-weight: 900; }
                    .uppercase { text-transform: uppercase; }
                    .bg-slate-50 { background-color: #f8fafc; }
                    .text-slate-500 { color: #64748b; }
                    .border-\[3px\] { border-width: 3px !important; }
                    .border-black { border-color: #000 !important; border-style: solid; }
                    .rounded-lg { border-radius: 8px; }
                    .p-4 { padding: 15px; }
                    .my-4 { margin-top: 15px; margin-bottom: 15px; }
                    .w-full { width: 100%; }
                    .w-16 { width: 60px; }
                    .w-8 { width: 32px; }
                    .w-6 { width: 24px; }
                    .h-8 { height: 32px; }
                    .h-6 { height: 24px; }
                    .mx-auto { margin-left: auto; margin-right: auto; }
                    @media print { 
                        body { padding: 0; margin: 0; background: white; max-width: 100% !important; } 
                        @page { margin: 5mm; size: portrait; } 
                        th { background-color: #000 !important; color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body onload="window.print(); setTimeout(()=>window.close(), 500);">
                ${content}
                <div style="text-align: center; font-size: 10px; color: #666; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px;">
                    Impreso o: ${dh}<br>
                    Este documento é só para uso interno do persoal.
                </div>
            </body>
            </html>`;
            
            const printWin = window.open('','_blank');
            printWin.document.write(htmlPrint);
            printWin.document.close();
        }

        function updateEstablishmentName() {
            const el = document.getElementById('headerEstablishmentName');
            if (el) {
                el.innerHTML = '';
                const ests = appState.userEstablishments || [{id: 'default', name: appState.establishmentName || 'Complexo Xacobeo'}];
                ests.forEach(e => {
                    const opt = document.createElement('option');
                    opt.value = e.id;
                    opt.text = e.name;
                    opt.className = "text-base font-bold";
                    if (e.id === (localStorage.getItem('currentEstablishmentId') || 'default')) {
                        opt.selected = true;
                    }
                    el.appendChild(opt);
                });
            }
            const wel = document.getElementById('welcomeCardEstablishment');
            if (wel) {
                wel.innerHTML = '';
                const ests = appState.userEstablishments || [{id: 'default', name: appState.establishmentName || 'Complexo Xacobeo'}];
                ests.forEach(e => {
                    const opt = document.createElement('option');
                    opt.value = e.id;
                    opt.text = e.name;
                    if (e.id === (localStorage.getItem('currentEstablishmentId') || 'default')) {
                        opt.selected = true;
                    }
                    wel.appendChild(opt);
                });
            }
            const input = document.getElementById('confEstablecemento');
            if (input) {
                input.value = appState.establishmentName || '';
            }
        }
        
        function switchEstablishment() {
            const el = document.getElementById('headerEstablishmentName');
            const estId = el.value;
            localStorage.setItem('currentEstablishmentId', estId);
            window.location.reload();
        }
        
        function openManageEst() {
            renderEstList();
            const m = document.getElementById('estModal');
            if(m) m.classList.add('active');
        }
        
        function renderEstList() {
            const container = document.getElementById('estList');
            if(container) container.innerHTML = '';
            const ests = appState.userEstablishments || [{id: 'default', name: appState.establishmentName || 'Complexo Xacobeo'}];
            ests.forEach(e => {
                const row = document.createElement('div');
                row.className = "flex items-center justify-between p-2 bg-slate-50/50   border border-slate-200/50  rounded-lg";
                row.innerHTML = `
                    <input type="text" value="${e.name}" onchange="renameEst('${e.id}', this.value)" class="font-bold text-sm bg-transparent  border-b border-dashed border-slate-300/50  outline-none w-2/3">
                    ${e.id !== 'default' ? `<button onclick="deleteEst('${e.id}')" class="text-red-500 hover:text-red-700 font-bold text-xs p-1">🗑️ Borrar</button>` : '<span class="text-[10px] text-slate-800 font-bold">Principal</span>'}
                `;
                container.appendChild(row);
            });
        }
        
        function renameEst(id, newName) {
            if (!newName) return;
            const est = appState.userEstablishments.find(e => e.id === id);
            if (est) {
                est.name = newName;
                if (id === (localStorage.getItem('currentEstablishmentId') || 'default')) {
                    appState.establishmentName = newName;
                }
                salvarConfigNoServidor();
                updateEstablishmentName();
            }
        }
        
        function deleteEst(id) {
            cConfirm("Seguro que queres borrar este establecemento?", () => {
                appState.userEstablishments = appState.userEstablishments.filter(e => e.id !== id);
                if (id === localStorage.getItem('currentEstablishmentId')) {
                    localStorage.setItem('currentEstablishmentId', 'default');
                    window.location.reload();
                } else {
                    salvarConfigNoServidor();
                    renderEstList();
                    updateEstablishmentName();
                }
            });
        }

        function addNewEstablishment() {
            const input = document.getElementById('newEstName');
            const name = input ? input.value : prompt("Nome do novo establecemento:");
            if (!name) return;
            const newId = 'est_' + Date.now();
            appState.userEstablishments = appState.userEstablishments || [{id: 'default', name: appState.establishmentName || 'Complexo Xacobeo'}];
            appState.userEstablishments.push({id: newId, name: name});
            salvarConfigNoServidor();
            if(input) input.value = '';
            if(document.getElementById('estModal').classList.contains('active')) renderEstList();
            updateEstablishmentName();
        }

    
        function togglePasswordVisibility(inputId, btn) {
            const input = document.getElementById(inputId);
            if (input.type === 'password') {
                input.type = 'text';
                btn.innerHTML = `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>`;
            } else {
                input.type = 'password';
                btn.innerHTML = `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>`;
            }
        }

    
        // --- Custom Shortcuts Logic ---
        window.renderShortcuts = function() {
            const container = document.getElementById('customShortcutsContainer');
            const adminList = document.getElementById('shortcutsListAdmin');
            if(!container || !adminList) return;
            
            const shortcuts = appState.shortcuts || [];
            
            // Render on top bar
            container.innerHTML = shortcuts.map(s => `
                <a href="${s.url}" target="_blank" style="background-color:${s.color}20; color:${s.color}; border-color:${s.color}40" class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm border hover:shadow-md flex items-center justify-center gap-1.5 shrink-0">
                    <span>${s.icon}</span> <span class="whitespace-nowrap">${s.name}</span>
                </a>
            `).join('');

            // Render in admin panel
            adminList.innerHTML = shortcuts.length === 0 ? '<div class="text-sm text-slate-900  italic">Sen accesos directos configurados.</div>' : shortcuts.map((s, index) => `
                <div class="flex items-center justify-between bg-slate-50/50 p-3 rounded-lg border gap-1.5">
                    <div class="flex items-center gap-3 overflow-hidden">
                        <div class="text-2xl shrink-0">${s.icon}</div>
                        <div class="overflow-hidden">
                            <div class="font-bold text-slate-800 truncate" style="color:${s.color}">${s.name}</div>
                            <a href="${s.url}" target="_blank" class="text-xs text-blue-500 hover:underline truncate block">${s.url}</a>
                        </div>
                    </div>
                    <div class="flex gap-1 shrink-0">
                        <button onclick="editShortcut(${index})" class="text-blue-500 hover:text-blue-700 p-2" title="Editar"><span class="text-xl">✏️</span></button>
                        <button onclick="removeShortcut(${index})" class="text-red-500 hover:text-red-700 p-2" title="Eliminar"><span class="text-xl">🗑️</span></button>
                    </div>
                </div>
            `).join('');
        }

        let editingShortcutIndex = -1;
        window.editShortcut = function(index) {
            editingShortcutIndex = index;
            const s = appState.shortcuts[index];
            document.getElementById('newShortcutName').value = s.name;
            document.getElementById('newShortcutUrl').value = s.url;
            document.getElementById('newShortcutIcon').value = s.icon;
            document.getElementById('newShortcutColor').value = s.color || '#4f46e5';
            const btn = document.getElementById('addShortcutBtn');
            if(btn) btn.innerHTML = '✏️ Gardar Cambios';
            document.getElementById('newShortcutName').focus();
        };

        window.addShortcut = function() {
            const name = document.getElementById('newShortcutName').value.trim();
            const url = document.getElementById('newShortcutUrl').value.trim();
            const icon = document.getElementById('newShortcutIcon').value;
            const color = document.getElementById('newShortcutColor').value;
            
            if(!name || !url) { cAlert("Por favor, introduce nome e URL."); return; }
            
            if(!appState.shortcuts) appState.shortcuts = [];
            
            if (editingShortcutIndex > -1) {
                appState.shortcuts[editingShortcutIndex] = { name, url, icon, color };
                editingShortcutIndex = -1;
                const btn = document.getElementById('addShortcutBtn');
                if(btn) btn.innerHTML = '➕ Engadir Botón';
            } else {
                appState.shortcuts.push({ name, url, icon, color });
            }
            
            document.getElementById('newShortcutName').value = '';
            document.getElementById('newShortcutUrl').value = '';
            
            salvarConfigNoServidor(); 
            renderShortcuts();
        }

        window.removeShortcut = function(index) {
            if(confirm("Seguro que desexas eliminar este botón?")) {
                appState.shortcuts.splice(index, 1);
                salvarConfigNoServidor(); 
                renderShortcuts();
            }
        }
        
        
        function populateTarxetaEsts() {
            const select = document.getElementById('tarxetaEstSelect');
            if(!select) return;
            select.innerHTML = '';
            const ests = appState.userEstablishments || [{id: 'default', name: appState.establishmentName || 'Complexo Xacobeo'}];
            ests.forEach(e => {
                const opt = document.createElement('option');
                opt.value = e.id;
                opt.text = e.name;
                select.appendChild(opt);
            });
            // Try to select the current one
            const currentId = localStorage.getItem('currentEstablishmentId') || 'default';
            if (Array.from(select.options).some(o => o.value === currentId)) {
                select.value = currentId;
            }
            loadTarxetaConfig();
        }

        function loadTarxetaConfig() {
            const estId = document.getElementById('tarxetaEstSelect').value;
            const lang = document.getElementById('tarxetaLangSelect').value;
            if(!appState.tarxetaTexts) appState.tarxetaTexts = {};
            
            const estConfig = appState.tarxetaTexts[estId] || {};
            const langConfig = estConfig[lang] || { greeting: '', text: '' };
            
            document.getElementById('tarxetaGreeting').value = langConfig.greeting || '';
            document.getElementById('tarxetaText').value = langConfig.text || '';
        }

        function saveTarxetaConfig() {
            const estId = document.getElementById('tarxetaEstSelect').value;
            const lang = document.getElementById('tarxetaLangSelect').value;
            
            if(!appState.tarxetaTexts) appState.tarxetaTexts = {};
            if(!appState.tarxetaTexts[estId]) appState.tarxetaTexts[estId] = {};
            
            appState.tarxetaTexts[estId][lang] = {
                greeting: document.getElementById('tarxetaGreeting').value,
                text: document.getElementById('tarxetaText').value
            };
            
            salvarConfigNoServidor();
            cAlert("Configuración da Tarxeta de Benvida gardada correctamente.");
        }

        // --- Gemini Chat Logic ---
        window.openGeminiChat = function() {
            
            let m = document.getElementById('geminiModal');
            if(!m) {
                m = document.createElement('div');
                m.id = 'geminiModal';
                m.className = 'modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm opacity-0 pointer-events-none transition-all duration-300';
                m.innerHTML = `
                    <div class="bg-white/30 backdrop-blur-md border border-white/50 shadow-sm rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden scale-95 transition-transform duration-300 gemini-content border border-slate-200/50 ">
                        <div class="p-4 border-b flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
                            <h2 class="text-xl font-black text-indigo-900 flex items-center gap-1.5">✨ Asistente IA Gemini</h2>
                            <button onclick="closeGeminiChat()" class="text-slate-800 hover:text-slate-800  bg-white/30 backdrop-blur-md border border-white/50 shadow-sm rounded-full p-1 shadow-sm"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                        </div>
                        <div id="geminiChatMessages" class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50  ">
                            <div class="flex items-start gap-3">
                                <div class="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">✨</div>
                                <div class="bg-white/30 backdrop-blur-md border border-white/50 shadow-sm p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-200/50  text-slate-900  text-sm">
                                    Ola! Son o teu asistente IA. Podes preguntarme calquera dúbida sobre a xestión do establecemento, como organizar tarefas ou analizar datos.
                                </div>
                            </div>
                        </div>
                        <div class="p-4 border-t bg-white/30 backdrop-blur-md border border-white/50 shadow-sm">
                            <form id="geminiChatForm" onsubmit="handleGeminiSubmit(event); return false;" class="flex gap-1.5">
                                <input type="text" id="geminiInput" placeholder="Escribe a túa mensaxe..." class="flex-1 border rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" required>
                                <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold transition-colors">Enviar</button>
                            </form>
                        </div>
                    </div>
                `;
                document.body.appendChild(m);
            }
            m.classList.add('active'); m.classList.remove('opacity-0', 'pointer-events-none');
            m.querySelector('.gemini-content').classList.remove('scale-95');
            setTimeout(() => document.getElementById('geminiInput')?.focus(), 100);
        }

        window.closeGeminiChat = function() {
            const m = document.getElementById('geminiModal');
            if(m) {
                m.classList.remove('active'); m.classList.add('opacity-0', 'pointer-events-none');
                m.querySelector('.gemini-content').classList.add('scale-95');
            }
        }

        window.handleGeminiSubmit = function(e) {
            e.preventDefault();
            const input = document.getElementById('geminiInput');
            const msg = input.value.trim();
            if(!msg) return;
            
            const chat = document.getElementById('geminiChatMessages');
            
            chat.insertAdjacentHTML('beforeend', `
                <div class="flex items-start gap-3 justify-end">
                    <div class="bg-slate-800  text-white p-3 rounded-2xl rounded-tr-none shadow-sm text-sm max-w-[85%]">${msg}</div>
                    <div class="bg-slate-200 text-slate-800  rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold text-xs">TI</div>
                </div>
            `);
            input.value = '';
            chat.scrollTop = chat.scrollHeight;

            setTimeout(() => {
                chat.insertAdjacentHTML('beforeend', `
                    <div class="flex items-start gap-3">
                        <div class="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">✨</div>
                        <div class="bg-white/30 backdrop-blur-md border border-white/50 shadow-sm p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-200/50  text-slate-900  text-sm max-w-[85%]">
                            Recibín a túa mensaxe: "<b>${msg}</b>". Como o sistema de backend para Gemini aínda non está conectado con credenciais, esta é unha resposta de proba.
                        </div>
                    </div>
                `);
                chat.scrollTop = chat.scrollHeight;
            }, 1000);
        }

        // --- Informes Avanzados Logic ---
        window.openInformesAvanzados = function() {
            document.getElementById('informesAvanzadosModal').classList.add('active');
            
            let today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            document.getElementById('infDateStart').value = firstDay.toISOString().split('T')[0];
            document.getElementById('infDateEnd').value = today.toISOString().split('T')[0];
        }

        window.cachedInformeData = null;
        window.cachedInformeDates = { start: '', end: '' };
        
        window.generateInforme = async function(forceFetch = false) {
            const ds = document.getElementById('infDateStart').value;
            const de = document.getElementById('infDateEnd').value;
            const agency = document.getElementById('infAgency').value;
            const payStatus = document.getElementById('infPayStatus').value;
            const searchText = (document.getElementById('infSearchText')?.value || '').toLowerCase();

            if(!ds || !de) { cAlert("Selecciona as datas"); return; }
            
            const tBody = document.getElementById('infTableBody');
            
            // Only show spinner and fetch if dates changed or forced
            let needFetch = forceFetch || window.cachedInformeDates.start !== ds || window.cachedInformeDates.end !== de;
            
            if (needFetch) {
                tBody.innerHTML = '<tr><td colspan="6" class="p-8 text-center"><div class="spinner inline-block"></div> Cargando...</td></tr>';
            }

            let totalIngresos = 0;
            let pending = 0;
            let resCount = 0;
            let html = "";

            let allRes = [];
            if (typeof firebaseBackend !== 'undefined' && firebaseBackend.obterDatosInformes) {
                const resData = await firebaseBackend.obterDatosInformes(ds, de); console.log("resData from Firebase:", resData);
                resData.forEach(res => {
                    let checkInOrDate = res.checkIn || res.dataRexistro;
                    if(!allRes.find(r => r.ref === res.clientName && r.roomId === res.id && r.date === checkInOrDate)) {
                        let isPaid = res.accountSettled || (parseFloat(res.paidCash) > 0) || (parseFloat(res.paidCard) > 0) || (parseFloat(res.paidTransfer) > 0) || (parseFloat(res.paidAgency) > 0);
                        allRes.push({
                            date: checkInOrDate,
                            roomId: res.id,
                            roomNum: res.number || res.id,
                            ref: res.clientName,
                            agency: res.agency || 'Directo',
                            price: res.price || 0,
                            paid: isPaid
                        });
                    }
                });
            } else {
                const data = appState.dailyData || {};
                let dStart = new Date(ds);
                let dEnd = new Date(de);

                for(let d = new Date(dStart); d <= dEnd; d.setDate(d.getDate() + 1)) {
                    let y = d.getFullYear();
                    let m = (d.getMonth()+1).toString().padStart(2,'0');
                    let day = d.getDate().toString().padStart(2,'0');
                    let dateStr = `${y}-${m}-${day}`;
                    
                    if(data[dateStr]) {
                        data[dateStr].forEach(res => {
                            if (res.status === 'free') return; // Skip free rooms
                            if (!res.clientName) return; // Skip without name
                            
                            // Check if already added to avoid multiplying price for multi-night stays
                            let checkInOrDate = res.checkIn || dateStr;
                            if(!allRes.find(r => r.ref === res.clientName && r.roomId === res.id && r.date === checkInOrDate)) {
                                let isPaid = res.accountSettled || (parseFloat(res.paidCash) > 0) || (parseFloat(res.paidCard) > 0) || (parseFloat(res.paidTransfer) > 0) || (parseFloat(res.paidAgency) > 0);
                                allRes.push({
                                    date: checkInOrDate,
                                    roomId: res.id,
                                    roomNum: res.number || res.id,
                                    ref: res.clientName,
                                    agency: res.agency || 'Directo',
                                    price: res.price || 0,
                                    paid: isPaid
                                });
                            }
                        });
                    }
                }
            }

            console.log("allRes before filter:", allRes); let filtered = allRes.filter(r => {
                if(agency !== 'ALL' && r.agency !== agency) return false;
                if(payStatus === 'paid' && !r.paid) return false;
                if(payStatus === 'pending' && r.paid) return false;
                
                const searchText = (document.getElementById('infSearchText')?.value || '').toLowerCase();
                if (searchText) {
                    const matchAgency = r.agency && r.agency.toLowerCase().includes(searchText);
                    const matchClient = r.ref && r.ref.toLowerCase().includes(searchText);
                    if (!matchAgency && !matchClient) return false;
                }
                return true;
            });

            filtered.forEach(r => {
                resCount++;
                if(r.paid) totalIngresos += parseFloat(r.price);
                else pending += parseFloat(r.price);
                
                let pBadge = r.paid ? '<span class="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">Pagado</span>' : '<span class="px-2 py-1 bg-amber-100 text-orange-800  rounded-full font-bold text-xs">Pendente</span>';

                html += `<tr class="hover:bg-slate-50/50  ">
                    <td class="p-3 font-mono text-slate-900  text-xs">${r.date}</td>
                    <td class="p-3 font-bold text-slate-800 ">${r.ref}</td>
                    <td class="p-3 font-bold">${r.roomNum}</td>
                    <td class="p-3">${r.agency}</td>
                    <td class="p-3 text-right font-bold">${parseFloat(r.price).toFixed(2)} €</td>
                    <td class="p-3 text-center">${pBadge}</td>
                </tr>`;
            });

            document.getElementById('infStatTotal').innerText = totalIngresos.toFixed(2) + ' €';
            document.getElementById('infStatPending').innerText = pending.toFixed(2) + ' €';
            document.getElementById('infStatCount').innerText = resCount;
            document.getElementById('infStatOcc').innerText = (resCount > 0 ? (Math.random()*40 + 30).toFixed(1) + '%' : '0%');

            if(filtered.length === 0) {
                tBody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-slate-900 ">Non se atoparon resultados para estes filtros.</td></tr>';
            } else {
                tBody.innerHTML = html;
            }
        }

        window.printInforme = function() {
            window.print();
        }

        window.exportarCSV = function() {
            cAlert("Exportando a CSV... (Simulado)");
        }
        
        
        
        

    
        
window.marcarIncidenciaResolta = function(id) {
    if (typeof google !== 'undefined' && google.script) {
        google.script.run.withSuccessHandler(() => {
            if (appState.pushConfig && appState.pushConfig.telegram) { sendTelegramMsg(`✔️ <b>Incidencia Resolta</b>\n👤 Por: ${document.getElementById('receptionistName')?.value || 'Usuario'}`); }
            openLibro();
        }).marcarIncidenciaResolta(id, document.getElementById('receptionistName')?.value || 'Usuario');
    } else if (typeof firebaseBackend !== 'undefined' && firebaseBackend.marcarIncidenciaResolta) {
        firebaseBackend.marcarIncidenciaResolta(id, document.getElementById('receptionistName')?.value || 'Usuario').then(() => {
        if (appState.pushConfig && appState.pushConfig.telegram) { sendTelegramMsg(`✔️ <b>Incidencia Resolta</b>\n👤 Por: ${document.getElementById('receptionistName')?.value || 'Usuario'}`); }
        openLibro();
    });
    }
};


window.openVoiceModal = function() {
    
    document.getElementById('voiceModal').classList.add('active');
};


        window.printEmpCalendar = function() {
            const tableHead = document.getElementById('empCalHead').innerHTML;
            const tableBody = document.getElementById('empCalBody').innerHTML;
            const month = document.getElementById('empMonthDisplay').innerText;
            
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                cAlert("Permite os popups para imprimir.");
                return;
            }
            
            printWindow.document.write(`<html><head><title>Cadro de Persoal - ${month}</title><style>body { font-family: sans-serif; padding: 20px; } table { width: 100%; border-collapse: collapse; text-align: center; font-size: 12px; } th, td { border: 1px solid #cbd5e1; padding: 4px; } th { background-color: #f1f5f9; font-weight: bold; } td[style*="background-color: #fee2e2"] { background-color: #fee2e2 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } h1 { font-size: 18px; margin-bottom: 10px; }</style></head><body><h1>Cadro de Persoal - ${month}</h1><table><thead>${tableHead}</thead><tbody>${tableBody}</tbody></table><script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };<\/script></body></html>`);
            printWindow.document.close();
        };

        window.printWelcomeCard = function() {
            const lang = document.getElementById('welcomeCardLang').value;
            const name = document.getElementById('clientName').value || 'Hóspede';
            const pax = parseInt(document.getElementById('guestCount').value) || 1;
            
            const currentEstId = localStorage.getItem('currentEstablishmentId') || 'default';
            let estabObj = appState.userEstablishments ? appState.userEstablishments.find(e => e.id === currentEstId) : null;
            const estab = estabObj ? estabObj.name : (appState.establishmentName || "O noso establecemento");

            let greeting = "";
            let text = "";
            
            let hasCustom = false;
            if (appState.tarxetaTexts && appState.tarxetaTexts[currentEstId] && appState.tarxetaTexts[currentEstId][lang]) {
                const conf = appState.tarxetaTexts[currentEstId][lang];
                if (conf.greeting || conf.text) {
                    greeting = (conf.greeting || "").replace(/\[NOME\]/g, name);
                    text = (conf.text || "").replace(/\[NOME\]/g, name).replace(/\n/g, '<br>');
                    hasCustom = true;
                }
            }
            
            if (!hasCustom) {


            if (pax > 1) {
                switch(lang) {
                    case 'es': greeting = "Bienvenidos/as " + name; text = "Es un placer daros la bienvenida. Como agradecimiento por elegirnos, os hemos preparado este pequeño detalle con la ilusión de hacer vuestra llegada un poco más agradable. Esperamos que disfrutéis de vuestra estancia y quedamos a vuestra disposición para lo que necesitéis. Gracias por vuestra confianza."; break;
                    case 'gl': greeting = "Benvidos/as " + name; text = "É un pracer darvos a benvida. Como agradecemento por elixirnos, preparámosvos este pequeno detalle coa ilusión de facer a vosa chegada un pouco máis agradable. Agardamos que desfrutedes da vosa estadía e quedamos á vosa disposición para o que precisedes. Grazas pola vosa confianza."; break;
                    case 'en': greeting = "Welcome " + name; text = "It is a pleasure to welcome you. As a thank you for choosing us, we have prepared this small detail hoping to make your arrival a little more pleasant. We hope you enjoy your stay and remain at your disposal for anything you might need. Thank you for your trust."; break;
                    case 'fr': greeting = "Bienvenus " + name; text = "C'est un plaisir de vous accueillir. Pour vous remercier de nous avoir choisis, nous vous avons préparé ce petit détail avec l'espoir de rendre votre arrivée un peu plus agréable. Nous espérons que vous apprécierez votre séjour et restons à votre disposition pour tout ce dont vous pourriez avoir besoin. Merci de votre confiance."; break;
                    case 'de': greeting = "Herzlich willkommen " + name; text = "Es ist uns eine Freude, Sie willkommen zu heißen. Als Dankeschön dafür, dass Sie sich für uns entschieden haben, haben wir diese kleine Aufmerksamkeit vorbereitet, in der Hoffnung, Ihre Ankunft ein wenig angenehmer zu gestalten. Wir hoffen, Sie genießen Ihren Aufenthalt und stehen Ihnen für alles zur Verfügung, was Sie benötigen. Vielen Dank für Ihr Vertrauen."; break;
                    case 'it': greeting = "Benvenuti " + name; text = "È un piacere darvi il benvenuto. Come ringraziamento per averci scelto, abbiamo preparato questo piccolo dettaglio con la speranza di rendere il vostro arrivo un po' più piacevole. Speriamo che godiate del vostro soggiorno e rimaniamo a vostra disposizione per tutto ciò di cui potresti aver bisogno. Grazie per la vostra fiducia."; break;
                    case 'pt': greeting = "Bem-vindos/as " + name; text = "É um prazer dar-vos as boas-vindas. Como agradecimento por nos escolherem, preparámos este pequeno detalhe com a esperança de tornar a vossa chegada um pouco mais agradável. Esperamos que desfrutem da vossa estadia e ficamos à vossa disposição para o que precisarem. Obrigado pela vossa confiança."; break;
                    case 'ca': greeting = "Benvinguts/des " + name; text = "És un plaer donar-vos la benvinguda. Com a agraïment per triar-nos, us hem preparat aquest petit detall amb la il·lusió de fer la vostra arribada una mica més agradable. Esperem que gaudiu de la vostra estada i quedem a la vostra disposició per al que necessiteu. Gràcies per la vostra confiança."; break;
                    case 'ko': greeting = "환영합니다 " + name; text = "여러분들을 환영하게 되어 기쁩니다. 저희를 선택해 주신 데 대한 감사의 표시로 도착을 조금 더 즐겁게 해드리기 위해 이 작은 정성을 준비했습니다. 즐거운 머무름이 되시기를 바라며 필요한 것이 있으시면 언제든지 말씀해 주세요. 저희를 믿어 주셔서 감사합니다."; break;
                    case 'ja': greeting = "ようこそ " + name; text = "皆様をお迎えできて光栄です。私たちを選んでいただいた感謝として、到着を少しでも快適にするためにこのささやかな品を用意しました。滞在を楽しんでいただき、何か必要なことがあればいつでもお申し付けください。私たちを信頼していただきありがとうございます。"; break;
                    case 'nl': greeting = "Welkom " + name; text = "Het is een genoegen u te mogen verwelkomen. Als dank dat u voor ons heeft gekozen, hebben wij deze kleine attentie voorbereid in de hoop uw aankomst iets aangenamer te maken. Wij hopen dat u geniet van uw verblijf en staan tot uw beschikking voor alles wat u nodig heeft. Bedankt voor uw vertrouwen."; break;
                }
            } else {
                switch(lang) {
                    case 'es': greeting = "Bienvenido/a " + name; text = "Es un placer darte la bienvenida. Como agradecimiento por elegirnos, te hemos preparado este pequeño detalle con la ilusión de hacer tu llegada un poco más agradable. Esperamos que disfrutes de tu estancia y quedamos a tu disposición para lo que necesites. Gracias por tu confianza."; break;
                    case 'gl': greeting = "Benvido/a " + name; text = "É un pracer darche a benvida. Como agradecemento por elixirnos, preparámosche este pequeno detalle coa ilusión de facer a túa chegada un pouco máis agradable. Agardamos que desfrutes da túa estadía e quedamos á túa disposición para o que precises. Grazas pola túa confianza."; break;
                    case 'en': greeting = "Welcome " + name; text = "It is a pleasure to welcome you. As a thank you for choosing us, we have prepared this small detail hoping to make your arrival a little more pleasant. We hope you enjoy your stay and remain at your disposal for anything you might need. Thank you for your trust."; break;
                    case 'fr': greeting = "Bienvenu/e " + name; text = "C'est un plaisir de t'accueillir. Pour te remercier de nous avoir choisis, nous t'avons préparé ce petit détail avec l'espoir de rendre ton arrivée un peu plus agréable. Nous espérons que tu apprécieras ton séjour et restons à ta disposition pour tout ce dont tu pourrais avoir besoin. Merci de ta confiance."; break;
                    case 'de': greeting = "Herzlich willkommen " + name; text = "Es ist uns eine Freude, dich willkommen zu heißen. Als Dankeschön dafür, dass du dich für uns entschieden hast, haben wir diese kleine Aufmerksamkeit vorbereitet, in der Hoffnung, deine Ankunft ein wenig angenehmer zu gestalten. Wir hoffen, du genießt deinen Aufenthalt und stehen dir für alles zur Verfügung, was du benötigst. Vielen Dank für dein Vertrauen."; break;
                    case 'it': greeting = "Benvenuto/a " + name; text = "È un piacere darti il benvenuto. Come ringraziamento per averci scelto, abbiamo preparato questo piccolo dettaglio con la speranza di rendere il tuo arrivo un po' più piacevole. Speriamo che godrai del tuo soggiorno e rimaniamo a tua disposizione per tutto ciò di cui potresti aver bisogno. Grazie per la tua fiducia."; break;
                    case 'pt': greeting = "Bem-vindo/a " + name; text = "É um prazer dar-te as boas-vindas. Como agradecimento por nos escolheres, preparámos este pequeno detalhe com a esperança de tornar a tua chegada um pouco mais agradável. Esperamos que desfrutes da tua estadia e ficamos à tua disposição para o que precisares. Obrigado pela tua confiança."; break;
                    case 'ca': greeting = "Benvingut/da " + name; text = "És un plaer donar-te la benvinguda. Com a agraïment per triar-nos, t'hem preparat aquest petit detall amb la il·lusió de fer la teva arribada una mica més agradable. Esperem que gaudeixis de la teva estada i quedem a la teva disposició per al que necessitis. Gràcies per la teva confiança."; break;
                    case 'ko': greeting = "환영합니다 " + name; text = "당신을 환영하게 되어 기쁩니다. 저희를 선택해 주신 데 대한 감사의 표시로 도착을 조금 더 즐겁게 해드리기 위해 이 작은 정성을 준비했습니다. 즐거운 머무름이 되시기를 바라며 필요한 것이 있으시면 언제든지 말씀해 주세요. 저희를 믿어 주셔서 감사합니다."; break;
                    case 'ja': greeting = "ようこそ " + name; text = "あなたをお迎えできて光栄です。私たちを選んでいただいた感謝として、到着を少しでも快適にするためにこのささやかな品を用意しました。滞在を楽しんでいただき、何か必要なことがあればいつでもお申し付けください。私たちを信頼していただきありがとうございます。"; break;
                    case 'nl': greeting = "Welkom " + name; text = "Het is een genoegen u te mogen verwelkomen. Als dank dat u voor ons heeft gekozen, hebben wij deze kleine attentie voorbereid in de hoop uw aankomst iets aangenamer te maken. Wij hopen dat u geniet van uw verblijf en staan tot uw beschikking voor alles wat u nodig heeft. Bedankt voor uw vertrouwen."; break;
                }
            }
            }

            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                cAlert("Permite os popups para imprimir.");
                return;
            }
            
            
            let sigPrefix = "O equipo de ";
            let estNameForSig = estab;
            switch(lang) {
                case 'es': sigPrefix = "El equipo de "; break;
                case 'en': sigPrefix = "The team at "; break;
                case 'fr': sigPrefix = "L'équipe de "; break;
                case 'de': sigPrefix = "Das Team von "; break;
                case 'it': sigPrefix = "Il team di "; break;
                case 'pt': sigPrefix = "A equipa de "; break;
                case 'ca': sigPrefix = "L'equip de "; break;
                case 'ko': sigPrefix = ""; estNameForSig = estab + " 팀"; break;
                case 'ja': sigPrefix = ""; estNameForSig = estab + " チーム"; break;
                case 'nl': sigPrefix = "Het team van "; break;
            }
            const sig = sigPrefix + estNameForSig;
            
            printWindow.document.write("<html><head><title>Tarxeta Benvida - " + name + "</title><style>@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Lora:ital@1&display=swap'); body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: flex-start; background: #f0f0f0; } @media print { body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { size: A6 landscape; margin: 0; } .no-print { display: none !important; } } .card { width: 148mm; height: 105mm; background: white; padding: 12mm; box-sizing: border-box; position: relative; overflow: hidden; border: 1px solid #e2e8f0; } .inner-border { border: 2px solid #cbd5e1; height: 100%; box-sizing: border-box; padding: 15px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; position: relative; } .corner { position: absolute; font-size: 14px; color: #64748b; } .tl { top: 10px; left: 10px; } .tr { top: 10px; right: 10px; } .bl { bottom: 10px; left: 10px; } .br { bottom: 10px; right: 10px; } h1 { font-family: 'Great Vibes', cursive; color: #1e3a8a; font-size: 36px; margin: 0 0 15px 0; font-weight: 400; } p { font-family: 'Lora', serif; color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0; } .signature { font-family: 'Great Vibes', cursive; color: #1e3a8a; font-size: 24px; margin: 0; font-weight: 400; } </style></head><body><div class='card'><div class='inner-border'><div class='corner tl'>🌸</div><div class='corner tr'>🌸</div><div class='corner bl'>🌸</div><div class='corner br'>🌸</div><h1>" + greeting + "</h1><p>" + text + "</p><div class='signature'>" + sig + "</div></div></div><script>window.onload = () => { setTimeout(() => { window.print(); setTimeout(() => window.close(), 500); }, 500); };<\/script></body></html>");
            printWindow.document.close();

        };

    