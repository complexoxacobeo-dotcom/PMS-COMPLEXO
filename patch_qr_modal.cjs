const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const modalHtml = `
    <!-- Modal Scanner QR -->
    <div id="qrScannerModal" class="modal-overlay z-50">
        <div class="modal-content w-full max-w-lg">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">📷 Escáner Restaurante</h2>
                <button onclick="stopQrScanner()" class="text-slate-400 hover:text-slate-600">✖</button>
            </div>
            
            <div id="qrStatusBox" class="mb-4 p-4 rounded-xl border bg-indigo-50 border-indigo-200 text-indigo-800 font-bold text-center">
                Apunta o QR do tícket cara a cámara...
            </div>
            
            <div class="relative w-full overflow-hidden rounded-xl bg-black flex justify-center items-center" style="min-height: 300px;">
                <canvas id="qrCanvas" class="w-full h-auto max-h-[60vh] object-contain"></canvas>
                <div id="qrOverlay" class="absolute inset-0 border-4 border-indigo-500/50 pointer-events-none hidden"></div>
            </div>
            
            <div id="qrResultPanel" class="hidden mt-4 bg-white border-2 border-slate-200 rounded-xl p-4 text-center">
                <h3 id="qrResTitle" class="text-xl font-black text-slate-900 uppercase">Habitación...</h3>
                <p id="qrResSubtitle" class="text-sm font-bold text-slate-600 mb-4">Hóspede: ...</p>
                
                <div class="flex justify-center items-center gap-4 mb-4">
                    <span id="qrResIcon" class="text-4xl">🍽️</span>
                    <div class="text-left">
                        <div id="qrResType" class="font-bold text-slate-800 text-lg uppercase">Servizo</div>
                        <div id="qrResQty" class="text-sm font-bold text-slate-500">X Pax</div>
                    </div>
                </div>
                
                <button id="qrBtnValidate" onclick="confirmQrValidation()" class="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition">✅ VALIDAR CONSUMICIÓN</button>
                <button onclick="resumeQrScanner()" class="w-full mt-2 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition hidden" id="qrBtnNext">📷 Escanear Seguinte</button>
            </div>
            
        </div>
    </div>
`;

code = code.replace(/<!-- MODALES -->/, "<!-- MODALES -->\n" + modalHtml);

fs.writeFileSync('index.html', code);
console.log("Modal HTML added");
