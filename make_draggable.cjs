const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// 1. Remove the inline widget from the header
const inlineWidgetRegex = /<!-- Integrated Pending Emails -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const match = code.match(inlineWidgetRegex);
if(match) {
    code = code.replace(match[0], '');
}

// 2. Add the floating, draggable widget right before </body>
const widgetHTML = `
    <!-- Floating Draggable Widget for Pending Emails -->
    <div id="draggableEmailsWidget" class="fixed bottom-6 right-6 w-[450px] bg-white/95 backdrop-blur-xl shadow-2xl border border-blue-200 rounded-2xl z-[999] flex flex-col overflow-hidden transition-all" style="max-height: 85vh;">
        <!-- Header (Drag Handle) -->
        <div id="draggableEmailsHeader" class="bg-blue-600 hover:bg-blue-700 text-white p-3 flex justify-between items-center cursor-move select-none transition-colors">
            <h3 class="font-bold text-sm flex items-center gap-2 pointer-events-none">
                <span>✉️</span> Reservas Pendentes (<span id="widgetPendingCount">0</span>)
            </h3>
            <div class="flex gap-2 items-center">
                <button onclick="loadPendingEmails(true)" class="text-white hover:text-blue-200 cursor-pointer" title="Actualizar">🔄</button>
                <button id="widgetMinMaxBtn" onclick="toggleEmailsMinMax()" class="text-white hover:text-blue-200 font-bold ml-1 cursor-pointer transition-transform duration-200">▼</button>
            </div>
        </div>
        
        <!-- Body -->
        <div id="widgetEmailsBody" class="flex flex-col flex-1 overflow-hidden transition-all duration-300 min-h-[200px]">
            <div id="pendingEmailsLoader" class="hidden flex-col items-center justify-center p-6 bg-slate-50 flex-1">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                <p class="text-slate-500 text-xs font-medium animate-pulse text-center">Buscando correos recentes...</p>
            </div>
            
            <div id="pendingEmailsError" class="hidden bg-red-50 text-red-700 text-xs p-3 border-b border-red-200"></div>
            
            <div id="pendingEmailsList" class="overflow-y-auto flex-1 p-2 bg-slate-50/50 flex flex-col gap-2">
                <!-- Correos renderizados aqui -->
            </div>
        </div>
    </div>
`;

code = code.replace('</body>', widgetHTML + '\n</body>');

// 3. Add JS for dragging and minimizing
const scriptHTML = `
    <script>
        // Minimize/Maximize
        let emailsWidgetMinimized = false;
        function toggleEmailsMinMax() {
            emailsWidgetMinimized = !emailsWidgetMinimized;
            const body = document.getElementById('widgetEmailsBody');
            const btn = document.getElementById('widgetMinMaxBtn');
            if (emailsWidgetMinimized) {
                body.style.display = 'none';
                btn.style.transform = 'rotate(-90deg)';
            } else {
                body.style.display = 'flex';
                btn.style.transform = 'rotate(0deg)';
                if (currentPendingEmails.length === 0 && !document.getElementById('pendingEmailsLoader').classList.contains('flex')) {
                    loadPendingEmails();
                }
            }
        }

        // Draggable Logic
        const dragWidget = document.getElementById('draggableEmailsWidget');
        const dragHeader = document.getElementById('draggableEmailsHeader');
        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        dragHeader.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return; // Don't drag if clicking buttons
            isDragging = true;
            dragOffsetX = e.clientX - dragWidget.getBoundingClientRect().left;
            dragOffsetY = e.clientY - dragWidget.getBoundingClientRect().top;
            dragWidget.style.transition = 'none'; // Disable transition while dragging
            // Temporarily set to absolute for dragging relative to viewport
            dragWidget.style.position = 'fixed';
            dragWidget.style.bottom = 'auto';
            dragWidget.style.right = 'auto';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let newX = e.clientX - dragOffsetX;
            let newY = e.clientY - dragOffsetY;
            
            // Keep within bounds
            newX = Math.max(0, Math.min(newX, window.innerWidth - dragWidget.offsetWidth));
            newY = Math.max(0, Math.min(newY, window.innerHeight - dragWidget.offsetHeight));
            
            dragWidget.style.left = newX + 'px';
            dragWidget.style.top = newY + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                dragWidget.style.transition = 'all 0.3s';
            }
        });
    </script>
`;
code = code.replace('</body>', scriptHTML + '\n</body>');

// 4. Update the render logic to match the new container classes (we can keep it nice and clean)
const renderRegex = /function renderPendingEmails\(\) \{[\s\S]*?\}\s*async function prepareReply/s;
const newRender = `function renderPendingEmails() {
            const list = document.getElementById('pendingEmailsList');
            if (currentPendingEmails.length === 0) {
                list.innerHTML = '<div class="text-center p-6 text-slate-500 text-xs font-medium bg-slate-100/50 rounded-xl border border-dashed border-slate-300 mt-4 mx-2">Non hai ningunha reserva sen responder. 🎉</div>';
                return;
            }
            
            list.innerHTML = currentPendingEmails.map(email => {
                let est = "Xeral";
                const lowerBody = (email.body || "").toLowerCase() + " " + (email.subject || "").toLowerCase();
                if (lowerBody.includes("triacastela") || lowerBody.includes("boutique") || lowerBody.includes("hotel")) est = "Triacastela";
                else if (lowerBody.includes("xacobeo")) est = "Xacobeo";
                
                let d = new Date(email.date);
                let dStr = isNaN(d.getTime()) ? email.date : d.toLocaleString('gl-ES', {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'});
                
                return \`
                    <div class="bg-white rounded-lg border border-slate-200 shadow-sm p-3 hover:shadow-md transition-shadow flex flex-col gap-2 cursor-pointer" onclick="prepareReply('\${email.id}')">
                        <div class="flex justify-between items-start">
                            <h3 class="font-bold text-slate-800 text-xs truncate flex-1" title="\${email.subject}">\${email.subject || '(Sen asunto)'}</h3>
                            <span class="text-[10px] text-slate-400 whitespace-nowrap ml-2">\${dStr}</span>
                        </div>
                        <div class="text-[11px] text-slate-600 truncate">De: \${email.sender}</div>
                        <div class="flex justify-between items-center mt-1">
                            <span class="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase">\${est}</span>
                            <span class="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 uppercase">Responder ✨</span>
                        </div>
                    </div>
                \`;
            }).join('');
        }
        
        async function prepareReply`;

code = code.replace(renderRegex, newRender);

fs.writeFileSync('index.html', code);
console.log("Patched HTML/JS for Draggable Widget!");
