const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const searchStr = `                let data;
                try {
                    data = await res.json();
                } catch(err) {
                    throw new Error("Erro de servidor e non se puido ler a resposta.");
                }
                if (!res.ok) {
                    throw new Error(data.error || "Erro de servidor");
                }`;

const replaceStr = `                let data;
                let rawText = await res.text();
                try {
                    data = JSON.parse(rawText);
                } catch(err) {
                    if (res.status === 504 || res.status === 502) {
                        throw new Error("O servidor tardou demasiado en responder (Timeout). Téntao cun texto máis curto.");
                    }
                    throw new Error("Erro do servidor (" + res.status + "): non se puido ler a resposta da IA.");
                }
                if (!res.ok) {
                    throw new Error(data.error || "Erro de servidor (" + res.status + ")");
                }`;

if (html.includes(searchStr)) {
    html = html.replace(searchStr, replaceStr);
    fs.writeFileSync('index.html', html);
    console.log("Patched fetch");
} else {
    console.log("Search string not found!");
}
