const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// 1. Remove the old pendingEmailsModal button from the menu
const mailBtnRegex = /<button onclick="openPendingEmailsModal\(\)"[\s\S]*?<\/button>/;
code = code.replace(mailBtnRegex, '');

// 2. Remove the old pendingEmailsModal entirely.
const modalRegex = /<!-- Modal Correos Pendentes -->[\s\S]*?<!-- Editor de Resposta -->/s;
// Actually, let's just find the start of Modal Correos Pendentes and remove up to </script> (and then put back the JS)
// Let's do it cleaner.
