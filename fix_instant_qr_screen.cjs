const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const domLoadRegex = /window\.addEventListener\('DOMContentLoaded', \(\) => \{\s*const urlParams = new URLSearchParams\(window\.location\.search\);\s*const qrParam = urlParams\.get\('qr'\);\s*if \(qrParam\) \{\s*\/\/\s*Save it for after login\s*window\.pendingQrToProcess = qrParam;\s*\}\s*\}\);/;

const replacement = `window.addEventListener('DOMContentLoaded', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const qrParam = urlParams.get('qr');
            if (qrParam) {
                // Save it for after login
                window.pendingQrToProcess = qrParam;
                // Instantly pop the modal so we never see the planning page
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
                    statusEl.innerText = "Cargando datos...";
                }
            }
        });`;

code = code.replace(domLoadRegex, replacement);
fs.writeFileSync('index.html', code);
