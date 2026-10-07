const fs = require('fs');

// 1. Fix server.ts prompt
let serverCode = fs.readFileSync('server.ts', 'utf8');

const promptOldStart = `REGRAS MOI IMPORTANTES:
1. NON afirmes nin confirmes que existe dispoñibilidade, nin inventes prezos ou datas. Utiliza unha resposta prudente como "Gracias por contactar con nosotros. Hemos recibido su solicitud y estamos comprobando la disponibilidad. Le confirmaremos los detalles a la mayor brevedad." (ou o equivalente no idioma do cliente).`;

const promptNewStart = `REGRAS MOI IMPORTANTES:
1. Usa a información do correo para xerar unha resposta ÚNICA E PERSONALIZADA. Saúda ao cliente polo seu nome (se aparece), e menciona as datas ou o tipo de habitación que solicita para demostrar que liches o seu correo. 
2. NON confirmes que hai dispoñibilidade nin inventes prezos. Remata a túa mensaxe indicando de forma prudente e profesional que estás a comprobar a dispoñibilidade e que lle confirmarás os detalles o antes posible (le confirmaremos los detalles a la mayor brevedad / we will get back to you shortly).`;

if (serverCode.includes(promptOldStart)) {
    serverCode = serverCode.replace(promptOldStart, promptNewStart);
    // Remove old rule 2 since we shifted rules
    serverCode = serverCode.replace("2. O idioma da túa resposta debe ser o mesmo idioma que o do correo orixinal.\n3. As firmas deben ser exactamente", "3. O idioma da túa resposta debe ser o mesmo idioma que o do correo orixinal.\n4. As firmas deben ser exactamente");
    fs.writeFileSync('server.ts', serverCode);
    console.log("Updated server.ts prompt");
} else {
    console.log("Could not find promptOldStart in server.ts");
}

// 2. Fix index.html keywords, colors, and interval
let indexCode = fs.readFileSync('index.html', 'utf8');

// Update render function
const renderStartRegex = /let isAgency = lowerBody\.includes\("booking"\)[\s\S]*?if \(isRuralgest\) \{/m;
const renderNew = `let isAgency = lowerBody.includes("booking") || lowerBody.includes("expedia") || lowerBody.includes("agoda") || lowerBody.includes("airbnb") || lowerBody.includes("camino ways") || lowerBody.includes("tee travel") || lowerBody.includes("santiago ways") || lowerBody.includes("galiwonders") || lowerBody.includes("greenlife") || lowerBody.includes("follow the camino") || (email.sender || "").toLowerCase().includes("booking") || (email.sender || "").toLowerCase().includes("expedia") || (email.sender || "").toLowerCase().includes("agoda") || (email.sender || "").toLowerCase().includes("airbnb") || (email.sender || "").toLowerCase().includes("noreply") || (email.sender || "").toLowerCase().includes("no-reply");
                let isRuralgest = lowerBody.includes("ruralgest") || (email.sender || "").toLowerCase().includes("ruralgest");

                let d = new Date(email.date);
                let dStr = isNaN(d.getTime()) ? email.date : d.toLocaleString('gl-ES', {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'});
                
                let highlightClass = "border-slate-200 bg-white";
                let titleHighlight = "text-slate-800";
                let estHighlight = "text-indigo-600 bg-indigo-50 border-indigo-100";
                let tagPrefix = "";
                
                if (isRuralgest) {`;

if (indexCode.match(renderStartRegex)) {
    indexCode = indexCode.replace(renderStartRegex, renderNew);
} else {
    console.log("Could not find renderStartRegex in index.html");
}

const agencyColorRegex = /\} else if \(isAgency\) \{[\s\S]*?highlightClass = "border-purple-400 bg-purple-50";[\s\S]*?titleHighlight = "text-purple-700";[\s\S]*?estHighlight = "text-purple-900 bg-purple-200 border-purple-400";[\s\S]*?tagPrefix = "⚠️ AXENCIA \/ ";[\s\S]*?\}/m;
const agencyColorNew = `} else if (isAgency) {
                    highlightClass = "border-red-400 bg-red-50";
                    titleHighlight = "text-red-800";
                    estHighlight = "text-red-900 bg-red-200 border-red-500";
                    tagPrefix = "⚠️ AXENCIA / ";
                }`;

if (indexCode.match(agencyColorRegex)) {
    indexCode = indexCode.replace(agencyColorRegex, agencyColorNew);
} else {
    console.log("Could not find agencyColorRegex in index.html");
}

// Add interval
const intervalRegex = /\/\/ Auto-load once on startup\n\s*setTimeout\(\(\) => \{\n\s*if \(isLoggedIn && typeof google !== 'undefined' && google\.script\) \{\n\s*loadPendingEmails\(\);\n\s*\}\n\s*\}, 2500\);/m;
const intervalNew = `// Auto-load once on startup and repeat every 60s
        setTimeout(() => {
            if (window.doGoogleLogin || (typeof google !== 'undefined' && google.script)) {
                loadPendingEmails();
                setInterval(() => {
                    if(!document.getElementById('replyEditorContainer').classList.contains('flex')) {
                        loadPendingEmails(true);
                    }
                }, 60000);
            }
        }, 2500);`;

if (indexCode.match(intervalRegex)) {
    indexCode = indexCode.replace(intervalRegex, intervalNew);
} else {
    console.log("Could not find intervalRegex in index.html");
}

fs.writeFileSync('index.html', indexCode);
console.log("Updated index.html");

