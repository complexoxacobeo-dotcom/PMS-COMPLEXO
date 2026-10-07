const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// The modal HTML we want to move
const modalHtml = `<!-- Modal de Escáner e Validación QR (Full Screen) -->
    <div id="qrScannerModal" class="modal bg-slate-900" style="display: none; z-index: 9000;" style="display: none;">
        <div class="modal-content w-full h-full max-w-none rounded-none p-0 relative bg-slate-900 text-white flex flex-col">
            <div class="p-4 bg-indigo-900 flex justify-between items-center shadow-md">
                <h2 class="text-xl font-black text-white flex items-center gap-2">📷 Validación de Consumo</h2>
                <button onclick="stopQrScanner()" class="text-white hover:text-red-400 text-3xl font-black transition-colors">&times;</button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
                <div class="w-full max-w-md mx-auto">
                    <!-- Scanner Canvas Wrapper -->
                    <div class="bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700 relative aspect-[4/3] flex items-center justify-center mb-6">
                        <canvas id="qrCanvas" class="w-full h-full object-cover"></canvas>
                        <div class="absolute inset-0 pointer-events-none border-2 border-dashed border-indigo-500 m-8 rounded-xl opacity-50"></div>
                    </div>
                    
                    <!-- Result Panel -->
                    <div id="qrResultPanel" class="hidden bg-white text-slate-800 rounded-2xl shadow-xl overflow-hidden mb-6 animate-fade-in">
                        <div class="bg-indigo-600 text-white p-4 flex items-center gap-4">
                            <div id="qrResIcon" class="text-4xl bg-white/20 p-3 rounded-xl">🎟️</div>
                            <div>
                                <h3 id="qrResTitle" class="text-xl font-black uppercase tracking-wide">Habitación</h3>
                                <p id="qrResSubtitle" class="text-indigo-100 text-sm">Hóspede (Data)</p>
                            </div>
                        </div>
                        <div class="p-6 text-center">
                            <div class="text-3xl font-black text-slate-900 mb-1" id="qrResType">Almorzo</div>
                            <div class="text-lg font-bold text-slate-500 mb-6" id="qrResQty">2 Pax</div>
                            
                            <div id="qrStatusBox" class="mb-4 p-4 rounded-xl border bg-slate-50 border-slate-200 text-slate-800 font-bold text-center">
                                Agardando...
                            </div>
                            
                            <button id="qrBtnValidate" onclick="confirmQrValidation()" class="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-black rounded-xl shadow-lg transition-transform transform hover:scale-105 uppercase tracking-wider hidden">
                                ✅ VALIDAR CONSUMICIÓN
                            </button>
                            
                            <button id="qrBtnNext" onclick="resumeQrScanner()" class="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-md transition-colors hidden mt-3">
                                📷 Escanear outro tícket
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <style>
        #qrScannerModal.active {
            display: flex !important;
        }
    </style>`;

// 1. Remove it from where it's currently injected (somewhere near line 4520)
if (code.includes(modalHtml)) {
    code = code.replace(modalHtml + '\n</body>', '</body>');
    
    // 2. Put it at the very end of the file before the final </body>
    // We'll split the file by '</body>' and append to the LAST one.
    const parts = code.split('</body>');
    if (parts.length > 1) {
        const lastPart = parts.pop();
        code = parts.join('</body>') + '\n' + modalHtml + '\n</body>' + lastPart;
    }
    
    fs.writeFileSync('index.html', code);
    console.log("Fixed HTML injection.");
} else {
    console.log("Could not find the exact modal string to remove.");
}
