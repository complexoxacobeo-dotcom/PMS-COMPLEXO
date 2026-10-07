const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const oldRenderRegex = /function renderPendingEmails\(\) \{[\s\S]*?\}\s*async function prepareReply/s;
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

code = code.replace(oldRenderRegex, newRender);
fs.writeFileSync('index.html', code);
console.log("Fixed render layout");
