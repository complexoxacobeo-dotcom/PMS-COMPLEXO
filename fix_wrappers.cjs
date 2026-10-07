const fs = require('fs');
let code = fs.readFileSync('src/firebase-backend.js', 'utf8');

// Find the stray "  } catch(e) {\n      return [];\n    }\n  }" 
code = code.replace(/  \} catch\(e\) \{\s*return \[\];\s*\}\s*\}/g, "");

fs.writeFileSync('src/firebase-backend.js', code);
console.log("Fixed stray catch!");
