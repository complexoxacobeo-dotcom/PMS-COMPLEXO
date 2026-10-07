const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(/setInterval\(\(\) => \{\s*if\(document\.getElementById\('replyEditorContainer'\)\.classList\.contains\('hidden'\)\) \{\s*loadPendingEmails\(true\);\s*\}\s*\}, 60000\);/m, 
`setInterval(() => {
                    if(document.getElementById('replyEditorContainer').classList.contains('hidden')) {
                        loadPendingEmails(false); // Do not force popup from interval
                    }
                }, 60000);`);

fs.writeFileSync('index.html', code);
console.log("Interval patched!");
