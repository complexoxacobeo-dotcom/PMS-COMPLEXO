const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Remove the remaining click listener for the old dropdown
const clickListener = /document\.addEventListener\('click', \(e\) => \{[\s\S]*?\}\);/s;
code = code.replace(clickListener, '');

// Fix loadPendingEmails where I left the widget const
code = code.replace(/const widget = document.getElementById\('pendingEmailsWidget'\);/g, '');

// Unhide the pendingEmailsWidget just in case, it should be controlled by tailwind hidden xl:flex
// Wait, I should make sure there's no inline style `style="display: none;"`
code = code.replace(/<div id="pendingEmailsWidget" class="hidden xl:flex flex-col w-\[500px\] h-\[120px\] ml-4 bg-white\/80 backdrop-blur-md border border-blue-300 rounded-xl shadow-inner overflow-hidden" style="display: none;">/, '<div id="pendingEmailsWidget" class="hidden xl:flex flex-col w-[500px] h-[120px] ml-4 bg-white/80 backdrop-blur-md border border-blue-300 rounded-xl shadow-inner overflow-hidden">');

fs.writeFileSync('index.html', code);
console.log("Fixed extra JS!");
