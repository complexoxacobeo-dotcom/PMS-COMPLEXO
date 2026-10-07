const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const targetCss = `.card-apartment { clip-path: polygon(0 25px, 50% 0%, 100% 25px, 100% 100%, 0% 100%); }
        .card-apartment .status-indicator { padding-top: 30px; }
        .card-apartment .card-content { padding-top: 30px; }`;

const newCss = `.card-apartment { 
            clip-path: polygon(0 35px, 50% 0%, 100% 35px, 100% 100%, 0% 100%); 
            margin-top: 5px;
        }
        .card-apartment .status-indicator { padding-top: 40px; }
        .card-apartment .card-content { padding-top: 40px; }
        .card-apartment::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 35px;
            background: rgba(0, 0, 0, 0.1);
            clip-path: polygon(50% 0%, 0% 35px, 100% 35px);
            pointer-events: none;
        }`;

code = code.replace(targetCss, newCss);
fs.writeFileSync('index.html', code);
