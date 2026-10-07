const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const oldCatch = /catch \(err\) \{\s*console\.error\(err\);\s*errBox\.textContent = "Erro obtendo os correos: " \+ \(err\.message \|\| err\);\s*errBox\.classList\.remove\('hidden'\);\s*\}/;

const newCatch = `catch (err) {
                console.error(err);
                let msg = err.message || err;
                errBox.innerHTML = "<strong>Atención:</strong> " + msg;
                if (msg.includes("Acceso a Gmail denegado") || msg.includes("Permisos de Gmail") || msg.includes("Contorno non compatible")) {
                    errBox.innerHTML += '<br><br><button onclick="window.doGoogleLogin().then(()=>loadPendingEmails(true)).catch(e=>console.error(e))" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow w-full flex justify-center items-center gap-2"><span>🔄</span> Reconectar con Google</button>';
                }
                errBox.classList.remove('hidden');
            }`;

if (code.match(oldCatch)) {
    code = code.replace(oldCatch, newCatch);
    fs.writeFileSync('index.html', code);
    console.log("Updated error box to support reconnection!");
} else {
    console.log("Could not find the catch block.");
}
