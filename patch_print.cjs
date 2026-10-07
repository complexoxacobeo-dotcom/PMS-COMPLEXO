const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const regex = /function printVoucher\([\s\S]*?function imprimirPlaningA4\(\) \{/m;

const replacement = `function printVoucher(tipo, inputId, isCheckbox = false) {
            const dia = appState.dailyData[currentPlaningDate];
            const room = dia.find(r => r.id === (currentEditingBedIds[0] || currentEditingRoomId)); 
            if(!room) return;
            const el = document.getElementById(inputId);
            if(!el) return;
            let qty = 1; 
            if(!isCheckbox) { 
                qty = el.value; 
                if(qty <= 0) return cAlert("Introduza cantidade."); 
            } else { 
                if(!el.checked) return cAlert("Servizo non marcado."); 
            }
            
            let persoaRaw = document.getElementById('receptionistName').value; 
            let persoaFinal = persoaRaw;
            if (!persoaFinal || persoaFinal.toLowerCase() === 'complexo xacobeo' || persoaFinal.toLowerCase() === 'complexo xacobeo (xeral)') {
                persoaFinal = 'RECEPCIÓN';
            }
            const dh = new Date().toLocaleString("gl-ES", { timeZone: "Europe/Madrid" });
            const pNum = room.bedId ? room.number+'-'+room.bedId : room.number;
            
            if (typeof google !== 'undefined' && google.script) {
                google.script.run.gardarVaucher(room.agency || 'Directo', tipo, pNum, room.clientName || 'Hóspede', qty, persoaRaw);
            }
            
            let validezDate = new Date(currentPlaningDate);
            if (tipo.includes('Almorzo') || tipo === 'Almorzo') {
                validezDate.setDate(validezDate.getDate() + 1);
            }
            const dataValidezStr = validezDate.toLocaleDateString('gl-ES', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
            if (appState.pushConfig && appState.pushConfig.telegram) { 
                sendTelegramMsg(\`🎟️ <b>Impreso \${tipo}</b>\\n👤 Cliente: \${room.clientName || 'Hóspede'}\\n🛏️ Aloxamento: \${pNum}\\n🔢 Cantidade: \${qty}\\n📅 Para: \${dataValidezStr}\`);
            }

            let icon = '🎟️';
            if(tipo.includes('Almorzo')) icon = '☕';
            else if(tipo.includes('Cea')) icon = '🍽️';
            else if(tipo.includes('Picnic')) icon = '🎒';
            else if(tipo.includes('Pensión')) icon = '⭐';
            else if(tipo.includes('Lavandaría')) icon = '🧺';
            
            let extraNote = '';
            if (tipo.includes('Pensión') || tipo.includes('Pension') || tipo.includes('Completa') || tipo.includes('Media')) {
                extraNote = \`<div class="mp-note">INCLÚE XANTAR OU CEA EN<br>PARRILLADA XACOBEO<br>("Menú Xacobeo")</div>\`;
            }

            const separator = \`<div class="separator">✧ ════ ❖ ════ ✧</div>\`;

            const html = \`
            <!DOCTYPE html>
            <html lang="gl">
            <head>
                <meta charset="UTF-8">
                <style>
                    @page { margin: 0; }
                    body { font-family: 'Courier New', Courier, monospace; width: 78mm; margin: 0 auto; padding: 4mm; color: #000; text-align: center; }
                    .ticket { border: 2px solid #000; padding: 0 0 10px 0; border-radius: 8px; background: #fff; overflow: hidden; }
                    .header { font-size: 22px; font-weight: 900; padding: 12px 5px; text-transform: uppercase; background: #000; color: #fff; letter-spacing: 1px; margin-bottom: 10px; }
                    .subheader { font-size: 12px; color: #000; font-weight: bold; margin-bottom: 5px; }
                    .separator { font-size: 14px; text-align: center; margin: 8px 0; font-weight: bold; }
                    .client { font-size: 15px; margin: 10px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-transform: uppercase; }
                    .room { font-size: 32px; font-weight: 900; margin: 10px; background: #000; color: #fff; padding: 10px; border-radius: 6px; letter-spacing: 2px;}
                    .service { font-size: 18px; font-weight: 900; margin: 15px 0 5px 0; text-transform: uppercase;}
                    .qty { font-size: 35px; font-weight: 900; margin: 5px 20px; border: 4px solid #000; border-radius: 8px; padding: 5px;}
                    .date-valid { font-size: 16px; font-weight: 900; margin: 15px 10px; padding: 10px; display: block; background: #000; color: #fff; border-radius: 6px;}
                    .mp-note { font-size: 14px; font-weight: 900; border: 2px dashed #000; padding: 10px; margin: 10px; background: #fff; color: #000;}
                    .footer { font-size: 12px; font-weight: bold; margin-top: 15px; border-top: 2px solid #000; padding-top: 10px; line-height: 1.5; text-transform: uppercase; }
                </style>
            </head>
            <body onload="window.print(); setTimeout(()=>window.close(), 500);">
                <div class="ticket">
                    <div class="header">\${icon} \${tipo}</div>
                    <div class="subheader">COMPLEXO XACOBEO<br>\${dh}</div>
                    \${separator}
                    <div class="client">\${room.clientName || 'HÓSPEDE'}</div>
                    <div class="room">HAB: \${pNum}</div>
                    <div class="service">\${tipo}</div>
                    <div class="qty">X \${qty}</div>
                    <div class="date-valid">VÁLIDO O:<br>\${dataValidezStr}</div>
                    \${extraNote}
                    \${separator}
                    <div class="footer">EXPEDIDO POR: \${persoaFinal}<br>Grazas pola súa visita</div>
                </div>
            </body>
            </html>\`;
            
            const printWin = window.open('', '_blank');
            printWin.document.write(html);
            printWin.document.close();
        }

        function imprimirPlaningA4() {`;

code = code.replace(regex, replacement);

fs.writeFileSync('index.html', code);
console.log("Voucher print patched!");
