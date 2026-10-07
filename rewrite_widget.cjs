const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// 1. Remove the old button (if it exists)
const mailBtnRegex = /<button onclick="openPendingEmailsModal\(\)".*?<\/button>/s;
code = code.replace(mailBtnRegex, '');

// 2. Locate the start of the Modal Correos Pendentes
const startMarker = "    <!-- Modal Correos Pendentes -->";
const startIndex = code.indexOf(startMarker);

// 3. Locate the end of the script for it
const endMarker = "        }, 3000);\n    </script>";
let endIndex = code.indexOf(endMarker, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    endIndex += endMarker.length;
    
    const newWidgetHTML = `
    <!-- Widget Flotante de Correos Pendentes (Top-Left) -->
    <div id="pendingEmailsWidget" class="fixed top-24 left-4 w-[350px] max-h-[70vh] bg-white/95 backdrop-blur-xl shadow-2xl border border-blue-200 rounded-2xl z-40 flex flex-col overflow-hidden transition-all duration-300" style="display: none;">
        <div class="bg-blue-600 hover:bg-blue-700 text-white p-3 flex justify-between items-center cursor-pointer transition-colors" onclick="toggleEmailsWidgetBody()">
            <h3 class="font-bold text-sm flex items-center gap-2">
                <span>✉️</span> Reservas Pendentes (<span id="widgetPendingCount">0</span>)
            </h3>
            <div class="flex gap-2">
                <button onclick="event.stopPropagation(); loadPendingEmails(true)" class="text-white hover:text-blue-200" title="Actualizar">🔄</button>
                <button id="widgetCollapseBtn" class="text-white hover:text-blue-200 font-bold ml-1">▼</button>
            </div>
        </div>
        
        <div id="widgetEmailsBody" class="flex flex-col flex-1 overflow-hidden">
            <div id="pendingEmailsLoader" class="hidden flex-col items-center justify-center p-6 bg-slate-50">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                <p class="text-slate-500 text-xs font-medium animate-pulse text-center">Buscando correos recentes...</p>
            </div>
            
            <div id="pendingEmailsError" class="hidden bg-red-50 text-red-700 text-xs p-3 border-b border-red-200"></div>
            
            <div id="pendingEmailsList" class="overflow-y-auto flex-1 p-2 bg-slate-50/50 flex flex-col gap-2">
                <!-- Correos renderizados aqui -->
            </div>
        </div>
    </div>

    <!-- Modal para Editor de Resposta -->
    <div id="replyEditorContainer" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative border border-slate-200">
            <div class="p-4 border-b bg-slate-50 flex justify-between items-center">
                <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">✨ Preparar resposta con IA</h3>
                <button onclick="closeReplyEditor()" class="text-slate-400 hover:text-red-500 text-3xl font-black rounded-full w-8 h-8 flex items-center justify-center transition-colors">&times;</button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1 overflow-hidden">
                <div class="flex flex-col border-r border-slate-200 bg-white">
                    <div class="p-4 border-b bg-slate-50/50">
                        <p class="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">Correo orixinal</p>
                        <div class="text-sm font-medium text-slate-800 truncate" id="replyOriginalSender"></div>
                    </div>
                    <div class="p-4 overflow-y-auto flex-1">
                        <div class="text-sm text-slate-700 font-bold mb-3 pb-2 border-b" id="replyOriginalSubject"></div>
                        <div class="text-sm text-slate-600 whitespace-pre-wrap font-serif" id="replyOriginalBody"></div>
                    </div>
                </div>
                
                <div class="flex flex-col bg-slate-50 relative">
                    <div id="replyGeneratingLoader" class="hidden absolute inset-0 bg-white/80 backdrop-blur-sm flex-col items-center justify-center z-10">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                        <p class="text-slate-600 font-bold animate-pulse">Redactando resposta...</p>
                    </div>
                    
                    <div id="replyContentArea" class="flex flex-col h-full p-4">
                        <label class="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Suxerencia de resposta</label>
                        <textarea id="replyTextarea" class="w-full flex-1 border border-slate-300 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all shadow-inner resize-none"></textarea>
                        
                        <div class="flex gap-2 justify-end mt-4">
                            <button onclick="closeReplyEditor()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-bold transition-colors">Descartar</button>
                            <button onclick="copyReplyText()" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors flex items-center gap-2">
                                <span>📋</span> <span>Copiar resposta</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Lóxica de Correos Pendentes (Widget)
        let currentPendingEmails = [];
        let currentlyEditingEmail = null;
        let emailsWidgetOpen = true;

        function toggleEmailsWidgetBody() {
            emailsWidgetOpen = !emailsWidgetOpen;
            const body = document.getElementById('widgetEmailsBody');
            const btn = document.getElementById('widgetCollapseBtn');
            if (emailsWidgetOpen) {
                body.style.display = 'flex';
                btn.textContent = '▼';
            } else {
                body.style.display = 'none';
                btn.textContent = '▲';
            }
        }

        async function loadPendingEmails(force = false) {
            const widget = document.getElementById('pendingEmailsWidget');
            widget.style.display = 'flex'; // Ensure widget is visible
            
            const loader = document.getElementById('pendingEmailsLoader');
            const list = document.getElementById('pendingEmailsList');
            const errBox = document.getElementById('pendingEmailsError');
            
            loader.classList.remove('hidden');
            loader.classList.add('flex');
            list.innerHTML = '';
            errBox.classList.add('hidden');
            
            try {
                if (typeof google === 'undefined' || !google.script) {
                    throw new Error("Contorno non compatible con Gmail (google.script non atopado)");
                }
                
                const emails = await new Promise((resolve, reject) => {
                    google.script.run
                        .withSuccessHandler(resolve)
                        .withFailureHandler(reject)
                        .fetchPendingReservationEmails();
                });
                
                currentPendingEmails = emails || [];
                updatePendingEmailsBadge();
                renderPendingEmails();
                
            } catch (err) {
                console.error(err);
                errBox.textContent = "Erro obtendo os correos: " + (err.message || err);
                errBox.classList.remove('hidden');
            } finally {
                loader.classList.add('hidden');
                loader.classList.remove('flex');
            }
        }

        function updatePendingEmailsBadge() {
            const badge = document.getElementById('widgetPendingCount');
            if (badge) {
                badge.textContent = currentPendingEmails.length;
            }
        }

        function renderPendingEmails() {
            const list = document.getElementById('pendingEmailsList');
            if (currentPendingEmails.length === 0) {
                list.innerHTML = '<div class="text-center p-6 text-slate-500 text-xs font-medium bg-slate-100/50 rounded-xl border border-dashed border-slate-300">Non hai ningunha solicitude pendente. 🎉</div>';
                return;
            }
            
            list.innerHTML = currentPendingEmails.map(email => {
                let est = "Descoñecido";
                const lowerBody = (email.body || "").toLowerCase() + " " + (email.subject || "").toLowerCase();
                if (lowerBody.includes("triacastela") || lowerBody.includes("boutique") || lowerBody.includes("hotel")) {
                    est = "Triacastela";
                } else if (lowerBody.includes("xacobeo")) {
                    est = "Xacobeo";
                }
                
                let d = new Date(email.date);
                let dStr = isNaN(d.getTime()) ? email.date : d.toLocaleString('gl-ES', {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'});
                
                return \`
                    <div class="bg-white rounded-lg border border-slate-200 shadow-sm p-3 hover:shadow-md transition-shadow flex flex-col gap-2 cursor-pointer" onclick="prepareReply('\${email.id}')">
                        <div class="flex justify-between items-start">
                            <h3 class="font-bold text-slate-800 text-xs truncate flex-1" title="\${email.subject}">\${email.subject || '(Sen asunto)'}</h3>
                            <span class="text-[10px] text-slate-400 whitespace-nowrap ml-2">\${dStr}</span>
                        </div>
                        <div class="text-[11px] text-slate-600 truncate">De: \${email.sender}</div>
                        <div class="flex justify-between items-center mt-1">
                            <span class="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                \${est}
                            </span>
                            <span class="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100">Responder ✨</span>
                        </div>
                    </div>
                \`;
            }).join('');
        }

        async function prepareReply(msgId) {
            const email = currentPendingEmails.find(e => e.id === msgId);
            if (!email) return;
            currentlyEditingEmail = email;
            
            const container = document.getElementById('replyEditorContainer');
            container.classList.remove('hidden');
            container.classList.add('flex');
            
            document.getElementById('replyOriginalSender').textContent = email.sender;
            document.getElementById('replyOriginalSubject').textContent = email.subject;
            document.getElementById('replyOriginalBody').textContent = email.body;
            
            document.getElementById('replyTextarea').value = '';
            document.getElementById('replyContentArea').classList.add('hidden');
            document.getElementById('replyContentArea').classList.remove('flex');
            
            const loader = document.getElementById('replyGeneratingLoader');
            loader.classList.remove('hidden');
            loader.classList.add('flex');
            
            try {
                const res = await fetch('/api/generate-reply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ emailData: email })
                });
                const data = await res.json();
                
                if (!res.ok) throw new Error(data.error || "Erro de servidor");
                
                document.getElementById('replyTextarea').value = data.reply;
                
            } catch (err) {
                console.error(err);
                document.getElementById('replyTextarea').value = "Erro xerando a resposta: " + err.message;
            } finally {
                loader.classList.add('hidden');
                loader.classList.remove('flex');
                document.getElementById('replyContentArea').classList.remove('hidden');
                document.getElementById('replyContentArea').classList.add('flex');
            }
        }

        function closeReplyEditor() {
            document.getElementById('replyEditorContainer').classList.add('hidden');
            document.getElementById('replyEditorContainer').classList.remove('flex');
            currentlyEditingEmail = null;
        }

        function copyReplyText() {
            const ta = document.getElementById('replyTextarea');
            ta.select();
            document.execCommand('copy');
            const btn = event.currentTarget;
            const original = btn.innerHTML;
            btn.innerHTML = '<span>✅</span> <span>Copiado!</span>';
            btn.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
            btn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            setTimeout(() => {
                btn.innerHTML = original;
                btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
                btn.classList.add('bg-blue-600', 'hover:bg-blue-700');
            }, 2000);
        }
        
        // Auto-load once on startup
        setTimeout(() => {
            if (isLoggedIn && typeof google !== 'undefined' && google.script) {
                loadPendingEmails();
            }
        }, 2500);
    </script>
`;

    code = code.substring(0, startIndex) + newWidgetHTML + code.substring(endIndex);
    fs.writeFileSync('index.html', code);
    console.log("Successfully replaced pending emails widget!");
} else {
    console.log("Error finding start or end markers for replacement.");
}
