const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const injectionHtml = `
        window.printPlanningA4 = function() {
            const gridContent = document.getElementById('roomGrid').outerHTML;
            const currentDate = document.getElementById('planingDate').value;
            
            const printWindow = window.open('', '_blank');
            printWindow.document.write(\`
                <!DOCTYPE html>
                <html lang="gl">
                <head>
                    <title>Planning A4 - \${currentDate}</title>
                    <script src="https://cdn.tailwindcss.com"><\\/script>
                    <style>
                        body { background: white !important; font-family: sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 20px; }
                        #roomGrid { display: grid !important; gap: 10px !important; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important; }
                        /* Hide things that shouldn't be printed */
                        .action-buttons, button, .cursor-pointer { display: none !important; pointer-events: none !important; }
                        .room-card { break-inside: avoid; border: 1px solid #ccc !important; box-shadow: none !important; margin-bottom: 10px; }
                        @page { size: A4 landscape; margin: 10mm; }
                        .print-header { text-align: center; margin-bottom: 20px; font-size: 24px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="print-header">Planning Xacobeo - \${currentDate.split('-').reverse().join('/')}</div>
                    \${gridContent}
                    <script>
                        window.onload = () => {
                            setTimeout(() => {
                                window.print();
                                window.close();
                            }, 1000);
                        };
                    <\\/script>
                </body>
                </html>
            \`);
            printWindow.document.close();
        };
`;

code = code.replace('// Minimize/Maximize and Close', injectionHtml + '\n        // Minimize/Maximize and Close');
fs.writeFileSync('index.html', code);
