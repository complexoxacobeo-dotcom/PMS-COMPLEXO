const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const targetStr = `document.addEventListener('DOMContentLoaded', () => {`;
const replacementStr = `document.addEventListener('DOMContentLoaded', () => {
            if (window.isQrMode) {
                // Completely kill the login overlay in QR mode to prevent it from fading in
                const lo = document.getElementById('loginOverlay');
                if(lo) {
                    lo.style.display = 'none !important';
                    lo.style.opacity = '0 !important';
                    lo.style.zIndex = '-1 !important';
                    lo.remove(); // Just nuke it from DOM
                }
                document.body.style.background = '#0f172a'; // dark theme for scanner
            }`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('index.html', code);
