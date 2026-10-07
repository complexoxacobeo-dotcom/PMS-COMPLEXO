const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const logicCode = `
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
            if (appState.dailyData && appState.dailyData[date]) {
                const rm = appState.dailyData[date].find(r => r.id === roomId);
                if (rm) {
                    rName = rm.bedId ? rm.number+'-'+rm.bedId : rm.number;
                    cName = rm.clientName || cName;
                }
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
                    document.getElementById('qrStatusBox').innerHTML = \`❌ XA CONSUMIDO<br><span class="text-sm font-bold text-red-600">Ás \${time} por \${c.validatedBy}</span>\`;
                    document.getElementById('qrBtnValidate').classList.add('hidden');
                    document.getElementById('qrBtnNext').classList.remove('hidden');
                } else {
                    document.getElementById('qrStatusBox').className = "mb-4 p-4 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-800 font-bold text-center";
                    document.getElementById('qrStatusBox').innerText = "🟢 PENDENTE DE CONSUMIR";
                    document.getElementById('qrBtnValidate').disabled = false;
                    document.getElementById('qrBtnValidate').classList.remove('opacity-50');
                }
            } else {
                document.getElementById('qrStatusBox').innerText = "⚠️ Modo Sen Conexión: PENDENTE";
                document.getElementById('qrBtnValidate').disabled = false;
                document.getElementById('qrBtnValidate').classList.remove('opacity-50');
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
                    document.getElementById('qrStatusBox').innerHTML = \`✅ CONSUMO REXISTRADO<br><span class="text-sm">Todo correcto</span>\`;
                    document.getElementById('qrBtnValidate').classList.add('hidden');
                    document.getElementById('qrBtnNext').classList.remove('hidden');
                    
                    if (appState.pushConfig && appState.pushConfig.telegram) {
                         sendTelegramMsg(\`🍽️ <b>Consumo QR Validado</b>\\n🛏️ Hab: \${roomId}\\n🎟️ \${tipo} (x\${qty})\\n👤 Por: \${user}\`);
                    }
                } else {
                    document.getElementById('qrStatusBox').className = "mb-4 p-4 rounded-xl border bg-red-100 border-red-300 text-red-800 font-black text-center text-lg shadow-sm";
                    document.getElementById('qrStatusBox').innerText = "❌ ERRO: " + res.error;
                    document.getElementById('qrBtnValidate').innerText = "✅ VALIDAR CONSUMICIÓN";
                    document.getElementById('qrBtnValidate').disabled = false;
                }
            } else {
                document.getElementById('qrStatusBox').className = "mb-4 p-4 rounded-xl border bg-emerald-100 border-emerald-300 text-emerald-800 font-black text-center text-lg shadow-sm";
                document.getElementById('qrStatusBox').innerHTML = \`✅ OK (Local Mode)\`;
                document.getElementById('qrBtnValidate').classList.add('hidden');
                document.getElementById('qrBtnNext').classList.remove('hidden');
            }
        };
`;

code = code.replace(/<\/script>\s*<\/body>/, logicCode + "\n    </script>\n</body>");
fs.writeFileSync('index.html', code);
console.log("QR JS Logic added");
