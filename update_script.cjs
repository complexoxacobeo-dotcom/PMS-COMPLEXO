const fs = require('fs');

// 1. Fix server.ts model
let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace(/gemini-3\.6-flash/g, 'gemini-2.5-flash');
fs.writeFileSync('server.ts', serverCode);
console.log("Updated server.ts models");

// 2. Fix index.html email highlighting, buttons, and logic
let indexCode = fs.readFileSync('index.html', 'utf8');

// Replace renderPendingEmails
const oldRender = /function renderPendingEmails\(\) \{[\s\S]*?\}\)\.join\(''\);\s*\}/;
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
                
                // ADD AGENCY HIGHLIGHT
                let isAgency = lowerBody.includes("booking") || lowerBody.includes("expedia") || lowerBody.includes("agoda") || lowerBody.includes("airbnb") || (email.sender || "").toLowerCase().includes("booking") || (email.sender || "").toLowerCase().includes("expedia") || (email.sender || "").toLowerCase().includes("agoda") || (email.sender || "").toLowerCase().includes("airbnb") || (email.sender || "").toLowerCase().includes("noreply") || (email.sender || "").toLowerCase().includes("no-reply");

                let d = new Date(email.date);
                let dStr = isNaN(d.getTime()) ? email.date : d.toLocaleString('gl-ES', {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'});
                
                let agencyHighlight = isAgency ? "border-red-400 bg-red-50" : "border-slate-200 bg-white";
                let titleHighlight = isAgency ? "text-red-700" : "text-slate-800";
                let estHighlight = isAgency ? "text-red-700 bg-red-100 border-red-200" : "text-indigo-600 bg-indigo-50 border-indigo-100";
                
                return \`
                    <div class="\${agencyHighlight} rounded-lg border shadow-sm p-3 hover:shadow-md transition-shadow flex flex-col gap-2 cursor-pointer" onclick="prepareReply('\${email.id}')">
                        <div class="flex justify-between items-start">
                            <h3 class="font-bold \${titleHighlight} text-xs truncate flex-1" title="\${email.subject}">\${email.subject || '(Sen asunto)'}</h3>
                            <span class="text-[10px] text-slate-400 whitespace-nowrap ml-2">\${dStr}</span>
                        </div>
                        <div class="text-[11px] text-slate-600 truncate">De: \${email.sender}</div>
                        <div class="flex justify-between items-center mt-1">
                            <span class="text-[10px] font-black px-2 py-0.5 rounded border uppercase \${estHighlight}">\${isAgency ? '⚠️ AXENCIA / ' + est : est}</span>
                            <span class="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 uppercase border border-blue-200/50">Responder ✨</span>
                        </div>
                    </div>
                \`;
            }).join('');
        }`;
indexCode = indexCode.replace(oldRender, newRender);

// Add close button to widget
const oldHeader = /<button id="widgetMinMaxBtn"[^>]*>▼<\/button>/;
const newHeader = `<button id="widgetMinMaxBtn" onclick="toggleEmailsMinMax()" class="text-white hover:text-blue-200 font-bold ml-1 cursor-pointer transition-transform duration-200">▼</button>
                <button onclick="closeEmailsWidget()" class="text-white hover:text-red-200 font-bold ml-1 cursor-pointer transition-colors duration-200 text-lg" title="Pechar">&times;</button>`;
indexCode = indexCode.replace(oldHeader, newHeader);

// Add "Ver Correos" to navbar
const oldNavbar = /<button onclick="openPecheCaixa\(\)" class="bg-emerald-600/;
const newNavbar = `<button onclick="openEmailsWidget()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2">
                    <span>✉️</span> <span>Correos</span>
                </button>
                <button onclick="openPecheCaixa()" class="bg-emerald-600`;
indexCode = indexCode.replace(oldNavbar, newNavbar);

// Add the open/close functions
const oldDraggableLogic = /\/\/ Draggable Logic/;
const newDraggableLogic = `// Minimize/Maximize and Close
        function closeEmailsWidget() {
            document.getElementById('draggableEmailsWidget').style.display = 'none';
        }
        function openEmailsWidget() {
            const w = document.getElementById('draggableEmailsWidget');
            w.style.display = 'flex';
            if (emailsWidgetMinimized) toggleEmailsMinMax();
            if (currentPendingEmails.length === 0) loadPendingEmails(true);
        }
        // Draggable Logic`;
indexCode = indexCode.replace(oldDraggableLogic, newDraggableLogic);

// Add an auto-login wrapper to loadPendingEmails
const oldLoadPendingEmails = /async function loadPendingEmails\(force = false\) \{/;
const newLoadPendingEmails = `async function loadPendingEmails(force = false) {
            // Auto check Google token expiration (expires after 3600s/1hr). If expired, auto-refresh to prevent constant prompts IF triggered by user interaction (like button click).
            const tTime = localStorage.getItem('google_access_token_time');
            if (force && (!tTime || Date.now() - parseInt(tTime) > 3500000)) {
                if (window.doGoogleLogin) {
                    try { await window.doGoogleLogin(); } catch(e) {}
                }
            }`;
indexCode = indexCode.replace(oldLoadPendingEmails, newLoadPendingEmails);

fs.writeFileSync('index.html', indexCode);
console.log("Updated index.html");

