const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const modalHTML = `
    <!-- Modal Dividir Pago -->
    <div id="splitPaymentModal" class="modal z-[110]">
        <div class="glass-panel w-full max-w-sm rounded-2xl p-6 m-4 relative flex flex-col gap-4">
            <button onclick="closeModal('splitPaymentModal')" class="absolute top-4 right-4 text-slate-400 hover:text-red-500 text-3xl font-black rounded-full w-8 h-8 flex items-center justify-center transition-colors">&times;</button>
            <h2 class="text-lg font-black text-slate-800">➗ Dividir Pago</h2>
            
            <div>
                <label class="block text-xs font-bold text-slate-900 mb-1">Cantidade Total a Dividir (€)</label>
                <input type="number" id="splitTotal" class="w-full p-3 border rounded-xl font-black text-lg bg-slate-50" readonly>
            </div>
            
            <div>
                <label class="block text-xs font-bold text-slate-900 mb-1">Entre cantas persoas?</label>
                <div class="flex gap-2">
                    <button onclick="changeSplitCount(-1)" class="w-10 h-10 rounded-lg bg-slate-200 font-bold hover:bg-slate-300">-</button>
                    <input type="number" id="splitPeople" class="flex-1 p-2 border rounded-lg text-center font-bold text-lg" value="2" min="2" oninput="calcSplit()">
                    <button onclick="changeSplitCount(1)" class="w-10 h-10 rounded-lg bg-slate-200 font-bold hover:bg-slate-300">+</button>
                </div>
            </div>
            
            <div class="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-center">
                <span class="block text-xs font-bold text-slate-500 mb-1">Cada persoa paga:</span>
                <span id="splitResult" class="text-3xl font-black text-blue-700">0.00€</span>
            </div>
            
            <p class="text-xs text-slate-500 italic">Consello: Para cobrar, anota manualmente canto paga cada un nos cadriños de 💵 Efectivo e 💳 Tarxeta da reserva, ou usa os botóns de cores para sumar o resto.</p>
        </div>
    </div>
`;

code = code.replace('<!-- Modal Administrador -->', modalHTML + '\n    <!-- Modal Administrador -->');

const jsCode = `
        function openSplitPayment() {
            const pending = calcPending();
            document.getElementById('splitTotal').value = pending.toFixed(2);
            document.getElementById('splitPeople').value = 2;
            calcSplit();
            document.getElementById('splitPaymentModal').classList.add('active');
        }
        function changeSplitCount(delta) {
            let el = document.getElementById('splitPeople');
            let v = parseInt(el.value) || 2;
            if (v + delta >= 2) {
                el.value = v + delta;
                calcSplit();
            }
        }
        function calcSplit() {
            let total = parseFloat(document.getElementById('splitTotal').value) || 0;
            let people = parseInt(document.getElementById('splitPeople').value) || 2;
            let res = total / people;
            document.getElementById('splitResult').innerText = res.toFixed(2) + '€';
        }
`;

code = code.replace('function calcPending() {', jsCode + '\n        function calcPending() {');

// Add the button to the UI
const replaceBtn = '<div class="flex gap-1">';
const newBtn = '<div class="flex gap-1">\n                                <button type="button" onclick="openSplitPayment()" class="text-[10px] px-2 py-1 bg-slate-200 text-slate-800 rounded font-bold mr-2">➗ Dividir</button>';
code = code.replace(replaceBtn, newBtn);

fs.writeFileSync('index.html', code);
console.log("Split patched!");
