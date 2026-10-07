const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (code.includes('gemini-2.0-flash')) {
    code = code.replace(/gemini-2.0-flash/g, 'gemini-3.6-flash');
    fs.writeFileSync('server.ts', code);
    console.log("Patched server.ts with new model!");
} else {
    console.log("Could not find gemini-2.0-flash in server.ts");
}
