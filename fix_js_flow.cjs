const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const targetStr = `const modal = document.getElementById('qrScannerModal');
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
                }`;

const replacementStr = `const modal = document.getElementById('qrScannerModal');
                if (modal) {
                    modal.style.display = 'flex';
                    modal.classList.add('active');
                    modal.style.zIndex = '99999999'; // ensure on top
                }
                const canvasEl = document.getElementById('qrCanvas');
                if (canvasEl) {
                    canvasEl.parentElement.classList.add('hidden');
                }
                
                // Unhide the Result Panel but hide its top details so only the password prompt shows
                const resultPanel = document.getElementById('qrResultPanel');
                if (resultPanel) resultPanel.classList.remove('hidden');
                
                const topDetails = document.getElementById('qrResTopDetails');
                if (topDetails) topDetails.classList.add('hidden');
                
                // Show a mini password prompt just for QR validation
                const statusEl = document.getElementById('qrStatusBox');
                if (statusEl) {
                    statusEl.innerHTML = \`<div class="flex flex-col gap-3 items-center w-full">
                        <p class="text-sm font-black text-slate-800">CÓDIGO DE ACCESO</p>
                        <input type="password" id="qrPass" placeholder="Contrasinal..." class="p-3 border rounded-xl font-bold w-full text-center text-xl shadow-inner outline-none">
                        <button onclick="checkQrPass('\${qrParam}')" class="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-3 rounded-xl shadow-lg transition transform hover:scale-105">Acceder</button>
                    </div>\`;
                }`;

code = code.replace(targetStr, replacementStr);

const targetStr2 = `document.getElementById('qrResultPanel').classList.remove('hidden');`;
const replacementStr2 = `document.getElementById('qrResultPanel').classList.remove('hidden');
            if (document.getElementById('qrResTopDetails')) {
                document.getElementById('qrResTopDetails').classList.remove('hidden');
            }`;

code = code.replace(targetStr2, replacementStr2);

fs.writeFileSync('index.html', code);
