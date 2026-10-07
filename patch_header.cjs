const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// 1. Fix setInterval logic
code = code.replace(/if\(!document\.getElementById\('replyEditorContainer'\)\.classList\.contains\('flex'\)\)/g, "if(document.getElementById('replyEditorContainer').classList.contains('hidden'))");

// 2. Fix loadPendingEmails clearing logic
code = code.replace(/loader\.classList\.remove\('hidden'\);\s*loader\.classList\.add\('flex'\);\s*list\.innerHTML = '';\s*errBox\.classList\.add\('hidden'\);/g, 
`if (currentPendingEmails.length === 0) { loader.classList.remove('hidden'); loader.classList.add('flex'); list.innerHTML = ''; }
            errBox.classList.add('hidden');`);

// 3. Compact Header Padding
code = code.replace(/<header id="mainHeader" class="bg-white\/40 backdrop-blur-xl border-b border-white\/50 p-4 md:p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4/g, 
'<header id="mainHeader" class="bg-white/40 backdrop-blur-xl border-b border-white/50 p-3 md:p-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3');

// 4. Compact Controls wrapper
code = code.replace(/<div class="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-end gap-2">/g, 
'<div class="flex flex-wrap lg:justify-end gap-1.5">');

// 5. Compact all buttons in that section
// The buttons have "px-3 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm border border-xxx flex items-center justify-center gap-2"
// I will replace all `px-3 py-2 rounded-xl text-xs` with `px-2.5 py-1.5 rounded-lg text-[11px] leading-none` and `gap-2` with `gap-1.5` 
// but it's safer to just regex replace the specific strings.

code = code.replace(/px-3 py-2 rounded-xl text-xs/g, "px-2.5 py-1.5 rounded-lg text-[11px]");
code = code.replace(/gap-2">/g, 'gap-1.5">');

fs.writeFileSync('index.html', code);
console.log("Header and interval patched!");
