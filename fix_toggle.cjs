const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const regex = /let emailsWidgetOpen = false;\s*function toggleEmailsDropdown\(\) \{[\s\S]*?\}\s*\/\/ Clicar fora pecha o dropdown/s;
code = code.replace(regex, '// Clicar fora pecha o dropdown');

fs.writeFileSync('index.html', code);
console.log("Removed toggleEmailsDropdown!");
