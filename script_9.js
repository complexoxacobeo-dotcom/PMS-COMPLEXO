
        // Lóxica de Correos Pendentes (Widget)
        let currentPendingEmails = [];
        let currentlyEditingEmail = null;
        // Clicar fora pecha o dropdown
        

        async function loadPendingEmails(force = false) {
            // Auto-popup removed to prevent popup-blocked errors.
            
            
            
            const loader = document.getElementById('pendingEmailsLoader');
            const list = document.getElementById('pendingEmailsList');
            const errBox = document.getElementById('pendingEmailsError');
            
            if (currentPendingEmails.length === 0) { loader.classList.remove('hidden'); loader.classList.add('flex'); list.innerHTML = ''; }
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
                let msg = err.message || err;
                errBox.innerHTML = "<strong>Atención:</strong> " + msg;
                if (msg.includes("Acceso a Gmail denegado") || msg.includes("Permisos de Gmail") || msg.includes("Contorno non compatible")) {
                    errBox.innerHTML += '<br><br><button onclick="window.doGoogleLogin().then(()=>loadPendingEmails(true)).catch(e=>{})" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow w-full flex justify-center items-center gap-1.5"><span>🔄</span> Reconectar con Google</button>';
                }
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
                if(currentPendingEmails.length > 0) {
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            }
        }

        function renderPendingEmails() {
            const list = document.getElementById('pendingEmailsList');
            if (currentPendingEmails.length === 0) {
                list.innerHTML = '<div class="text-center p-6 text-slate-500 text-xs font-medium bg-slate-100/50 rounded-xl border border-dashed border-slate-300 mt-4 mx-2">Non hai ningunha reserva sen responder. 🎉</div>';
                return;
            }
            
            
            const fabCount = document.getElementById('fabPendingCount');
            if (fabCount) fabCount.innerText = currentPendingEmails.length;
            
            list.innerHTML = currentPendingEmails.map(email => {
                let est = "Xeral";
                const lowerBody = (email.body || "").toLowerCase() + " " + (email.subject || "").toLowerCase();
                
                let isTriacastela = lowerBody.includes("triacastela") || lowerBody.includes("boutique") || lowerBody.includes("hotel");
                let isXacobeo = lowerBody.includes("xacobeo");
                
                if (isTriacastela) est = "🏨 Hotel Triacastela";
                else if (isXacobeo) est = "🏡 Complexo Xacobeo";
                else est = "Xeral";
                
                let isMessage = lowerBody.includes("mensaje de") || lowerBody.includes("message from") || lowerBody.includes("nova mensaxe") || lowerBody.includes("nueva mensaxe") || lowerBody.includes("new message");
                let isPreCheckin = lowerBody.includes("precheckin") || lowerBody.includes("pre-checkin") || lowerBody.includes("pre checkin") || lowerBody.includes("check-in online") || lowerBody.includes("registro de viajeros");
                
                let isAgency = lowerBody.includes("booking") || lowerBody.includes("expedia") || lowerBody.includes("agoda") || lowerBody.includes("airbnb") || lowerBody.includes("camino ways") || lowerBody.includes("caminoways") || lowerBody.includes("tee travel") || lowerBody.includes("teetravel") || lowerBody.includes("santiago ways") || lowerBody.includes("santiagoways") || lowerBody.includes("galiwonders") || lowerBody.includes("greenlife") || lowerBody.includes("follow the camino") || lowerBody.includes("followthecamino") || (email.sender || "").toLowerCase().includes("booking") || (email.sender || "").toLowerCase().includes("expedia") || (email.sender || "").toLowerCase().includes("agoda") || (email.sender || "").toLowerCase().includes("airbnb") || (email.sender || "").toLowerCase().includes("noreply") || (email.sender || "").toLowerCase().includes("no-reply");
                let isRuralgest = lowerBody.includes("ruralgest") || (email.sender || "").toLowerCase().includes("ruralgest");
                
                let isLastMinuteWords = lowerBody.includes("ultima hora") || lowerBody.includes("última hora") || lowerBody.includes("last minute") || lowerBody.includes("para hoy") || lowerBody.includes("para hoxe") || lowerBody.includes("esta noche") || lowerBody.includes("esta noite") || lowerBody.includes("for today") || lowerBody.includes("tonight") || lowerBody.includes("inmediata");
                
                // ONLY treat as last minute if it's not a pre-checkin, not a message, and it's a reservation.
                let isLastMinute = isLastMinuteWords && !isPreCheckin && !isMessage && (isAgency || lowerBody.includes("reserva") || lowerBody.includes("booking"));
                
                let d = new Date(email.date);
                let dStr = isNaN(d.getTime()) ? email.date : d.toLocaleString('gl-ES', {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'});
                
                let highlightClass = "border-slate-200 bg-white";
                let titleHighlight = "text-slate-800";
                let customStyle = "";
                let customTitleStyle = "";
                
                let estHighlight = "text-slate-700 bg-slate-100 border-slate-300";
                if (isTriacastela) {
                    estHighlight = "text-blue-800 bg-blue-100 border-blue-400 font-bold shadow-sm";
                } else if (isXacobeo) {
                    estHighlight = "text-emerald-800 bg-emerald-100 border-emerald-400 font-bold shadow-sm";
                }
                
                let agencyHtml = "";
                
                if (isRuralgest) {
                    highlightClass = "border-yellow-400 bg-yellow-50";
                    titleHighlight = "text-yellow-800";
                    agencyHtml = `<span class="text-[10px] font-black px-2 py-0.5 rounded border uppercase bg-yellow-200 text-yellow-900 border-yellow-400" style="background-color: #fef08a; border-color: #facc15; color: #713f12;">🌻 RURALGEST</span>`;
                    customStyle = "background-color: #fefce8; border-color: #facc15;"; 
                    customTitleStyle = "color: #854d0e;";
                } else if (isAgency) {
                    highlightClass = "border-red-500 bg-red-100 shadow-red-200/50";
                    titleHighlight = "text-red-900 font-black";
                    agencyHtml = `<span class="text-[10px] font-black px-2 py-0.5 rounded border uppercase bg-red-600 text-white border-red-700 shadow-sm" style="background-color: #dc2626 !important; border-color: #b91c1c !important; color: #ffffff !important;">⚠️ AXENCIA</span>`;
                    customStyle = "background-color: #fee2e2 !important; border: 2px solid #ef4444 !important; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);";
                    customTitleStyle = "color: #7f1d1d !important; font-weight: 900 !important; font-size: 13px !important;";
                }
                
                if (isLastMinute) {
                    highlightClass = "border-red-600 bg-red-100 shadow-red-500/50 animate-pulse";
                    titleHighlight = "text-red-900 font-black";
                    agencyHtml = `<span class="text-[10px] font-black px-2 py-0.5 rounded border uppercase bg-red-800 text-white border-red-900 shadow-sm animate-bounce" style="background-color: #991b1b !important; border-color: #7f1d1d !important; color: #ffffff !important; font-size: 11px !important; padding: 4px 8px !important;">🚨 ÚLTIMA HORA</span> ` + agencyHtml;
                    customStyle = "background: linear-gradient(to right, #fee2e2, #fecaca) !important; border: 3px solid #dc2626 !important; box-shadow: 0 0 15px rgba(220, 38, 38, 0.6); transform: scale(1.01); margin-top: 8px; margin-bottom: 8px;";
                    customTitleStyle = "color: #7f1d1d !important; font-weight: 900 !important; font-size: 14px !important; text-transform: uppercase;";
                }
                
                return `
                    <div class="${highlightClass} rounded-lg border shadow-sm p-3 hover:shadow-md transition-shadow flex flex-col gap-2 cursor-pointer" style="${customStyle}" onclick="prepareReply('${email.id}')">
                        <div class="flex justify-between items-start">
                            <h3 class="font-bold ${titleHighlight} text-xs truncate flex-1" style="${customTitleStyle}" title="${email.subject}">${email.subject || '(Sen asunto)'}</h3>
                            <span class="text-[10px] text-slate-400 whitespace-nowrap ml-2">${dStr}</span>
                        </div>
                        <div class="text-[11px] text-slate-600 truncate">De: ${email.sender}</div>
                        <div class="flex justify-between items-center mt-1">
                            <div class="flex gap-2 items-center flex-wrap">
                                ${agencyHtml}
                                <span class="text-[10px] font-black px-2 py-0.5 rounded border uppercase ${estHighlight}">${est}</span>
                            </div>
                            <span class="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 uppercase border border-blue-200/50">Responder ✨</span>
                        </div>
                    </div>
                `;
            }).join('');
            startEmailAutoScroll();
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
        
        // Auto-load once on startup and repeat every 60s
        setTimeout(() => {
            if (window.doGoogleLogin || (typeof google !== 'undefined' && google.script)) {
                loadPendingEmails();
                setInterval(() => {
                    if(document.getElementById('replyEditorContainer').classList.contains('hidden')) {
                        loadPendingEmails(false); // Do not force popup from interval
                    }
                }, 60000);
            }
        }, 2500);
    