const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

const targetOld = `(Adáptao un pouco ao idioma se é inglés, por exemplo "Best regards, Chus...").
Devolve ÚNICAMENTE o texto da resposta, sen comiñas nin formatos markdown.\`;
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt
      });`;

const replacementNew = `(Adáptao un pouco ao idioma se é inglés, por exemplo "Best regards, Chus...").
5. ATENCIÓN A AXENCIAS: Se o correo provén de Booking, Expedia, Airbnb, etc., diríxete polo seu nome ao HÓSPEDE REAL (que adoita vir no corpo do texto), non á axencia. Menciona as datas da reserva ou o tipo de habitación para que a mensaxe sexa única e non repetitiva.
Devolve ÚNICAMENTE o texto da resposta, sen comiñas nin formatos markdown.\`;
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: { temperature: 0.8 }
      });`;

if (serverCode.includes(`Devolve ÚNICAMENTE o texto da resposta, sen comiñas nin formatos markdown.\`;`)) {
    // just replacing the whole block
    const old1 = `Devolve ÚNICAMENTE o texto da resposta, sen comiñas nin formatos markdown.\`;\n      const response = await ai.models.generateContent({\n        model: "gemini-3.6-flash",\n        contents: prompt\n      });`;
    
    const new1 = `5. ATENCIÓN A AXENCIAS: Se o correo provén de Booking, Expedia, Airbnb, etc., diríxete polo seu nome ao HÓSPEDE REAL (que adoita vir no corpo do texto), non á axencia. Menciona as datas da reserva ou o tipo de habitación para que a mensaxe sexa única e non repetitiva.\nDevolve ÚNICAMENTE o texto da resposta, sen comiñas nin formatos markdown.\`;\n      const response = await ai.models.generateContent({\n        model: "gemini-3.6-flash",\n        contents: prompt,\n        config: { temperature: 0.8 }\n      });`;
    
    serverCode = serverCode.replace(old1, new1);
    
    fs.writeFileSync('server.ts', serverCode);
    console.log("Updated server.ts successfully");
} else {
    console.log("Could not find prompt string in server.ts");
}
