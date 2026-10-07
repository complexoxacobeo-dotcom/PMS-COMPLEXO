const fs = require('fs');
let ts = fs.readFileSync('server.ts', 'utf8');

const searchStr = `REGRAS IMPORTANTES (CUMPLE ESTAS REGRAS ESTRITAMENTE):
1. NOME DA AXENCIA vs CLIENTE: Moitas veces a columna "Cliente" contén o nome da Axencia (ex: SANTIAGO WAYS S.L., Follow The Camino, GREENLIFE TOURS). Neses casos, pon a axencia no campo "ota", e busca o NOME DO HÓSPEDE REAL (ex: "Ziyu Wang", "Tom Staed", "Matrimonio") nas notas adicionais para poñelo en "clientName". Se non hai nome de hóspede real, usa o da axencia.
2. SERVIZOS EXTRA: Analiza ben se nas notas ou no prezo aparecen almorzos ("Desayuno", "AD"), media pensión ("Media Pensión", "MP"), ceas ou picnics. Engádeos coas súas cantidades ao obxecto "services".
3. ASIGNACIÓN DE HABITACIÓNS: NUNCA INVENTES NIN ASIGNES AO CHOU AS HABITACIÓNS. Se no texto non especifica claramente o NÚMERO ou o NOME EXACTO da habitación (ex. di só "Habitación Doble" ou "Cama en albergue"), debes poñer "baseRoomId": null. Só podes poñer o baseRoomId se o texto menciona inequivocamente a habitación (ex. "Habitación 101").
4. IGNORA AS CONDICIÓNS LEGAIS: Na sección de notas a miúdo aparece "Condiciones para la habitacion Habitación Doble...". IGNORA COMPLETAMENTE iso á hora de contar habitacións. NON crees novas habitacións baseándote nese texto xenérico.
5. AGRUPA A INFORMACIÓN NUNHA SOA RESERVA: O texto principal da reserva e os comentarios (---- data ---- Comentario...) que están xusto debaixo PERTENCEN Á MESMA RESERVA. Xunta todo nun ÚNICO obxecto JSON. NON xeres dúas reservas para a mesma persoa (unha coa habitación e outra coas notas). A habitación e a "observation" deben ir XUNTAS na mesma reserva.`;

const replaceStr = `REGRAS IMPORTANTES (CUMPLE ESTAS REGRAS ESTRITAMENTE):
1. ETIQUETAS DE AXENCIA MÁIS ESTRITAS (OTA): É VITAL que poñas SEMPRE o nome da axencia no campo "ota" se detectas unha (ex: Booking.com, Expedia, Misterplan, Santiago Ways, Follow The Camino, Greenlife Tours, Tee Travel, Galiwonders, Camino de Santiago, etc). Moitas veces a columna "Cliente" contén a Axencia. Neses casos, pon a axencia en "ota", e busca o NOME DO HÓSPEDE REAL (ex: "Ziyu Wang", "Tom Staed") nas notas para poñelo en "clientName". Se non hai nome real, usa o da axencia tamén en "clientName".
2. SERVIZOS EXTRA: Analiza ben se nas notas ou no prezo aparecen almorzos ("Desayuno", "AD"), media pensión ("Media Pensión", "MP"), ceas ou picnics. Engádeos coas súas cantidades ao obxecto "services".
3. ASIGNACIÓN DE HABITACIÓNS E ALBERGUE:
   - Para habitacións privadas (ex. Dobres, Individuais): NUNCA as asignes ao chou. Se o texto non especifica claramente o NÚMERO ou NOME EXACTO da habitación (ex. "Habitación 101"), pon "baseRoomId": null.
   - EXCEPCIÓN ALBERGUES E LITERAS: Se a reserva é para "Cama en habitación compartida", "Albergue", "Cama" ou "Literas", SÍ debes asignar o baseRoomId do Albergue (o que teña type: 'hostel' na túa lista) e usar o campo "qty" para indicar cantas camas son (por defecto 1). O sistema frontend encargarase de encher as camas libres automaticamente comezando polas primeiras!
4. IGNORA AS CONDICIÓNS LEGAIS: Na sección de notas a miúdo aparece "Condiciones para la habitacion Habitación Doble...". IGNORA COMPLETAMENTE iso á hora de contar habitacións. NON crees novas habitacións baseándote nese texto xenérico.
5. AGRUPA A INFORMACIÓN NUNHA SOA RESERVA: O texto principal da reserva e os comentarios (---- data ---- Comentario...) que están xusto debaixo PERTENCEN Á MESMA RESERVA. Xunta todo nun ÚNICO obxecto JSON. NON xeres dúas reservas para a mesma persoa (unha coa habitación e outra coas notas). A habitación e a "observation" deben ir XUNTAS na mesma reserva.`;

ts = ts.replace(searchStr, replaceStr);
fs.writeFileSync('server.ts', ts);
console.log("Patched server.ts AI strict room matching with Hostel Exception");
