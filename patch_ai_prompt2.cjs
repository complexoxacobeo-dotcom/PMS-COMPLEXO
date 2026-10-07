const fs = require('fs');
let ts = fs.readFileSync('server.ts', 'utf8');

const searchStr = `1. NOME DA AXENCIA vs CLIENTE: Moitas veces a columna "Cliente" contén o nome da Axencia (ex: SANTIAGO WAYS S.L., Follow The Camino, GREENLIFE TOURS). Neses casos, pon a axencia no campo "ota", e busca o NOME DO HÓSPEDE REAL (ex: "Ziyu Wang", "Tom Staed", "Matrimonio") nas notas adicionais para poñelo en "clientName". Se non hai nome de hóspede real, usa o da axencia.
2. SERVIZOS EXTRA: Analiza ben se nas notas ou no prezo aparecen almorzos ("Desayuno", "AD"), media pensión ("Media Pensión", "MP"), ceas ou picnics. Engádeos coas súas cantidades ao obxecto "services".`;

const replaceStr = `1. NOME DA AXENCIA vs CLIENTE: Moitas veces a columna "Cliente" contén o nome da Axencia (ex: SANTIAGO WAYS S.L., Follow The Camino, GREENLIFE TOURS). Neses casos, pon a axencia no campo "ota", e busca o NOME DO HÓSPEDE REAL (ex: "Ziyu Wang", "Tom Staed", "Matrimonio") nas notas adicionais para poñelo en "clientName". Se non hai nome de hóspede real, usa o da axencia.
2. SERVIZOS EXTRA: Analiza ben se nas notas ou no prezo aparecen almorzos ("Desayuno", "AD"), media pensión ("Media Pensión", "MP"), ceas ou picnics. Engádeos coas súas cantidades ao obxecto "services".
3. ASIGNACIÓN DE HABITACIÓNS: NUNCA INVENTES NIN ASIGNES AO CHOU AS HABITACIÓNS. Se no texto non especifica claramente o NÚMERO ou o NOME EXACTO da habitación (ex. di só "Habitación Doble" ou "Cama en albergue"), debes poñer "baseRoomId": null. Só podes poñer o baseRoomId se o texto menciona inequivocamente a habitación (ex. "Habitación 101").`;

ts = ts.replace(searchStr, replaceStr);
fs.writeFileSync('server.ts', ts);
console.log("Patched server.ts AI strict room matching");
