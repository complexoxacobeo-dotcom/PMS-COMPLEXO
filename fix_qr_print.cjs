const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// The first part (const qrPayload = ...) might have succeeded or failed. Let's check.
if (!code.includes('const qrPayload')) {
    code = code.replace(
        /const html = \`/,
        `const qrPayload = encodeURIComponent("XAC|" + currentPlaningDate + "|" + room.id + "|" + tipo + "|" + qty);
            const html = \``
    );
}

// Now replace the header to include the QR code
code = code.replace(
    '<div class="header">${icon} ${tipo}</div>',
    `<div class="header">\${icon} \${tipo}</div>
                    <div style="text-align:center; margin: 10px 0;">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=\${qrPayload}" alt="QR" style="width:120px;height:120px;" />
                    </div>`
);

fs.writeFileSync('index.html', code);
console.log("QR fixed!");
