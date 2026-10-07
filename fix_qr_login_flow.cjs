const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Replace the DOMContentLoaded QR logic to only process after login
const oldDomLogic = /window\.addEventListener\('DOMContentLoaded', \(\) => \{\s+const urlParams = new URLSearchParams\(window\.location\.search\);\s+const qrParam = urlParams\.get\('qr'\);\s+if \(qrParam\) {[\s\S]*?\}\s+\}\);\s+window\.processScannedQr/m;

const newDomLogic = `
        window.addEventListener('DOMContentLoaded', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const qrParam = urlParams.get('qr');
            if (qrParam) {
                // Save it for after login
                window.pendingQrToProcess = qrParam;
            }
        });

        window.processScannedQr`;

code = code.replace(oldDomLogic, newDomLogic);

// Now find where login completes successfully and process the pending QR
// It's inside doLogin() success handler and checkLogin() if already logged in
const handleInitialDataCall = /\.getInitialData\(hoxe\);/;
const handleInitialDataReplacement = `.getInitialData(hoxe);
                        // Comprobar se temos un QR pendente despois do login
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
                            }, 500);
                        }`;
code = code.replace(handleInitialDataCall, handleInitialDataReplacement);

fs.writeFileSync('index.html', code);
console.log("QR login flow fixed.");
