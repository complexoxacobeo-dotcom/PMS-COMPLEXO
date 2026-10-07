const fs = require('fs');
let code = fs.readFileSync('src/firebase-backend.js', 'utf8');

const stray = `  } catch(e) {
      return [];
    }
  }`;
code = code.replace(stray, "");

fs.writeFileSync('src/firebase-backend.js', code);
console.log("Fixed stray catch!");
