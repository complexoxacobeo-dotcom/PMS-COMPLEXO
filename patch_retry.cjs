const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const search = `      const ai = new GoogleGenAI({});
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",`;

const replace = `      const ai = new GoogleGenAI({});
      
      let response;
      let retries = 3;
      let delay = 2000;
      
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-2.0-flash",`;

const searchEnd = `        }
      });
      
      let resultText = response.text || response.candidates[0].content.parts[0].text;`;

const replaceEnd = `        }
          });
          break; // Success, exit retry loop
        } catch (e: any) {
          if (attempt === retries - 1) throw e; // Max retries reached
          if (e.message?.includes("503") || e.message?.includes("429") || e.message?.includes("RESOURCE_EXHAUSTED") || e.message?.includes("UNAVAILABLE") || e.message?.includes("high demand")) {
            console.log(\`API high demand (503/429), retrying in \${delay}ms... (Attempt \${attempt + 1}/\${retries})\`);
            await new Promise(r => setTimeout(r, delay));
            delay *= 2; // Exponential backoff
          } else {
            throw e; // Unhandled error
          }
        }
      }
      
      let resultText = response.text || response.candidates[0].content.parts[0].text;`;

if (code.includes(search) && code.includes(searchEnd)) {
    code = code.replace(search, replace);
    code = code.replace(searchEnd, replaceEnd);
    fs.writeFileSync('server.ts', code);
    console.log("Patched server.ts with retry logic!");
} else {
    console.log("Could not find search strings.");
    if (!code.includes(search)) console.log("Missing search block");
    if (!code.includes(searchEnd)) console.log("Missing searchEnd block");
}
