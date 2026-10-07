const fs = require('fs');
let code = fs.readFileSync('src/firebase-backend.js', 'utf8');

code = code.replace(/if \(\!searchData\.messages\) return \[\];/g, 'if (searchData.error) throw new Error("Erro de permisos de Gmail: " + (searchData.error.message || "Acceso denegado."));\\n      if (!searchData.messages) return [];');

fs.writeFileSync('src/firebase-backend.js', code);
console.log("Added Gmail API error check");
