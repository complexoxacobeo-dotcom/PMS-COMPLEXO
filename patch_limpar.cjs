const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const btnSearch = `                <button onclick="toggleMainMultiSelect()" id="btnMainMultiSelect" class="bg-white/60 hover:bg-white/80 text-slate-900 shadow-md border-white/60 backdrop-blur-md px-3 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm border border-slate-200/50 flex items-center justify-center gap-2">
                    <span>🔀</span> <span>Selección Múltiple</span>
                </button>`;
const btnReplace = btnSearch + `
                <button onclick="openLimparPlaningModal()" class="bg-red-100 hover:bg-red-200 text-red-800 shadow-md border-red-200 backdrop-blur-md px-3 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm border flex items-center justify-center gap-2">
                    <span>🗑️</span> <span>Limpar Rexistros</span>
                </button>`;

const modalSearch = `    <div id="empSelectModal" class="modal z-[60]">`;
const modalReplace = `    <div id="limparPlaningModal" class="modal z-[60]">
        <div class="glass-panel w-full max-w-sm rounded-3xl p-6 relative modal-content glass-panel backdrop-blur-md border border-white/50 shadow-sm text-center shadow-2xl">
            <button onclick="closeModal('limparPlaningModal')" class="absolute top-3 right-3 text-red-600 hover:text-white hover:bg-red-600 text-2xl font-black bg-red-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors shadow-md z-50">&times;</button>
            <div class="text-5xl mb-4 bg-red-50 w-20 h-20 mx-auto rounded-full flex items-center justify-center border-4 border-white shadow-lg">🗑️</div>
            <h3 class="text-2xl font-black text-slate-800 mb-2">Limpar Planing</h3>
            <p class="text-slate-800 font-medium mb-4 text-sm">Borrar todos os rexistros entre dúas datas. <br><b class="text-red-600">Atención: Esta acción é irreversible.</b></p>
            <div class="flex flex-col gap-3 mb-6 text-left">
                <div>
                    <label class="block text-sm font-bold text-slate-900 mb-1">Data Inicio</label>
                    <input type="date" id="limparDataInicio" class="w-full p-2 border border-slate-300 rounded-xl bg-slate-50 outline-none font-bold">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-900 mb-1">Data Fin</label>
                    <input type="date" id="limparDataFin" class="w-full p-2 border border-slate-300 rounded-xl bg-slate-50 outline-none font-bold">
                </div>
            </div>
            <div class="flex gap-3 justify-center">
                <button onclick="closeModal('limparPlaningModal')" class="flex-1 py-3 bg-slate-100 text-slate-800 rounded-xl font-bold hover:bg-slate-200 transition">Cancelar</button>
                <button onclick="executeLimparPlaning()" class="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg" id="btnExecuteLimpar">Confirmar</button>
            </div>
        </div>
    </div>
` + modalSearch;

const jsSearch = `        function toggleMainMultiSelect() {`;
const jsReplace = `        function openLimparPlaningModal() {
            document.getElementById('limparDataInicio').value = currentPlaningDate || '';
            document.getElementById('limparDataFin').value = currentPlaningDate || '';
            document.getElementById('limparPlaningModal').classList.add('active');
        }

        async function executeLimparPlaning() {
            const startDateStr = document.getElementById('limparDataInicio').value;
            const endDateStr = document.getElementById('limparDataFin').value;
            
            if (!startDateStr || !endDateStr) {
                cAlert("Por favor, selecciona as dúas datas.");
                return;
            }
            
            const startD = new Date(startDateStr);
            const endD = new Date(endDateStr);
            
            if (endD < startD) {
                cAlert("A data de fin debe ser posterior ou igual á data de inicio.");
                return;
            }
            
            const btn = document.getElementById('btnExecuteLimpar');
            btn.innerHTML = 'Borrando...';
            btn.disabled = true;
            
            let currentDate = new Date(startD);
            let processedDates = 0;
            
            while (currentDate <= endD) {
                let dStr = currentDate.toISOString().split('T')[0];
                
                // Obter a lista base de cuartos limpos
                let cleanDay = appState.baseRooms.map(r => createEmptyRoomObject(r.id));
                // Para os albergues, crear camas
                let finalCleanDay = [];
                cleanDay.forEach(cr => {
                    const br = appState.baseRooms.find(b => b.id === cr.baseId);
                    if (br && br.type === 'hostel') {
                        for (let i = 1; i <= (br.totalBeds || 16); i++) {
                            let literaNum = Math.ceil(i / 2);
                            let isTop = (i % 2 === 0);
                            let bedCode = \`\${literaNum}\${isTop ? 'A' : 'B'}\`;
                            let newBed = createEmptyRoomObject(br.id);
                            newBed.id = \`\${br.id}_\${bedCode}\`;
                            newBed.bedId = bedCode;
                            finalCleanDay.push(newBed);
                        }
                    } else {
                        finalCleanDay.push(cr);
                    }
                });
                
                appState.dailyData[dStr] = finalCleanDay;
                
                // Gardar no servidor
                if (typeof google !== 'undefined' && google.script) {
                    await new Promise((resolve) => {
                        google.script.run
                            .withSuccessHandler(resolve)
                            .withFailureHandler(resolve)
                            .saveDayData(dStr, JSON.stringify(finalCleanDay));
                    });
                } else if (dStr === currentPlaningDate) {
                    salvarDiaNoServidor(true);
                }
                
                currentDate.setDate(currentDate.getDate() + 1);
                processedDates++;
            }
            
            if (currentPlaningDate >= startDateStr && currentPlaningDate <= endDateStr) {
                renderGrid();
                filterGrid();
            }
            
            closeModal('limparPlaningModal');
            btn.innerHTML = 'Confirmar';
            btn.disabled = false;
            
            cAlert(\`Rexistros limpos correctamente en \${processedDates} días.\`);
        }

` + jsSearch;

if (html.includes('btnMainMultiSelect') && html.includes('empSelectModal')) {
    html = html.replace(btnSearch, btnReplace);
    html = html.replace(modalSearch, modalReplace);
    html = html.replace(jsSearch, jsReplace);
    fs.writeFileSync('index.html', html);
    console.log("Patched Limpar Planing functionality");
} else {
    console.log("Failed to find injection points");
}
