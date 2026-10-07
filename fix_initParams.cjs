const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// I injected `<script>
//        // IF QR MODE, PREVENT UI FLASH
//        const initParams = new URLSearchParams(window.location.search);
//        if (initParams.get('qr')) {
//            window.isQrMode = true;
//            document.write('<style>body > *:not(#qrScannerModal):not(#customDialogModal) { display: none !important; } body { background: #0f172a !important; overflow: hidden; }</style>');
//        }
//    </script>`

// If we put it in the HEAD, maybe `document.write` in the head does something weird? Or maybe `#qrScannerModal` is not a direct child of body?
// Let's check `qrScannerModal` position.
