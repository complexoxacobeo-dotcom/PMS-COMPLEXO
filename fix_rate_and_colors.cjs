const fs = require('fs');

// 1. Fix server.ts error handling
let serverCode = fs.readFileSync('server.ts', 'utf8');

const catchBlockOld = `    } catch (e: any) {
      console.error("Generate reply error:", e);
      res.status(500).json({ error: e.message });
    }`;

const catchBlockNew = `    } catch (e: any) {
      console.error("Generate reply error:", e);
      if (e.message?.includes("429") || e.message?.includes("quota") || e.message?.includes("RESOURCE_EXHAUSTED")) {
        return res.status(429).json({ error: "Límite de uso da IA superado (máx 5 por minuto na capa gratuita). Por favor, agarda un pouco para volver tentar." });
      }
      if (e.message?.includes("503") || e.message?.includes("UNAVAILABLE") || e.message?.includes("high demand")) {
        return res.status(503).json({ error: "O modelo de IA está experimentando unha alta demanda temporal. Por favor, agarda uns intres e volve tentalo máis tarde." });
      }
      res.status(500).json({ error: e.message });
    }`;

if (serverCode.includes(catchBlockOld)) {
    serverCode = serverCode.replace(catchBlockOld, catchBlockNew);
    fs.writeFileSync('server.ts', serverCode);
    console.log("Updated server.ts catch block");
} else {
    console.log("Could not find catchBlockOld in server.ts");
}

// 2. Fix index.html scroll speed and colors
let indexCode = fs.readFileSync('index.html', 'utf8');
indexCode = indexCode.replace(/}, 40\); \/\/ speed of scroll/g, '}, 15); // speed of scroll');

const oldRenderBody = /list\.innerHTML = currentPendingEmails\.map\([\s\S]*?\}\)\.join\(''\);/;

const newRenderBody = `list.innerHTML = currentPendingEmails.map(email => {
                let est = "Xeral";
                const lowerBody = (email.body || "").toLowerCase() + " " + (email.subject || "").toLowerCase();
                
                let isTriacastela = lowerBody.includes("triacastela") || lowerBody.includes("boutique") || lowerBody.includes("hotel");
                let isXacobeo = lowerBody.includes("xacobeo");
                
                if (isTriacastela) est = "🏨 Hotel Triacastela";
                else if (isXacobeo) est = "🏡 Complexo Xacobeo";
                else est = "Xeral";
                
                let isAgency = lowerBody.includes("booking") || lowerBody.includes("expedia") || lowerBody.includes("agoda") || lowerBody.includes("airbnb") || (email.sender || "").toLowerCase().includes("booking") || (email.sender || "").toLowerCase().includes("expedia") || (email.sender || "").toLowerCase().includes("agoda") || (email.sender || "").toLowerCase().includes("airbnb") || (email.sender || "").toLowerCase().includes("noreply") || (email.sender || "").toLowerCase().includes("no-reply");
                let isRuralgest = lowerBody.includes("ruralgest") || (email.sender || "").toLowerCase().includes("ruralgest");

                let d = new Date(email.date);
                let dStr = isNaN(d.getTime()) ? email.date : d.toLocaleString('gl-ES', {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'});
                
                let highlightClass = "border-slate-200 bg-white";
                let titleHighlight = "text-slate-800";
                let estHighlight = "text-indigo-600 bg-indigo-50 border-indigo-100";
                let tagPrefix = "";
                
                if (isRuralgest) {
                    highlightClass = "border-yellow-400 bg-yellow-50";
                    titleHighlight = "text-yellow-800";
                    estHighlight = "text-yellow-900 bg-yellow-200 border-yellow-400";
                    tagPrefix = "🌻 RURALGEST / ";
                } else if (isAgency) {
                    highlightClass = "border-purple-400 bg-purple-50";
                    titleHighlight = "text-purple-700";
                    estHighlight = "text-purple-900 bg-purple-200 border-purple-400";
                    tagPrefix = "⚠️ AXENCIA / ";
                }
                
                return \`
                    <div class="\${highlightClass} rounded-lg border shadow-sm p-3 hover:shadow-md transition-shadow flex flex-col gap-2 cursor-pointer" onclick="prepareReply('\${email.id}')">
                        <div class="flex justify-between items-start">
                            <h3 class="font-bold \${titleHighlight} text-xs truncate flex-1" title="\${email.subject}">\${email.subject || '(Sen asunto)'}</h3>
                            <span class="text-[10px] text-slate-400 whitespace-nowrap ml-2">\${dStr}</span>
                        </div>
                        <div class="text-[11px] text-slate-600 truncate">De: \${email.sender}</div>
                        <div class="flex justify-between items-center mt-1">
                            <span class="text-[10px] font-black px-2 py-0.5 rounded border uppercase \${estHighlight}">\${tagPrefix}\${est}</span>
                            <span class="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 uppercase border border-blue-200/50">Responder ✨</span>
                        </div>
                    </div>
                \`;
            }).join('');`;

if (indexCode.match(oldRenderBody)) {
    indexCode = indexCode.replace(oldRenderBody, newRenderBody);
    fs.writeFileSync('index.html', indexCode);
    console.log("Updated index.html");
} else {
    console.log("Could not find oldRenderBody in index.html");
}
