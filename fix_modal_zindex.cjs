const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(/id="qrScannerModal" class="modal z-\[9999999\] bg-slate-900"/, 'id="qrScannerModal" class="modal bg-slate-900" style="display: none; z-index: 9000;"');

fs.writeFileSync('index.html', code);
console.log("Modal z-index fixed.");
