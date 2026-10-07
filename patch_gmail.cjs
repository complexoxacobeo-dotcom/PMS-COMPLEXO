const fs = require('fs');
let code = fs.readFileSync('src/firebase-backend.js', 'utf8');

// Remove gmail.modify
code = code.replace(/provider\.addScope\('https:\/\/www\.googleapis\.com\/auth\/gmail\.modify'\);\n?/g, '');

// Remove modify calls inside propagarReserva and autoAssignReservation
const modifyPattern = /if\s*\(resObj\.msgId\s*&&\s*googleAccessToken\)\s*\{\s*try\s*\{\s*await\s*fetch\(`https:\/\/gmail\.googleapis\.com\/gmail\/v1\/users\/me\/messages\/\$\{resObj\.msgId\}\/modify`.*?catch\(e\)\s*\{\s*(console\.error\("Failed to mark as read"\);\s*)?\}\s*\}/gs;
code = code.replace(modifyPattern, '');

fs.writeFileSync('src/firebase-backend.js', code);
console.log("Patched firebase-backend.js basic modifies");
