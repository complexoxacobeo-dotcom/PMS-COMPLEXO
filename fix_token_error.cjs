const fs = require('fs');
let code = fs.readFileSync('src/firebase-backend.js', 'utf8');

code = code.replace(/if \(\!googleAccessToken\) return \[\];/g, 'if (!googleAccessToken) throw new Error("Acceso a Gmail denegado. Pecha a sesión e volve entrar premendo o botón azul de \\"Iniciar sesión con Google\\".");');

fs.writeFileSync('src/firebase-backend.js', code);
console.log("Updated to throw error on missing token");
