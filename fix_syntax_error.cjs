const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const regex = /\} catch\(e\) \{\s*summaryBox\.className = "mb-4 p-4 rounded-xl border bg-red-50 border-red-200 text-red-800 font-bold";\s*summaryBox\.innerHTML = "❌ Produciuse un erro contactando coa IA: " \+ e\.message;\s*\}\s*\};\s*if\(!dayData \|\| dayData\.length === 0\) continue;[\s\S]*?hideLoader\(\);\s*\};\s*window\.processImportListAI = async function\(\) \{/;

const replaceStr = `            } catch(e) {
                summaryBox.className = "mb-4 p-4 rounded-xl border bg-red-50 border-red-200 text-red-800 font-bold";
                summaryBox.innerHTML = "❌ Produciuse un erro contactando coa IA: " + e.message;
            }
        };

        window.processImportListAI = async function() {`;

code = code.replace(regex, replaceStr);

fs.writeFileSync('index.html', code);
