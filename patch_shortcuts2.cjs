const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Use gap-1.5 for container
code = code.replace(/<div id="customShortcutsContainer" class="flex flex-wrap xl:justify-end gap-2 empty:hidden"><\/div>/g, 
'<div id="customShortcutsContainer" class="flex flex-wrap lg:justify-end gap-1.5 empty:hidden"></div>');

// Remove flex-1 min-w-[70px] md:flex-none from the anchor
code = code.replace(/class="flex-1 min-w-\[70px\] md:flex-none /g, 'class="');

fs.writeFileSync('index.html', code);
console.log("Shortcuts patched part 2!");
