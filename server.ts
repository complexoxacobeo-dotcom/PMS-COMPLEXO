import fs from "fs";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Proxy route for iCal
  
  app.post("/api/log-ical", express.json({limit: '50mb'}), (req, res) => {
    fs.writeFileSync('ical_debug.json', JSON.stringify(req.body, null, 2));
    res.json({ ok: true });
  });

  app.get("/api/proxy-ical", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ error: "Missing url" });
      
      const response = await fetch(url, {
         headers: {
             "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
         }
      });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const text = await response.text();
      res.json({ contents: text });
    } catch (e: any) {
      console.error("Proxy error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/parse-import", express.json({limit: '50mb'}), async (req, res) => {
    try {
      const { text, baseRooms } = req.body;
      if (!text) return res.status(400).json({ error: "Missing text" });
      
      const { GoogleGenAI } = await import("@google/genai");
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('No API key provided by environment');
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      let response;
      let retries = 3;
      let delay = 2000;
      
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
        contents: [
          { role: "user", parts: [{ text: `Analiza a seguinte listaxe de reservas pegada polo usuario e extrae todas as reservas.
Identifica as habitacións baseadas nesta lista dispoñible: ${JSON.stringify(baseRooms.map((r: any) => ({id: r.id, name: r.roomName, num: r.number, type: r.type})))}
          
Formato de saída esperado en JSON:
{
  "reservations": [
    {
      "checkIn": "YYYY-MM-DD",
      "checkOut": "YYYY-MM-DD",
      "id": "ID da reserva orixinal",
      "ota": "Axencia/OTA",
      "clientName": "Nome do cliente",
      "phone": "Teléfono",
      "price": 100.0,
      "isDomusCarceris": false,
      "rooms": [
         {
            "baseRoomId": "ID da habitación asignada, debe coincidir coa lista dispoñible ou nulo se non a atopas",
            "rawName": "Nome orixinal da habitación no texto",
            "qty": 1,
            "roomPrice": 50.0,
            "pax": 2,
            "isDomusCarceris": false
         }
      ],
      "services": {
         "breakfast": {"qty": 0, "price": 0.0},
         "dinner": {"qty": 0, "price": 0.0},
         "picnic": {"qty": 0, "price": 0.0},
         "halfBoard": {"qty": 0, "price": 0.0},
         "fullBoard": {"qty": 0, "price": 0.0}
      },
      "observations": "Calquera comentario do cliente ou nota importante (dietas, hora de chegada, etc)."
    }
  ],
  "summary": "Mensaxe en galego resumindo o que se atopou"
}

REGRAS IMPORTANTES (CUMPLE ESTAS REGRAS ESTRITAMENTE):
1. ETIQUETAS DE AXENCIA MÁIS ESTRITAS (OTA): É VITAL que poñas SEMPRE o nome da axencia no campo "ota" se detectas unha (ex: Booking.com, Expedia, Misterplan, Santiago Ways, Follow The Camino, Greenlife Tours, Tee Travel, Galiwonders, Camino de Santiago, etc). Moitas veces a columna "Cliente" contén a Axencia. Neses casos, pon a axencia en "ota", e busca o NOME DO HÓSPEDE REAL (ex: "Ziyu Wang", "Tom Staed") nas notas para poñelo en "clientName". Se non hai nome real, usa o da axencia tamén en "clientName".
2. SERVIZOS EXTRA: Analiza ben se nas notas ou no prezo aparecen almorzos ("Desayuno", "AD"), media pensión ("Media Pensión", "MP"), ceas ou picnics. Engádeos coas súas cantidades ao obxecto "services".
3. ASIGNACIÓN DE HABITACIÓNS E ALBERGUE:
   - Para habitacións privadas (ex. Dobres, Individuais): NUNCA as asignes ao chou. Se o texto non especifica claramente o NÚMERO ou NOME EXACTO da habitación (ex. "Habitación 101"), pon "baseRoomId": null.
   - EXCEPCIÓN ALBERGUES E LITERAS: Se a reserva é para "Cama en habitación compartida", "Albergue", "Cama" ou "Literas", SÍ debes asignar o baseRoomId do Albergue (o que teña type: 'hostel' na túa lista) e usar o campo "qty" para indicar cantas camas son (por defecto 1). O sistema frontend encargarase de encher as camas libres automaticamente comezando polas primeiras!
4. IGNORA AS CONDICIÓNS LEGAIS: Na sección de notas a miúdo aparece "Condiciones para la habitacion Habitación Doble...". IGNORA COMPLETAMENTE iso á hora de contar habitacións. NON crees novas habitacións baseándote nese texto xenérico.
5. AGRUPA A INFORMACIÓN NUNHA SOA RESERVA: O texto principal da reserva e os comentarios (---- data ---- Comentario...) que están xusto debaixo PERTENCEN Á MESMA RESERVA. Xunta todo nun ÚNICO obxecto JSON. NON xeres dúas reservas para a mesma persoa (unha coa habitación e outra coas notas). A habitación e a "observation" deben ir XUNTAS na mesma reserva.
6. HABITACIÓNS DELUX DOMUS CARCERIS / CÁRCEL DE BOOKING: Se no texto da reserva, no tipo de habitación ou nas notas se menciona "Delux Domus Carceris", "Delux Domus", "Deluxe Domus", "Domus Carceris", "Cárcel", "Carcel", "Cárcel de Booking", "Carcel de Booking", ou se a reserva provén de Booking e vai destinada á Cárcel ou Domus, DEBES poñer SEMPRE "isDomusCarceris": true tanto no obxecto de cada habitación (rooms[].isDomusCarceris: true) coma no obxecto principal da reserva (isDomusCarceris: true).


Texto a analizar:
${text.substring(0, 15000)}` }] }
        ],
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
        }
          });
          break; // Success, exit retry loop
        } catch (e: any) {
          if (attempt === retries - 1) throw e; // Max retries reached
          if (e.message?.includes("503") || e.message?.includes("429") || e.message?.includes("RESOURCE_EXHAUSTED") || e.message?.includes("UNAVAILABLE") || e.message?.includes("high demand")) {
            console.log(`API high demand (503/429), retrying in ${delay}ms... (Attempt ${attempt + 1}/${retries})`);
            await new Promise(r => setTimeout(r, delay));
            delay *= 2; // Exponential backoff
          } else {
            throw e; // Unhandled error
          }
        }
      }
      
      let resultText = response.text || response.candidates[0].content.parts[0].text;
      // Extract JSON if wrapped in markdown
      const match = resultText.match(/```(?:json)?\n?([\s\S]*?)```/);
      if (match) {
        resultText = match[1].trim();
      }
      
      let data;
      try {
        data = JSON.parse(resultText);
        if (data && Array.isArray(data.reservations)) {
          data.reservations.forEach((r: any) => {
            const rawRoomsStr = (r.rooms || []).map((rm: any) => rm.rawName || '').join(' ');
            const fullText = `${r.clientName || ''} ${r.rawName || ''} ${r.ota || ''} ${r.observations || ''} ${rawRoomsStr}`.toLowerCase();
            if (/domus\s*carcer|delux[e]?\s*domus/i.test(fullText)) {
              r.isDomusCarceris = true;
              if (r.rooms) {
                r.rooms.forEach((rm: any) => { rm.isDomusCarceris = true; });
              }
            }
          });
        }
      } catch (e) {
        data = { reservations: [], summary: "Erro parseando a resposta da IA." };
      }
      
      res.json(data);
    } catch (e: any) {
      if (e.message?.includes("429") || e.message?.includes("quota") || e.message?.includes("RESOURCE_EXHAUSTED")) {
        console.log("API quota/rate limit reached. Handled gracefully.");
        return res.status(429).json({ error: "Límite de uso gratuíto superado. Por favor, configura un plan de pago ou agarda para volver tentar." });
      }
      if (e.message?.includes("503") || e.message?.includes("UNAVAILABLE") || e.message?.includes("high demand")) {
        console.log("API 503 high demand. Handled gracefully.");
        return res.status(503).json({ error: "O modelo de IA está experimentando unha alta demanda temporal. Por favor, agarda uns intres e volve tentalo máis tarde." });
      }
      console.error("Parse error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  
  app.post("/api/generate-reply", express.json(), async (req, res) => {
    try {
      const { emailData } = req.body;
      if (!emailData) return res.status(400).json({ error: "Missing emailData" });
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('No API key provided by environment');
      
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const prompt = `Vostede é o/a recepcionista do Complexo Xacobeo / Hotel Triacastela. 
Recibiuse o seguinte correo electrónico solicitando unha reserva ou dispoñibilidade:

Remitente: ${emailData.sender}
Asunto: ${emailData.subject}
Corpo do correo:
${emailData.body}

Xera unha resposta profesional, próxima e breve para este correo.
REGRAS MOI IMPORTANTES:
1. Usa a información do correo para xerar unha resposta ÚNICA E PERSONALIZADA. Saúda ao cliente polo seu nome (se aparece), e menciona as datas ou o tipo de habitación que solicita para demostrar que liches o seu correo. 
2. NON confirmes que hai dispoñibilidade nin inventes prezos. Remata a túa mensaxe indicando de forma prudente e profesional que estás a comprobar a dispoñibilidade e que lle confirmarás os detalles o antes posible (le confirmaremos los detalles a la mayor brevedad / we will get back to you shortly).
3. O idioma da túa resposta debe ser o mesmo idioma que o do correo orixinal.
4. As firmas deben ser exactamente:
Se o correo fai referencia ao "Complexo Xacobeo":
Un saludo,
Chus
Complexo Xacobeo

Se o correo fai referencia ao "Hotel Triacastela" ou "Boutique Vila de Triacastela":
Un saludo,
Chus
Hotel Triacastela

(Adáptao un pouco ao idioma se é inglés, por exemplo "Best regards, Chus...").
5. ATENCIÓN A AXENCIAS: Se o correo provén de Booking, Expedia, Airbnb, etc., diríxete polo seu nome ao HÓSPEDE REAL (que adoita vir no corpo do texto), non á axencia. Menciona as datas da reserva ou o tipo de habitación para que a mensaxe sexa única e non repetitiva.\nDevolve ÚNICAMENTE o texto da resposta, sen comiñas nin formatos markdown.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt, config: { temperature: 0.8 }
      });
      
      const text = response.text || (response.candidates && response.candidates[0].content.parts[0].text);
      res.json({ reply: text.trim() });
    } catch (e: any) {
      console.error("Generate reply error:", e);
      if (e.message?.includes("429") || e.message?.includes("quota") || e.message?.includes("RESOURCE_EXHAUSTED")) {
        return res.status(429).json({ error: "Límite de uso da IA superado (máx 5 por minuto na capa gratuita). Por favor, agarda un pouco para volver tentar." });
      }
      if (e.message?.includes("503") || e.message?.includes("UNAVAILABLE") || e.message?.includes("high demand")) {
        return res.status(503).json({ error: "O modelo de IA está experimentando unha alta demanda temporal. Por favor, agarda uns intres e volve tentalo máis tarde." });
      }
      res.status(500).json({ error: e.message });
    }
  });
// Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
