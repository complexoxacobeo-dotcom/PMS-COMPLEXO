const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const generateReplyEndpoint = `
  app.post("/api/generate-reply", async (req, res) => {
    try {
      const { emailData } = req.body;
      if (!emailData) return res.status(400).json({ error: "Missing emailData" });
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('No API key provided by environment');
      
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({});
      
      const prompt = \`Vostede é o/a recepcionista do Complexo Xacobeo / Hotel Triacastela. 
Recibiuse o seguinte correo electrónico solicitando unha reserva ou dispoñibilidade:

Remitente: \${emailData.sender}
Asunto: \${emailData.subject}
Corpo do correo:
\${emailData.body}

Xera unha resposta profesional, próxima e breve para este correo.
REGRAS MOI IMPORTANTES:
1. NON afirmes nin confirmes que existe dispoñibilidade, nin inventes prezos ou datas. Utiliza unha resposta prudente como "Gracias por contactar con nosotros. Hemos recibido su solicitud y estamos comprobando la disponibilidad. Le confirmaremos los detalles a la mayor brevedad." (ou o equivalente no idioma do cliente).
2. O idioma da túa resposta debe ser o mesmo idioma que o do correo orixinal.
3. As firmas deben ser exactamente:
Se o correo fai referencia ao "Complexo Xacobeo":
Un saludo,
Chus
Complexo Xacobeo

Se o correo fai referencia ao "Hotel Triacastela" ou "Boutique Vila de Triacastela":
Un saludo,
Chus
Hotel Triacastela

(Adáptao un pouco ao idioma se é inglés, por exemplo "Best regards, Chus...").
Devolve ÚNICAMENTE o texto da resposta, sen comiñas nin formatos markdown.
\`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt
      });
      
      const text = response.text || (response.candidates && response.candidates[0].content.parts[0].text);
      res.json({ reply: text.trim() });
    } catch (e: any) {
      console.error("Generate reply error:", e);
      res.status(500).json({ error: e.message });
    }
  });
`;

// Insert it before the Vite middleware setup
const viteIndex = code.indexOf('// Vite middleware for development');
if (viteIndex !== -1) {
    code = code.substring(0, viteIndex) + generateReplyEndpoint + code.substring(viteIndex);
    fs.writeFileSync('server.ts', code);
    console.log("Patched server.ts with /api/generate-reply");
} else {
    console.log("Could not find Vite middleware index");
}
