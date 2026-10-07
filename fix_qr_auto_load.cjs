const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const targetStr = `.getInitialData(hoxe);
                }`;

const replacement = `.getInitialData(hoxe);
                    
                    // Se estabamos xa logueados e temos un QR, procesalo
                    if (window.pendingQrToProcess) {
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
                    }
                }`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('index.html', code);
