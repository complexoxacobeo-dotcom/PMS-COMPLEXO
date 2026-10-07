const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// I will just use regex to remove anything between <!-- Modal de Escáner e Validación QR (Full Screen) --> and <style>
// wait, the easiest way is to just find the index of <!-- Modal de Escáner e Validación QR (Full Screen) -->
// and remove everything until </style>

const startIdx = code.indexOf('<!-- Modal de Escáner e Validación QR (Full Screen) -->');
if (startIdx > -1) {
    const endStr = '</style>';
    let endIdx = code.indexOf(endStr, startIdx);
    if (endIdx > -1) {
        endIdx += endStr.length;
        
        const extractedModal = code.substring(startIdx, endIdx);
        code = code.substring(0, startIdx) + code.substring(endIdx);
        
        // now find the LAST </body> tag.
        const lastBodyIdx = code.lastIndexOf('</body>');
        if (lastBodyIdx > -1) {
            code = code.substring(0, lastBodyIdx) + extractedModal + '\n' + code.substring(lastBodyIdx);
            fs.writeFileSync('index.html', code);
            console.log("Fixed HTML correctly this time.");
        }
    }
}
