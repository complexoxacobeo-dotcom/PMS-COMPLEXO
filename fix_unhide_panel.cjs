const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const targetStr = `const statusEl = document.getElementById('qrStatusBox');
                if (statusEl) {
                    statusEl.innerHTML = \`<div class="flex flex-col gap-3 items-center w-full">`;

const replaceStr = `// Unhide the panel so the password prompt is visible
                const panel = document.getElementById('qrResultPanel');
                if (panel) panel.classList.remove('hidden');
                
                const statusEl = document.getElementById('qrStatusBox');
                if (statusEl) {
                    statusEl.innerHTML = \`<div class="flex flex-col gap-3 items-center w-full">`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('index.html', code);
