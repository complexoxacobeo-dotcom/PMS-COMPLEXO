const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const logic = `
    <script>
        // Lóxica de Correos Pendentes (Illada e Read-Only)
        let currentPendingEmails = [];
        let currentlyEditingEmail = null;

        function openPendingEmailsModal() {
            document.getElementById('pendingEmailsModal').classList.add('active');
            if (currentPendingEmails.length === 0) {
                loadPendingEmails();
            } else {
                renderPendingEmails();
            }
        }

        async function loadPendingEmails(force = false) {
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
            const badge = document.getElementById('badgePendingEmails');
            if (badge) {
                if (currentPendingEmails.length > 0) {
                    badge.textContent = currentPendingEmails.length;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            }
        }

        function renderPendingEmails() {
            const list = document.getElementById('pendingEmailsList');
            if (currentPendingEmails.length === 0) {
                list.innerHTML = '<div class="text-center p-12 text-slate-500 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-300">Non hai ningunha solicitude de reserva pendente de resposta nos últimos 14 días. 🎉</div>';
                return;
            }
            
            list.innerHTML = currentPendingEmails.map(email => {
                let est = "Descoñecido";
                const lowerBody = (email.body || "").toLowerCase() + " " + (email.subject || "").toLowerCase();
                if (lowerBody.includes("triacastela") || lowerBody.includes("boutique") || lowerBody.includes("hotel")) {
                    est = "Hotel Triacastela";
                } else if (lowerBody.includes("xacobeo")) {
                    est = "Complexo Xacobeo";
                }
                
                // Formatear fecha
                let d = new Date(email.date);
                let dStr = isNaN(d.getTime()) ? email.date : d.toLocaleString('gl-ES', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit'});
                
                return \`
                    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider border border-amber-200">Pendente</span>
                                <span class="text-xs text-slate-500 font-medium">\${dStr}</span>
                            </div>
                            <h3 class="font-bold text-slate-800 text-sm truncate" title="\${email.subject}">\${email.subject || '(Sen asunto)'}</h3>
                            <div class="text-xs text-slate-600 mt-1 truncate">De: \${email.sender}</div>
                            <div class="text-xs text-indigo-600 mt-1 font-medium bg-indigo-50 inline-block px-2 py-0.5 rounded border border-indigo-100">
                                Establecemento detectado: \${est}
                            </div>
                        </div>
                        <button onclick="prepareReply('\${email.id}')" class="shrink-0 bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm w-full sm:w-auto">
                            Revisar e preparar resposta
                        </button>
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
        
        // Auto-load once on startup (delayed slightly to not slow down main load)
        setTimeout(() => {
            if (isLoggedIn && typeof google !== 'undefined' && google.script) {
                loadPendingEmails();
            }
        }, 3000);
    </script>
`;

code = code.replace(/<\/body>/, logic + '\n</body>');
fs.writeFileSync('index.html', code);
console.log("Patched JS");
