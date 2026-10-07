const fs = require('fs');
let code = fs.readFileSync('src/firebase-backend.js', 'utf8');

code = code.replace(/catch\s*\(e\)\s*\{\s*console\.error\(e\);\s*throw\s*e;\s*\}/g, 
`catch (e) {
      if (e && e.code !== 'auth/cancelled-popup-request' && e.code !== 'auth/popup-blocked') {
        console.error(e);
      }
      throw e;
    }`);

fs.writeFileSync('src/firebase-backend.js', code);
console.log("firebase-backend.js patched!");
