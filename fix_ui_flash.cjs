const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const injectionStr = `<script>
        // IF QR MODE, PREVENT UI FLASH
        const initParams = new URLSearchParams(window.location.search);
        if (initParams.get('qr')) {
            window.isQrMode = true;
            document.write('<style>body > *:not(#qrScannerModal):not(#customDialogModal) { display: none !important; } body { background: #0f172a !important; overflow: hidden; }</style>');
        }
    </script>`;

code = code.replace(/<script>/, injectionStr + '\n    <script>');

fs.writeFileSync('index.html', code);
