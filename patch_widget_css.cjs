const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(/id="pendingEmailsWidget" class="fixed top-24 left-4 w-\[350px\] max-h-\[70vh\]/g, 'id="pendingEmailsWidget" class="fixed top-24 left-4 w-[450px] max-h-[85vh]');

fs.writeFileSync('index.html', code);
console.log("Patched widget size!");
