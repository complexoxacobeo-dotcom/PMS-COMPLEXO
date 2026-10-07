const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// We will inject a completely separate QR flow.
// When ?qr= is present, we hide the rest of the body.
// In the DOMContentLoaded:
const targetDOM = `window.addEventListener('DOMContentLoaded', () => {
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

const replacementDOM = `window.addEventListener('DOMContentLoaded', () => {
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
                const statusEl = document.getElementById('qrStatusBox');
                if (statusEl) {
                    statusEl.innerHTML = \`<div class="flex flex-col gap-3 items-center w-full">
                        <p class="text-sm font-black text-slate-800">CÓDIGO DE ACCESO</p>
                        <input type="password" id="qrPass" placeholder="Contrasinal..." class="p-3 border rounded-xl font-bold w-full text-center text-xl shadow-inner outline-none">
                        <button onclick="checkQrPass('\${qrParam}')" class="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-3 rounded-xl shadow-lg transition transform hover:scale-105">Acceder</button>
                    </div>\`;
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
        };`;

code = code.replace(targetDOM, replacementDOM);
fs.writeFileSync('index.html', code);
