const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const targetStr = `if (window.pendingQrToProcess) {
                        setTimeout(() => {
                            try {
                                const decodedStr = decodeURIComponent(atob(window.pendingQrToProcess));
                                if (decodedStr.startsWith('XAC|')) {
                                    document.getElementById('qrScannerModal').classList.add('active');
                                    document.getElementById('qrCanvas').parentElement.classList.add('hidden');
                                    document.getElementById('qrStatusBox').innerText = "Procesando código...";
                                    processScannedQr(decodedStr);
                                    window.pendingQrToProcess = null;
                                }
                            } catch(e) {}
                        }, 800);
                    }`;

const replacement = `if (window.pendingQrToProcess) {
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
                    }`;

// Notice: this snippet occurs in TWO places in the code (one inside doLogin, one inside the else fallback).
code = code.replace(targetStr, replacement);
code = code.replace(targetStr, replacement);

fs.writeFileSync('index.html', code);
