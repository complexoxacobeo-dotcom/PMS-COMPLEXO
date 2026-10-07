const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const startupCheckCode = `
        // Check if loaded with a ?qr= parameter via smartphone camera
        window.addEventListener('DOMContentLoaded', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const qrParam = urlParams.get('qr');
            if (qrParam) {
                setTimeout(() => {
                    try {
                        const decodedStr = decodeURIComponent(atob(qrParam));
                        if (decodedStr.startsWith('XAC|')) {
                            // Stop regular UI, show the scanner modal directly
                            document.getElementById('qrScannerModal').classList.add('active');
                            // Hide the canvas/camera part because we already scanned it
                            document.getElementById('qrCanvas').parentElement.classList.add('hidden');
                            document.getElementById('qrStatusBox').innerText = "Procesando código...";
                            
                            // Process the QR
                            processScannedQr(decodedStr);
                        }
                    } catch(e) {
                        console.error("Error decoding QR URL:", e);
                    }
                }, 1000); // Give the app a second to load state
            }
        });
`;

code = code.replace(/window\.processScannedQr = async function/, startupCheckCode + "\n        window.processScannedQr = async function");

fs.writeFileSync('index.html', code);
console.log("URL parameter handler added.");
