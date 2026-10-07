const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf8');

const regex = /Devolve ÚNICAMENTE o texto da resposta, sen comiñas nin formatos markdown\.\`\;\s*const response \= await ai\.models\.generateContent\(\{\s*model\: \"gemini\-3\.6\-flash\"\,\s*contents\: prompt\s*\}\)\;/;

const newText = `5. ATENCIÓN A AXENCIAS: Se o correo provén de Booking, Expedia, Airbnb, etc., diríxete polo seu nome ao HÓSPEDE REAL (que adoita vir no corpo do texto), non á axencia. Menciona as datas da reserva ou o tipo de habitación para que a mensaxe sexa única e non repetitiva.
Devolve ÚNICAMENTE o texto da resposta, sen comiñas nin formatos markdown.\`;
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: { temperature: 0.8 }
      });`;

text = text.replace(regex, newText);
fs.writeFileSync('server.ts', text);
console.log("Done");
