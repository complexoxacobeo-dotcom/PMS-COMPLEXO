const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Change height to 120px and width to 500px
code = code.replace(/class="hidden xl:flex flex-col w-\[350px\] h-\[75px\] ml-4/, 'class="hidden xl:flex flex-col w-[500px] h-[120px] ml-4');

// Update JS for renderPendingEmails to be very compact
const renderRegex = /function renderPendingEmails\(\) \{[\s\S]*?\}\s*async function prepareReply/s;
const newRender = `function renderPendingEmails() {
            const list = document.getElementById('pendingEmailsList');
            if (currentPendingEmails.length === 0) {
                list.innerHTML = '<div class="text-center p-2 text-slate-500 text-[10px] font-bold">Sen correos pendentes. 🎉</div>';
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
                    <div class="bg-white rounded border border-slate-200 p-1.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-2 shadow-sm" onclick="prepareReply('\${email.id}')">
                        <div class="flex-1 min-w-0 flex items-center gap-2">
                            <span class="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded uppercase">\${est}</span>
                            <span class="text-[10px] text-slate-400 font-bold whitespace-nowrap">\${dStr}</span>
                            <span class="font-bold text-slate-800 text-[11px] truncate flex-1" title="\${email.subject}">\${email.subject || '(Sen asunto)'}</span>
                            <span class="text-[9px] text-slate-500 truncate max-w-[100px]">\${email.sender}</span>
                        </div>
                        <button class="shrink-0 bg-blue-100 hover:bg-blue-200 text-blue-700 text-[9px] font-black uppercase px-2 py-1 rounded">Respostar ✨</button>
                    </div>
                \`;
            }).join('');
        }
        
        async function prepareReply`;

code = code.replace(renderRegex, newRender);

// Clean up old toggle dropdown logic since it's now always open
const toggleRegex = /let emailsWidgetOpen = false;[\s\S]*?widget.style.display = 'none';\n            }\n        }\)/;
code = code.replace(toggleRegex, '');

// Clean up loadPendingEmails "widget.style.display"
code = code.replace("const widget = document.getElementById('pendingEmailsWidget');", "");

fs.writeFileSync('index.html', code);
console.log("Patched JS and CSS for inline!");
